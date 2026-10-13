import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import connectDB from "./db.js";
import Task from "./model/Task.js";
import mongoose from "mongoose";

const app = express();
app.use(express.json());


connectDB();


app.post("/mcp", async (req, res) => {
  const server = new McpServer({
    name: "lifepilot-server",
    version: "1.0.0",
  });


server.registerTool(
  "create_task",
  {
    description:
      "Create a LifePilot task with optional subtasks, goal, priority, duration, scheduled date, and deadline",

    inputSchema: {
      title: z.string().trim().min(1).max(200),

      priority: z.enum(["low", "medium", "high"]).default("medium"),

      goal: z.string().trim().max(200).optional(),

      durationMinutes: z.number().int().positive().optional(),

      scheduledDate: z.string().datetime().optional(),

      deadline: z.string().datetime().optional(),

      subtasks: z
        .array(
          z.object({
            title: z.string().trim().min(1).max(200),

            durationMinutes: z.number().int().positive().optional(),
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
        goal,
        durationMinutes,

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
              task,
            }),
          },
        ],
      };
    } catch (error) {
      console.error("Task creation failed:", error);

      return {
        content: [
          {
            type: "text",
            text: "Failed to create task. Please try again.",
          },
        ],
        isError: true,
      };
    }
  },
);

server.registerTool(
  "list_tasks",
  {
    description:
      "Retrieve LifePilot tasks filtered by status and/or goal",

    inputSchema: {
      status: z.enum(["pending", "completed", "all"]).optional(),
      goal: z.string().trim().max(200).optional(),
    },
  },

  async ({ status = "all", goal }) => {
    try {
      const filter = {};

      // Filter tasks by their completion status.
      if (status !== "all") {
        filter.status = status;
      }

      // Filter tasks by goal, ignoring letter case.
      if (goal) {
        filter.goal = {
          $regex: `^${goal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        };
      }

      const tasks = await Task.find(filter).sort({
        scheduledDate: 1,
        createdAt: -1,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: tasks.length,
              tasks,
            }),
          },
        ],
      };
    } catch (error) {
      console.error("Failed to retrieve tasks:", error);

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
  }
);

server.registerTool(
  "complete_task",
  {
    description: "Mark a LifePilot task as completed using its task ID",
    inputSchema: {
      taskId: z.string().min(1),
    },
  },
  async ({ taskId }) => {
    try {
      if (!mongoose.isValidObjectId(taskId)) {
        return {
          content: [
            {
              type: "text",
              text: "Invalid task ID.",
            },
          ],
          isError: true,
        };
      }

      const task = await Task.findByIdAndUpdate(
        taskId,
        { status: "completed" },
        { new: true, runValidators: true }
      );

      if (!task) {
        return {
          content: [
            {
              type: "text",
              text: "Task not found.",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "Task marked as completed successfully",
              task,
            }),
          },
        ],
      };
    } catch (error) {
      console.error("Failed to complete task:", error);

      return {
        content: [
          {
            type: "text",
            text: "Failed to complete task.",
          },
        ],
        isError: true,
      };
    }
  }
);


server.registerTool(
  "delete_task",
  {
    description: "Delete a LifePilot task using its MongoDB task ID",
    inputSchema: {
      taskId: z.string().min(1),
    },
  },
  async ({ taskId }) => {
    try {
      if (!mongoose.isValidObjectId(taskId)) {
        return {
          content: [
            {
              type: "text",
              text: "Invalid task ID.",
            },
          ],
          isError: true,
        };
      }

      const task = await Task.findByIdAndDelete(taskId);

      if (!task) {
        return {
          content: [
            {
              type: "text",
              text: "Task not found.",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "Task deleted successfully",
              task,
            }),
          },
        ],
      };
    } catch (error) {
      console.error("Failed to delete task:", error);

      return {
        content: [
          {
            type: "text",
            text: "Failed to delete task.",
          },
        ],
        isError: true,
      };
    }
  }
);






  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);

    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  } finally {
    await transport.close();
    await server.close();
  }
});

app.listen(3000, () => {
  console.log("MCP server running at http://localhost:3000/mcp");
});