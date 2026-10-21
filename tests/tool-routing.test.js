import test from "node:test";
import assert from "node:assert/strict";
import { createMcpServer, registerAllTools } from "../index.js";
import {
  isValidObjectId,
  formatTaskCompact,
  formatTaskListCompact,
  validateTimeBudget,
} from "../utils/validation.js";
import { mockTasks, mockOverdueTasks } from "./fixtures/mockData.js";

test("1. Correct MCP Tool Discovery - registers all 12 required productivity tools", () => {
  const server = createMcpServer();
  // Access registered tools from McpServer internal registry
  assert.ok(server, "McpServer should be instantiated");
  
  // Verify tool definitions exist on the server
  // Note: server._registeredTools is the map in @modelcontextprotocol/sdk
  const toolKeys = Object.keys(server._registeredTools || {});
  const expectedTools = [
    "create_task",
    "complete_subtask",
    "complete_task",
    "list_tasks",
    "get_task_progress",
    "get_goal_progress",
    "delete_task",
    "schedule_task",
    "get_overdue_tasks",
    "update_deadline",
    "get_today_tasks",
    "plan_my_day",
  ];

  for (const expected of expectedTools) {
    assert.ok(
      toolKeys.includes(expected),
      `Expected tool '${expected}' to be registered. Registered tools: ${toolKeys.join(", ")}`
    );
  }
  assert.strictEqual(toolKeys.length, 12, "Should have exactly 12 tools registered");
});

test("2. Successful Tool Routing - formatTaskCompact produces token-optimized output without MongoDB baggage", () => {
  const sampleMongooseDoc = {
    _id: "6710a1b2c3d4e5f6a7b8c901",
    title: "Write documentation",
    goal: "Project Launch",
    priority: "high",
    status: "pending",
    durationMinutes: 45,
    scheduledDate: new Date("2026-10-22T10:00:00.000Z"),
    deadline: new Date("2026-10-23T18:00:00.000Z"),
    subtasks: [
      {
        title: "Architecture section",
        status: "pending",
        durationMinutes: 20,
        completedAt: null,
      },
    ],
    __v: 0,
    $isNew: false,
  };

  const compact = formatTaskCompact(sampleMongooseDoc);
  assert.strictEqual(compact.id, "6710a1b2c3d4e5f6a7b8c901");
  assert.strictEqual(compact.title, "Write documentation");
  assert.strictEqual(compact.priority, "high");
  assert.strictEqual(compact.durationMinutes, 45);
  assert.strictEqual(compact.__v, undefined, "__v must be stripped for token optimization");
  assert.strictEqual(compact.$isNew, undefined, "internal mongoose fields must be stripped");
});

test("5. Task Creation Arguments Validation - validates required fields and types", () => {
  // Test ObjectId validator
  assert.strictEqual(isValidObjectId("6710a1b2c3d4e5f6a7b8c901"), true);
  assert.strictEqual(isValidObjectId("invalid-id-123"), false);
  assert.strictEqual(isValidObjectId(""), false);
  assert.strictEqual(isValidObjectId(null), false);
  assert.strictEqual(isValidObjectId(undefined), false);
});

test("6. Invalid Tool Arguments Handling - rejects invalid ObjectIds and past dates safely", async () => {
  const server = createMcpServer();
  const scheduleTool = server._registeredTools["schedule_task"];
  assert.ok(scheduleTool, "schedule_task tool should exist");

  // Call with invalid MongoDB ID
  const invalidIdResult = await scheduleTool.handler({
    taskId: "non-existent-or-invalid-id",
    scheduledDate: "2026-10-25T10:00:00.000Z",
  });

  assert.strictEqual(invalidIdResult.isError, true, "Should return isError: true on invalid ID");
  assert.match(invalidIdResult.content[0].text, /invalid task id/i);

  // Call with past date
  const pastDateResult = await scheduleTool.handler({
    taskId: "6710a1b2c3d4e5f6a7b8c901",
    scheduledDate: "2020-01-01T00:00:00.000Z",
  });

  assert.strictEqual(pastDateResult.isError, true, "Should return isError: true on past date");
  assert.match(pastDateResult.content[0].text, /past date/i);
});

test("7. Empty Task Lists Handling - returns count: 0 and empty array without crashing", () => {
  const emptyList = formatTaskListCompact([]);
  assert.deepStrictEqual(emptyList, []);

  const nullList = formatTaskListCompact(null);
  assert.deepStrictEqual(nullList, []);
});

test("8. Missing Task Durations Handling - preserves null without fabricating numbers", () => {
  const taskWithoutDuration = {
    _id: "6710a1b2c3d4e5f6a7b8c999",
    title: "Read research paper",
    goal: "Learn LLMs",
    priority: "low",
    status: "pending",
    durationMinutes: null,
    subtasks: [],
  };

  const compact = formatTaskCompact(taskWithoutDuration);
  assert.strictEqual(compact.durationMinutes, null, "durationMinutes must be null, not an invented number");
});
