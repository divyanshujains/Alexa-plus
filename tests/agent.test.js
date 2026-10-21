import test from "node:test";
import assert from "node:assert/strict";
import {
  askLifePilot,
  callLlmWithRetry,
  convertMcpTools,
  isDestructiveTool,
} from "../agent.js";
import { isRetryableError } from "../utils/errors.js";

test("3. Correct Matching of Tool Results to Tool-Call IDs", async () => {
  const toolCallId = "call_test_999";
  let capturedMessages = [];

  const mockAi = {
    chat: {
      completions: {
        create: async ({ messages }) => {
          capturedMessages = [...messages];
          const hasToolResult = messages.some((m) => m.role === "tool");
          if (!hasToolResult) {
            // First turn: assistant requests a tool call
            return {
              model: "mock-model",
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: null,
                    tool_calls: [
                      {
                        id: toolCallId,
                        function: {
                          name: "list_tasks",
                          arguments: JSON.stringify({ status: "pending" }),
                        },
                      },
                    ],
                  },
                },
              ],
              usage: { prompt_tokens: 50, completion_tokens: 20 },
            };
          } else {
            // Second turn: assistant receives tool result and produces final answer
            return {
              model: "mock-model",
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: "You have 1 pending task.",
                  },
                },
              ],
              usage: { prompt_tokens: 70, completion_tokens: 10 },
            };
          }
        },
      },
    },
  };

  const mockMcp = {
    callTool: async ({ name, arguments: args }) => {
      assert.strictEqual(name, "list_tasks");
      return {
        content: [{ type: "text", text: JSON.stringify({ count: 1, tasks: [] }) }],
      };
    },
  };

  const { response } = await askLifePilot("What pending tasks do I have?", [], {
    aiClient: mockAi,
    mcpClient: mockMcp,
  });

  assert.strictEqual(response, "You have 1 pending task.");

  // Verify the tool response message has the exact matching tool_call_id
  const toolMsg = capturedMessages.find((m) => m.role === "tool");
  assert.ok(toolMsg, "Should contain a tool role message");
  assert.strictEqual(toolMsg.tool_call_id, toolCallId, "tool_call_id must match assistant tool call");
});

test("4. Simple Request That Requires No Tool", async () => {
  let toolCalled = false;

  const mockAi = {
    chat: {
      completions: {
        create: async () => ({
          model: "mock-model",
          choices: [
            {
              message: {
                role: "assistant",
                content: "Hello! How can I assist you with your productivity today?",
              },
            },
          ],
          usage: { prompt_tokens: 30, completion_tokens: 15 },
        }),
      },
    },
  };

  const mockMcp = {
    callTool: async () => {
      toolCalled = true;
      return { content: [] };
    },
  };

  const { response, metrics } = await askLifePilot("Hello!", [], {
    aiClient: mockAi,
    mcpClient: mockMcp,
  });

  assert.strictEqual(response, "Hello! How can I assist you with your productivity today?");
  assert.strictEqual(toolCalled, false, "No tool should be called for a simple greeting");
  assert.strictEqual(metrics.toolCallsCount, 0);
  assert.strictEqual(metrics.requestCount, 1);
});

test("14. MCP Server Unavailable Handled Safely", async () => {
  const mockAi = {
    chat: {
      completions: {
        create: async ({ messages }) => {
          const toolMsg = messages.find((m) => m.role === "tool");
          if (!toolMsg) {
            return {
              model: "mock-model",
              choices: [
                {
                  message: {
                    role: "assistant",
                    tool_calls: [
                      {
                        id: "call_unavailable",
                        function: { name: "get_today_tasks", arguments: "{}" },
                      },
                    ],
                  },
                },
              ],
            };
          } else {
            return {
              model: "mock-model",
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: "Could not retrieve tasks because the MCP server is unreachable.",
                  },
                },
              ],
            };
          }
        },
      },
    },
  };

  const mockMcp = {
    callTool: async () => {
      throw new Error("connect ECONNREFUSED 127.0.0.1:3000");
    },
  };

  const { response } = await askLifePilot("Show today's tasks", [], {
    aiClient: mockAi,
    mcpClient: mockMcp,
  });

  assert.match(response, /unreachable|could not retrieve/i);
});

