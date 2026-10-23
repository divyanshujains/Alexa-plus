import express from "express";
import mongoose from "mongoose";
import Task from "../model/Task.js";
import {
  isValidObjectId,
  formatTaskCompact,
  formatTaskListCompact,
} from "../utils/validation.js";
import { generateDailyPlan } from "../utils/planner.js";
import { askLifePilot, convertMcpTools, mcpClient, transport } from "../agent.js";
import { createMcpServer } from "../index.js";
import { safeLogger } from "../utils/logging.js";
import { formatSafeErrorMessage } from "../utils/errors.js";

const router = express.Router();

// Cache for converted MCP tools
let cachedMcpTools = null;

async function getMcpTools() {
  if (cachedMcpTools) return cachedMcpTools;
  try {
    // If mcpClient is not yet connected, connect it
    if (!mcpClient.transport) {
      await mcpClient.connect(transport);
    }
    const { tools } = await mcpClient.listTools();
    cachedMcpTools = convertMcpTools(tools);
    return cachedMcpTools;
  } catch (err) {
    safeLogger.warn("Connecting to external MCP failed, using in-memory tool definitions for agent:", err.message);
    // Fallback: extract tool definitions from local McpServer instance
    const localServer = createMcpServer();
    const localTools = Object.entries(localServer._registeredTools || {}).map(([name, def]) => ({
      name,
      description: def.description,
      inputSchema: def.inputSchema,
    }));
    cachedMcpTools = convertMcpTools(localTools);
    return cachedMcpTools;
  }
}

