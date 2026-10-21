import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import connectDB from "./db.js";
import Task from "./model/Task.js";
import mongoose from "mongoose";
import {
  isValidObjectId,
  formatTaskCompact,
  formatTaskListCompact,
} from "./utils/validation.js";
import { safeLogger } from "./utils/logging.js";
import { formatSafeErrorMessage } from "./utils/errors.js";

/**
 * Registers all LifePilot productivity tools on the given McpServer instance.
 * @param {McpServer} server
 */
export function registerAllTools(server) {
  // 1. Create Task
  server.registerTool(
    "create_task",
    {
      description:
        "Create a task with optional subtasks, goal, priority, durationMinutes, scheduledDate, and deadline. For multi-day plans, include scheduledDate as the start date and deadline as the final date in ISO-8601 format.",
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        goal: z.string().trim().max(200).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        durationMinutes: z.number().int().min(1).optional(),
        scheduledDate: z.string().datetime().optional(),
        deadline: z.string().datetime().optional(),
        subtasks: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(200),
              durationMinutes: z.number().int().min(1).optional(),
            }),
          )
          .optional(),
      },
    },
    async ({
      title,
      priority = "medium",
      goal,
      durationMinutes,
      scheduledDate,
      deadline,
      subtasks = [],
    }) => {
      try {
        const task = await Task.create({
          title,
          priority,
          goal: goal ?? null,
          durationMinutes: durationMinutes ?? null,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          deadline: deadline ? new Date(deadline) : null,
          subtasks: subtasks.map((subtask) => ({
            title: subtask.title,
            durationMinutes: subtask.durationMinutes ?? null,
          })),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Task and subtasks created successfully",
                task: formatTaskCompact(task),
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Task creation failed:", error);
        return {
          content: [
            {
              type: "text",
              text: formatSafeErrorMessage(error),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 2. Complete Subtask
  server.registerTool(
    "complete_subtask",
    {
      description:
        "Mark a specific subtask as completed using its parent task ID and subtask title.",
      inputSchema: {
        taskId: z.string().min(1),
        subtaskTitle: z.string().trim().min(1).max(200),
      },
    },
    async ({ taskId, subtaskTitle }) => {
      try {
        if (!isValidObjectId(taskId)) {
          return {
            content: [{ type: "text", text: "Invalid task ID." }],
            isError: true,
          };
        }

        const task = await Task.findOneAndUpdate(
          {
            _id: taskId,
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
          return {
            content: [
              {
                type: "text",
                text: "Task or pending subtask not found. Check the task ID and subtask title.",
              },
            ],
            isError: true,
          };
        }

        // Check if all subtasks are now completed; if so, complete parent task
        const allCompleted =
          task.subtasks.length > 0 &&
          task.subtasks.every((st) => st.status === "completed");

        if (allCompleted && task.status !== "completed") {
          task.status = "completed";
          await task.save();
        }

        const completedSubtask = task.subtasks.find(
          (st) => st.title === subtaskTitle && st.status === "completed",
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Subtask completed successfully.",
                taskId: task._id.toString(),
                taskTitle: task.title,
                parentStatus: task.status,
                subtask: {
                  title: completedSubtask.title,
                  status: completedSubtask.status,
                  completedAt: completedSubtask.completedAt,
                },
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to complete subtask:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to complete subtask: ${formatSafeErrorMessage(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 3. Complete Task
  server.registerTool(
    "complete_task",
    {
      description:
        "Mark an entire task as completed using its MongoDB task ID. First use list_tasks to find the task ID if needed.",
      inputSchema: {
        taskId: z.string().min(1),
      },
    },
    async ({ taskId }) => {
      try {
        if (!isValidObjectId(taskId)) {
          return {
            content: [{ type: "text", text: "Invalid task ID." }],
            isError: true,
          };
        }

        const task = await Task.findByIdAndUpdate(
          taskId,
          {
            status: "completed",
            $set: { "subtasks.$[].status": "completed" },
          },
          { new: true, runValidators: true },
        );

        if (!task) {
          return {
            content: [{ type: "text", text: "Task not found." }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Task marked as completed successfully",
                task: formatTaskCompact(task),
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to complete task:", error);
        return {
          content: [{ type: "text", text: "Failed to complete task." }],
          isError: true,
        };
      }
    },
  );

  // 4. List Tasks
  server.registerTool(
    "list_tasks",
    {
      description:
        "Retrieve LifePilot tasks filtered by status ('pending', 'completed', 'all') and/or goal.",
      inputSchema: {
        status: z.enum(["pending", "completed", "all"]).optional(),
        goal: z.string().trim().max(200).optional(),
      },
    },
    async ({ status = "all", goal }) => {
      try {
        const filter = {};
        if (status !== "all") {
          filter.status = status;
        }

        if (goal) {
          filter.goal = {
            $regex: `^${goal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          };
        }

        const tasks = await Task.find(filter)
          .sort({ scheduledDate: 1, createdAt: -1 })
          .lean();

        const formatted = formatTaskListCompact(tasks);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: formatted.length,
                tasks: formatted,
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to retrieve tasks:", error);
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve tasks. Please try again.",
            },
          ],
          isError: true,
        };
      }
    },
  );

  // 5. Get Task Progress
  server.registerTool(
    "get_task_progress",
    {
      description:
        "Calculate task progress using its subtasks. Find the task by MongoDB ID and return completed/pending subtasks and percentage.",
      inputSchema: {
        taskId: z.string().min(1),
      },
    },
    async ({ taskId }) => {
      try {
        if (!isValidObjectId(taskId)) {
          return {
            content: [{ type: "text", text: "Invalid task ID." }],
            isError: true,
          };
        }

        const task = await Task.findById(taskId).lean();
        if (!task) {
          return {
            content: [{ type: "text", text: "Task not found." }],
            isError: true,
          };
        }

        const totalSubtasks = (task.subtasks ?? []).length;
        const completedSubtasks = (task.subtasks ?? []).filter(
          (s) => s.status === "completed",
        ).length;
        const pendingSubtasks = totalSubtasks - completedSubtasks;
        const progressPercentage =
          totalSubtasks === 0
            ? task.status === "completed"
              ? 100
              : 0
            : Number(((completedSubtasks / totalSubtasks) * 100).toFixed(2));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                taskId: task._id.toString(),
                taskTitle: task.title,
                status: task.status,
                totalSubtasks,
                completedSubtasks,
                pendingSubtasks,
                progressPercentage,
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to calculate task progress:", error);
        return {
          content: [
            { type: "text", text: "Failed to calculate task progress." },
          ],
          isError: true,
        };
      }
    },
  );

  // 6. Get Goal Progress
  server.registerTool(
    "get_goal_progress",
    {
      description:
        "Calculate overall progress for a goal, including task completion and subtask progress.",
      inputSchema: {
        goal: z.string().trim().min(1).max(200),
      },
    },
    async ({ goal }) => {
      try {
        const tasks = await Task.find({
          goal: {
            $regex: `^${goal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        }).lean();

        if (tasks.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No tasks found for the goal "${goal}".`,
              },
            ],
            isError: true,
          };
        }

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(
          (t) => t.status === "completed",
        ).length;
        const pendingTasks = totalTasks - completedTasks;

        let totalSubtasks = 0;
        let completedSubtasks = 0;
        for (const t of tasks) {
          const subtasks = t.subtasks ?? [];
          totalSubtasks += subtasks.length;
          completedSubtasks += subtasks.filter(
            (st) => st.status === "completed",
          ).length;
        }

        const pendingSubtasks = totalSubtasks - completedSubtasks;
        const subtaskProgress =
          totalSubtasks === 0
            ? Number(((completedTasks / totalTasks) * 100).toFixed(2))
            : Number(((completedSubtasks / totalSubtasks) * 100).toFixed(2));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                goal,
                totalTasks,
                completedTasks,
                pendingTasks,
                totalSubtasks,
                completedSubtasks,
                pendingSubtasks,
                progressPercentage: subtaskProgress,
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to calculate goal progress:", error);
        return {
          content: [
            { type: "text", text: "Failed to calculate goal progress." },
          ],
          isError: true,
        };
      }
    },
  );

  // 7. Delete Task
  server.registerTool(
    "delete_task",
    {
      description: "Delete a LifePilot task using its MongoDB task ID.",
      inputSchema: {
        taskId: z.string().min(1),
      },
    },
    async ({ taskId }) => {
      try {
        if (!isValidObjectId(taskId)) {
          return {
            content: [{ type: "text", text: "Invalid task ID." }],
            isError: true,
          };
        }

        const task = await Task.findByIdAndDelete(taskId);
        if (!task) {
          return {
            content: [{ type: "text", text: "Task not found." }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Task deleted successfully",
                task: formatTaskCompact(task),
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to delete task:", error);
        return {
          content: [{ type: "text", text: "Failed to delete task." }],
          isError: true,
        };
      }
    },
  );

  // 8. Schedule Task
  server.registerTool(
    "schedule_task",
    {
      description:
        "Schedule a task for today or a future date. Use list_tasks first to find the MongoDB ID.",
      inputSchema: {
        taskId: z.string().min(1),
        scheduledDate: z.string().datetime(),
      },
    },
    async ({ taskId, scheduledDate }) => {
      try {
        if (!isValidObjectId(taskId)) {
          return {
            content: [{ type: "text", text: "Invalid task ID." }],
            isError: true,
          };
        }

        const date = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const requestedDate = new Date(date);
        requestedDate.setHours(0, 0, 0, 0);

        if (requestedDate < today) {
          return {
            content: [
              {
                type: "text",
                text: "Cannot schedule a task for a past date. Choose today or a future date.",
              },
            ],
            isError: true,
          };
        }

        const task = await Task.findByIdAndUpdate(
          taskId,
          { scheduledDate: date },
          { new: true, runValidators: true },
        );

        if (!task) {
          return {
            content: [{ type: "text", text: "Task not found." }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Task scheduled successfully.",
                task: formatTaskCompact(task),
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to schedule task:", error);
        return {
          content: [{ type: "text", text: "Failed to schedule task." }],
          isError: true,
        };
      }
    },
  );

  // 9. Get Overdue Tasks
  server.registerTool(
    "get_overdue_tasks",
    {
      description:
        "Get all pending tasks whose deadlines have passed. Returns title, deadline, priority, status, and goal.",
      inputSchema: {},
    },
    async () => {
      try {
        const now = new Date();
        const tasks = await Task.find({
          status: "pending",
          deadline: { $ne: null, $lt: now },
        })
          .sort({ deadline: 1 })
          .lean();

        const formatted = formatTaskListCompact(tasks);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                count: formatted.length,
                tasks: formatted,
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to fetch overdue tasks:", error);
        return {
          content: [
            { type: "text", text: "Failed to fetch overdue tasks." },
          ],
          isError: true,
        };
      }
    },
  );

  // 10. Update Deadline
  server.registerTool(
    "update_deadline",
    {
      description:
        "Set or update a task's deadline. Use list_tasks first to find the MongoDB ID.",
      inputSchema: {
        taskId: z.string().min(1),
        deadline: z.string().datetime(),
      },
    },
    async ({ taskId, deadline }) => {
      try {
        if (!isValidObjectId(taskId)) {
          return {
            content: [{ type: "text", text: "Invalid task ID." }],
            isError: true,
          };
        }

        const date = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const requestedDate = new Date(date);
        requestedDate.setHours(0, 0, 0, 0);

        if (requestedDate < today) {
          return {
            content: [
              {
                type: "text",
                text: "Deadline cannot be in the past. Choose today or a future date.",
              },
            ],
            isError: true,
          };
        }

        const task = await Task.findByIdAndUpdate(
          taskId,
          { deadline: date },
          { new: true, runValidators: true },
        );

        if (!task) {
          return {
            content: [{ type: "text", text: "Task not found." }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                message: "Deadline updated successfully.",
                task: formatTaskCompact(task),
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to update deadline:", error);
        return {
          content: [{ type: "text", text: "Failed to update deadline." }],
          isError: true,
        };
      }
    },
  );

  // 11. Get Today Tasks
  server.registerTool(
    "get_today_tasks",
    {
      description:
        "Get pending tasks scheduled for today, including priority, deadline, duration, and subtasks.",
      inputSchema: {},
    },
    async () => {
      try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const tasks = await Task.find({
          status: "pending",
          scheduledDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).lean();

        const formatted = formatTaskListCompact(tasks);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                date: startOfDay.toISOString(),
                count: formatted.length,
                tasks: formatted,
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to fetch today's tasks:", error);
        return {
          content: [{ type: "text", text: "Failed to fetch today's tasks." }],
          isError: true,
        };
      }
    },
  );

  // 12. Plan My Day
  server.registerTool(
    "plan_my_day",
    {
      description:
        "Gather today's pending tasks and overdue tasks for creating a grounded daily plan. Use when user asks to plan their day.",
      inputSchema: {},
    },
    async () => {
      try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const todayTasks = await Task.find({
          status: "pending",
          scheduledDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        }).lean();

        const overdueTasks = await Task.find({
          status: "pending",
          deadline: {
            $ne: null,
            $lt: now,
          },
        })
          .sort({ deadline: 1 })
          .lean();

        const todayIds = new Set(todayTasks.map((t) => t._id.toString()));
        const uniqueOverdue = overdueTasks.filter(
          (t) => !todayIds.has(t._id.toString()),
        );

        const formattedToday = formatTaskListCompact(todayTasks);
        const formattedOverdue = formatTaskListCompact(uniqueOverdue);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                date: startOfDay.toISOString(),
                generatedAt: now.toISOString(),
                todayCount: formattedToday.length,
                overdueCount: formattedOverdue.length,
                todayTasks: formattedToday,
                overdueTasks: formattedOverdue,
                instruction:
                  "Prioritize overdue tasks first, then high-priority tasks and approaching deadlines. Respect time budget, label missing duration estimates clearly, and use numbered sessions if no start time is provided.",
              }),
            },
          ],
        };
      } catch (error) {
        safeLogger.error("Failed to prepare daily plan:", error);
        return {
          content: [
            { type: "text", text: "Failed to prepare the daily plan." },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Creates and configures a new McpServer instance with all registered tools.
 * @returns {McpServer}
 */
export function createMcpServer() {
  const server = new McpServer({
    name: "lifepilot-server",
    version: "1.0.0",
  });
  registerAllTools(server);
  return server;
}

/**
 * Creates and configures the Express application.
 * @returns {express.Application}
 */
export function createApp() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "lifepilot-server",
      timestamp: new Date().toISOString(),
    });
  });

  // MCP endpoint with StreamableHTTPServerTransport
  app.post("/mcp", async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      safeLogger.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    } finally {
      await transport.close();
      await server.close();
    }
  });

  return app;
}

import { fileURLToPath } from "node:url";

const app = createApp();
const PORT = process.env.PORT || 3000;

// Start HTTP server and connect DB only if executed directly as main entry point
let serverInstance = null;
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  connectDB().catch((err) => {
    safeLogger.error("MongoDB initial connection error:", err.message);
  });

  serverInstance = app.listen(PORT, () => {
    safeLogger.info(`LifePilot MCP server running at http://localhost:${PORT}/mcp`);
  });

  const handleShutdown = async () => {
    safeLogger.info("Shutting down LifePilot MCP server gracefully...");
    if (serverInstance) {
      serverInstance.close(() => {
        safeLogger.info("HTTP server closed.");
      });
    }
    try {
      await mongoose.disconnect();
      safeLogger.info("MongoDB disconnected.");
    } catch (err) {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}

export default app;