test("15. LLM Transient Rate Limit (429) Retried With Backoff", async () => {
  let attempts = 0;
  const mockClient = {
    chat: {
      completions: {
        create: async () => {
          attempts++;
          if (attempts === 1) {
            const err = new Error("Rate limit exceeded: 429 Too Many Requests");
            err.status = 429;
            throw err;
          }
          return {
            choices: [{ message: { role: "assistant", content: "Recovered from rate limit!" } }],
          };
        },
      },
    },
  };

  const res = await callLlmWithRetry(mockClient, {}, 2);
  assert.strictEqual(attempts, 2, "Should have retried once after 429");
  assert.strictEqual(res.choices[0].message.content, "Recovered from rate limit!");
});

test("16. No Claim of Mutation When Tool Reports Failure", async () => {
  let capturedToolResult = null;

  const mockAi = {
    chat: {
      completions: {
        create: async ({ messages }) => {
          const toolMsg = messages.find((m) => m.role === "tool");
          if (!toolMsg) {
            return {
              model: "mock-model",
              choices: [
                {
                  message: {
                    role: "assistant",
                    tool_calls: [
                      {
                        id: "call_failed_delete",
                        function: {
                          name: "delete_task",
                          arguments: JSON.stringify({ taskId: "6710a1b2c3d4e5f6a7b8c999" }),
                        },
                      },
                    ],
                  },
                },
              ],
            };
          }
          capturedToolResult = JSON.parse(toolMsg.content);
          return {
            model: "mock-model",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Failed to delete task: Task not found.",
                },
              },
            ],
          };
        },
      },
    },
  };

  const mockMcp = {
    callTool: async () => ({
      content: [{ type: "text", text: "Task not found." }],
      isError: true,
    }),
  };

  const { response } = await askLifePilot("Delete task with ID 6710a1b2c3d4e5f6a7b8c999", [], {
    aiClient: mockAi,
    mcpClient: mockMcp,
  });

  assert.strictEqual(capturedToolResult.isError, true);
  assert.match(response, /failed|not found/i);
  assert.doesNotMatch(response, /successfully deleted/i);
});

test("17. No Duplicate Tool Execution Caused by Redundant Tool Calls in Same Turn", async () => {
  let executionCount = 0;

  const mockAi = {
    chat: {
      completions: {
        create: async ({ messages }) => {
          const toolMsgs = messages.filter((m) => m.role === "tool");
          if (toolMsgs.length === 0) {
            // Assistant emits TWO identical tool calls in the same turn
            return {
              model: "mock-model",
              choices: [
                {
                  message: {
                    role: "assistant",
                    tool_calls: [
                      {
                        id: "call_1",
                        function: { name: "list_tasks", arguments: "{}" },
                      },
                      {
                        id: "call_2",
                        function: { name: "list_tasks", arguments: "{}" },
                      },
                    ],
                  },
                },
              ],
            };
          }
          return {
            model: "mock-model",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Found 0 tasks.",
                },
              },
            ],
          };
        },
      },
    },
  };

  const mockMcp = {
    callTool: async () => {
      executionCount++;
      return {
        content: [{ type: "text", text: JSON.stringify({ count: 0, tasks: [] }) }],
      };
    },
  };

  await askLifePilot("List my tasks", [], {
    aiClient: mockAi,
    mcpClient: mockMcp,
  });

  // Because of the memoization in askLifePilot, mcp.callTool should only be called once!
  assert.strictEqual(
    executionCount,
    1,
    "Second identical tool call must be served from turn cache to optimize tokens and avoid redundant DB work"
  );
});

test("Destructive Tool Guard - destructive tools are not cached across calls", () => {
  assert.strictEqual(isDestructiveTool("create_task"), true);
  assert.strictEqual(isDestructiveTool("delete_task"), true);
  assert.strictEqual(isDestructiveTool("complete_task"), true);
  assert.strictEqual(isDestructiveTool("schedule_task"), true);
  assert.strictEqual(isDestructiveTool("list_tasks"), false);
  assert.strictEqual(isDestructiveTool("get_today_tasks"), false);
});