// 1. Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "lifepilot-api",
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 2. List tasks (with filtering & search)
router.get("/tasks", async (req, res) => {
  try {
    const { status = "all", goal, priority, search } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    if (goal) {
      filter.goal = {
        $regex: `^${goal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    if (search) {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: sanitizedSearch, $options: "i" } },
        { goal: { $regex: sanitizedSearch, $options: "i" } },
        { "subtasks.title": { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const tasks = await Task.find(filter)
      .sort({ scheduledDate: 1, createdAt: -1 })
      .lean();

    const formatted = formatTaskListCompact(tasks);
    res.json({ count: formatted.length, tasks: formatted });
  } catch (error) {
    safeLogger.error("API GET /tasks error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 3. Create task
router.post("/tasks", async (req, res) => {
  try {
    const {
      title,
      goal,
      priority = "medium",
      durationMinutes,
      scheduledDate,
      deadline,
      subtasks = [],
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const task = await Task.create({
      title: title.trim(),
      goal: goal ? goal.trim() : null,
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      deadline: deadline ? new Date(deadline) : null,
      subtasks: Array.isArray(subtasks)
        ? subtasks
            .filter((st) => st && st.title && st.title.trim())
            .map((st) => ({
              title: st.title.trim(),
              durationMinutes: st.durationMinutes ? Number(st.durationMinutes) : null,
              status: st.status === "completed" ? "completed" : "pending",
            }))
        : [],
    });

    res.status(201).json({
      message: "Task created successfully",
      task: formatTaskCompact(task),
    });
  } catch (error) {
    safeLogger.error("API POST /tasks error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 4. Get single task
router.get("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const task = await Task.findById(id).lean();
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ task: formatTaskCompact(task) });
  } catch (error) {
    safeLogger.error("API GET /tasks/:id error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 5. Update task
router.put("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const {
      title,
      goal,
      priority,
      status,
      durationMinutes,
      scheduledDate,
      deadline,
      subtasks,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (goal !== undefined) updateData.goal = goal ? goal.trim() : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes ? Number(durationMinutes) : null;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (Array.isArray(subtasks)) {
      updateData.subtasks = subtasks.map((st) => ({
        title: st.title.trim(),
        durationMinutes: st.durationMinutes ? Number(st.durationMinutes) : null,
        status: st.status === "completed" ? "completed" : "pending",
        completedAt: st.completedAt ? new Date(st.completedAt) : null,
      }));
    }

    const task = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({
      message: "Task updated successfully",
      task: formatTaskCompact(task),
    });
  } catch (error) {
    safeLogger.error("API PUT /tasks/:id error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 6. Complete task
router.patch("/tasks/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const task = await Task.findByIdAndUpdate(
      id,
      {
        status: "completed",
        $set: { "subtasks.$[].status": "completed" },
      },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({
      message: "Task marked as completed",
      task: formatTaskCompact(task),
    });
  } catch (error) {
    safeLogger.error("API PATCH /tasks/:id/complete error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 7. Complete subtask
router.patch("/tasks/:id/subtasks/:subtaskTitle/complete", async (req, res) => {
  try {
    const { id, subtaskTitle } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        "subtasks.title": subtaskTitle,
        "subtasks.status": "pending",
      },
      {
        $set: {
          "subtasks.$.status": "completed",
          "subtasks.$.completedAt": new Date(),
        },
      },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({
        error: "Task or pending subtask not found.",
      });
    }

    // Check if all subtasks are now completed
    const allCompleted =
      task.subtasks.length > 0 &&
      task.subtasks.every((st) => st.status === "completed");

    if (allCompleted && task.status !== "completed") {
      task.status = "completed";
      await task.save();
    }

    res.json({
      message: "Subtask completed successfully",
      task: formatTaskCompact(task),
    });
  } catch (error) {
    safeLogger.error("API PATCH complete subtask error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 8. Delete task
router.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({
      message: "Task deleted successfully",
      task: formatTaskCompact(task),
    });
  } catch (error) {
    safeLogger.error("API DELETE /tasks/:id error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 9. Get Today's tasks
router.get("/tasks-today", async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      status: "pending",
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    res.json({
      date: startOfDay.toISOString(),
      count: tasks.length,
      tasks: formatTaskListCompact(tasks),
    });
  } catch (error) {
    safeLogger.error("API GET /tasks-today error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 10. Get Overdue tasks
router.get("/tasks-overdue", async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      status: "pending",
      deadline: { $ne: null, $lt: now },
    })
      .sort({ deadline: 1 })
      .lean();

    res.json({
      count: tasks.length,
      tasks: formatTaskListCompact(tasks),
    });
  } catch (error) {
    safeLogger.error("API GET /tasks-overdue error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 11. Grounded Daily Planner
router.get("/planner/today", async (req, res) => {
  try {
    const availableMinutes = Number(req.query.availableMinutes) || 240;
    const userStartTime = req.query.userStartTime || null;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayTasks = await Task.find({
      status: "pending",
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    const overdueTasks = await Task.find({
      status: "pending",
      deadline: { $ne: null, $lt: now },
    })
      .sort({ deadline: 1 })
      .lean();

    const pendingTasks = await Task.find({
      status: "pending",
      scheduledDate: null,
    }).lean();

    const plan = generateDailyPlan({
      todayTasks: formatTaskListCompact(todayTasks),
      overdueTasks: formatTaskListCompact(overdueTasks),
      pendingTasks: formatTaskListCompact(pendingTasks),
      availableMinutes,
      userStartTime,
    });

    res.json(plan);
  } catch (error) {
    safeLogger.error("API GET /planner/today error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 12. Goals summary
router.get("/goals/summary", async (req, res) => {
  try {
    const tasks = await Task.find({ goal: { $ne: null, $exists: true } }).lean();

    const goalMap = new Map();
    for (const t of tasks) {
      if (!t.goal) continue;
      if (!goalMap.has(t.goal)) {
        goalMap.set(t.goal, {
          goal: t.goal,
          totalTasks: 0,
          completedTasks: 0,
          totalSubtasks: 0,
          completedSubtasks: 0,
          tasks: [],
        });
      }
      const entry = goalMap.get(t.goal);
      entry.totalTasks++;
      if (t.status === "completed") entry.completedTasks++;

      const subtasks = t.subtasks || [];
      entry.totalSubtasks += subtasks.length;
      entry.completedSubtasks += subtasks.filter((s) => s.status === "completed").length;
      entry.tasks.push(formatTaskCompact(t));
    }

    const goals = Array.from(goalMap.values()).map((g) => {
      const taskProgress = g.totalTasks === 0 ? 0 : Number(((g.completedTasks / g.totalTasks) * 100).toFixed(1));
      const subtaskProgress =
        g.totalSubtasks === 0
          ? taskProgress
          : Number(((g.completedSubtasks / g.totalSubtasks) * 100).toFixed(1));
      return {
        ...g,
        progressPercentage: subtaskProgress,
        pendingTasks: g.totalTasks - g.completedTasks,
      };
    });

    res.json({ count: goals.length, goals });
  } catch (error) {
    safeLogger.error("API GET /goals/summary error:", error);
    res.status(500).json({ error: formatSafeErrorMessage(error) });
  }
});

// 13. Conversational AI Assistant
router.post("/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const tools = await getMcpTools();
    const result = await askLifePilot(message.trim(), tools, {
      conversationHistory,
    });

    res.json({
      response: result.response,
      metrics: result.metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    safeLogger.error("API POST /chat error:", error);
    res.status(500).json({
      error: formatSafeErrorMessage(error),
      fallbackResponse: "I encountered an issue processing your request. Please ensure the MCP server and database are connected.",
    });
  }
});

export default router;
