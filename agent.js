import "dotenv/config";
import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

import { safeLogger, TokenMetricsTracker } from "./utils/logging.js";
import { isRetryableError, formatSafeErrorMessage } from "./utils/errors.js";

// Validate environment variables
export function validateEnvironment() {
  const missing = [];
  if (!process.env.GROQ_API_KEY) {
    missing.push("GROQ_API_KEY");
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. Please configure them in your .env file.`,
    );
  }
}

// Model & MCP Configuration
export const MODEL_NAME = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
export const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3000/mcp";
const MAX_AGENT_TURNS = 8;
const MAX_HISTORY_MESSAGES = 10;

// Initialize Groq AI Client (OpenAI compatible)
export const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "mock-key",
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
});

// MCP Client
export const mcpClient = new Client({
  name: "lifepilot-ai-agent",
  version: "1.0.0",
});

// MCP Transport
export const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));

/**
 * Concise, deterministic, stable system instructions.
 * Placed at the very top of messages to optimize provider prefix caching and avoid hallucination.
 */
export const systemInstruction = `You are LifePilot AI, an expert personal productivity assistant. You manage tasks, organize goals, plan daily schedules, track progress, and update deadlines using Model Context Protocol (MCP) tools.

CRITICAL GROUNDING & ACCURACY RULES:
1. Source of Truth: All task data, statuses, priorities, deadlines, and progress MUST come directly from MCP tool results. Never invent tasks, IDs, dates, durations, or statuses.
2. Mutation Grounding: Never claim a task was created, scheduled, updated, completed, or deleted unless the corresponding MCP tool was called and confirmed success. If a tool fails, inform the user clearly—never claim success or guess.
3. Stored Values vs Estimates: Clearly distinguish database values from suggestions. If durationMinutes is missing from a task, label any proposed duration explicitly as "(estimated)" and never claim it was stored in the database.
4. Read-Only Planning: Daily planning is purely a proposal unless the user explicitly requests saving or scheduling. Never claim a plan was saved to MongoDB unless a tool (create_task, schedule_task) was executed and succeeded.

TOOL SELECTION RULES:
- Today's tasks: get_today_tasks
- Overdue tasks: get_overdue_tasks
- General search / browse: list_tasks
- Create single task or multi-day goal: create_task
- Complete task: list_tasks (to locate MongoDB _id), then complete_task
- Complete subtask: list_tasks (to find parent _id), then complete_subtask
- Delete task: list_tasks, then delete_task
- Schedule date: list_tasks, then schedule_task
- Update deadline: list_tasks, then update_deadline
- Task progress: list_tasks, then get_task_progress
- Goal progress: get_goal_progress

SMART DAILY PLANNER RULES:
When asked to plan the day or create a schedule:
1. Retrieve tasks: Call get_today_tasks and get_overdue_tasks (and list_tasks if requested).
2. Priority Hierarchy:
   a. Urgent overdue tasks first.
   b. Tasks with approaching deadlines.
   c. High-priority scheduled tasks.
   d. Medium and low-priority tasks.
3. Time Budget & Arithmetic:
   - Strictly respect the user's available time. If unspecified, assume 4 hours and explicitly state this assumption.
   - Ensure the sum of planned work sessions + breaks does not exceed the budget.
   - If tasks exceed available time, list them under "Remaining Tasks".
4. Work Sessions & Clock Times:
   - Use numbered sessions (e.g., "Session 1: Task A", "Session 2: Task B") unless the user explicitly provided a start time. NEVER invent clock times (like "9:00 AM" or "2:30 PM") without a user-supplied start time.
5. Multi-Day Plan Stages:
   - If a task has day-labelled subtasks (e.g. "Day 1", "Day 2"), schedule ONLY the earliest incomplete stage for today. Do not schedule future days unless the user explicitly asks to work ahead.
   - Do not double-count parent tasks and their subtasks as separate items.
6. Empty State:
   - If no tasks or overdue items exist, state clearly that no tasks were found. Offer optional productivity suggestions clearly labeled as recommendations.`;

/**
 * Converts MCP tools into OpenAI function declaration schemas.
 * @param {Array<Object>} mcpTools
 * @returns {Array<Object>}
 */
export function convertMcpTools(mcpTools) {
  return mcpTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description || `Execute ${tool.name}`,
      parameters: tool.inputSchema || {
        type: "object",
        properties: {},
      },
    },
  }));
}

/**
 * Connects to the MCP server and discovers available tools.
 * @param {Client} [client]
 * @returns {Promise<Array<Object>>}
 */
export async function connectMcp(client = mcpClient) {
  await client.connect(transport);
  safeLogger.info("Connected to LifePilot MCP server");

  const { tools } = await client.listTools();
  safeLogger.info("Available MCP tools:", tools.map((t) => t.name).join(", "));
  return convertMcpTools(tools);
}

/**
 * Calls OpenAI/Groq API with bounded exponential backoff for transient errors.
 * @param {OpenAI} client
 * @param {Object} params
 * @param {number} maxRetries
 * @returns {Promise<Object>}
 */
export async function callLlmWithRetry(client, params, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.chat.completions.create(params);
    } catch (error) {
      const isRetryable = isRetryableError(error);
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      const delayMs = 1000 * Math.pow(2, attempt);
      safeLogger.warn(
        `LLM request failed (${error.message}). Retrying in ${delayMs}ms (Attempt ${attempt + 1}/${maxRetries})...`,
      );
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

/**
 * Process a user's message using the agentic tool-calling loop.
 * Implements token metrics tracking, tool call deduplication, context bounding, and grounding.
 * @param {string} userMessage
 * @param {Array<Object>} groqTools
 * @param {Object} [options]
 * @returns {Promise<{response: string, metrics: Object}>}
 */
export async function askLifePilot(userMessage, groqTools, options = {}) {
  const client = options.aiClient || ai;
  const mcp = options.mcpClient || mcpClient;
  const tracker = new TokenMetricsTracker({ model: MODEL_NAME });
  const toolCache = new Map(); // In-turn tool call memoization to avoid redundant calls

  // Context bounding: start with stable system instruction and current user message
  const messages = [
    {
      role: "system",
      content: systemInstruction,
    },
    ...(options.conversationHistory || []).slice(-MAX_HISTORY_MESSAGES),
    {
      role: "user",
      content: userMessage,
    },
  ];

  let finalResponse = "No response generated.";

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const response = await callLlmWithRetry(client, {
      model: MODEL_NAME,
      messages,
      tools: groqTools,
      tool_choice: "auto",
      parallel_tool_calls: false,
    });

    tracker.recordUsage(response);

    const assistantMessage = response.choices?.[0]?.message;
    if (!assistantMessage) {
      throw new Error("Groq returned an empty response candidate.");
    }

    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls || [];

    // If no tool calls were requested, we have the final grounded response
    if (toolCalls.length === 0) {
      finalResponse = assistantMessage.content || "Task completed.";
      break;
    }

    tracker.recordToolCalls(toolCalls.length);

    // Execute requested tool calls sequentially
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let args = {};

      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch (parseErr) {
        safeLogger.warn(`Failed to parse arguments for tool ${toolName}:`, parseErr.message);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: "Invalid JSON in tool arguments." }),
        });
        continue;
      }

      const cacheKey = `${toolName}:${JSON.stringify(args)}`;

      // Token optimization: Deduplicate identical tool calls within the same turn
      if (toolCache.has(cacheKey) && !isDestructiveTool(toolName)) {
        safeLogger.info(`[Token Optimization] Reusing result for identical tool call: ${toolName}`);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolCache.get(cacheKey),
        });
        continue;
      }

      safeLogger.info(`Executing tool: ${toolName}`, args);

      try {
        const result = await mcp.callTool({
          name: toolName,
          arguments: args,
        });

        const toolResult = {
          content: result.content ?? [],
          ...(result.isError ? { isError: true } : {}),
        };

        const serializedResult = JSON.stringify(toolResult);

        // Cache read-only operations for turn deduplication
        if (!isDestructiveTool(toolName)) {
          toolCache.set(cacheKey, serializedResult);
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: serializedResult,
        });
      } catch (toolError) {
        safeLogger.error(`Tool execution failed for ${toolName}:`, toolError.message);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: formatSafeErrorMessage(toolError),
            isError: true,
          }),
        });
      }
    }

    if (turn === MAX_AGENT_TURNS - 1) {
      finalResponse =
        "I reached the maximum number of tool iterations for this request. Please review the partial results or try a more specific command.";
    }
  }

  tracker.finish();
  tracker.logSummary();

  return {
    response: finalResponse,
    metrics: tracker.getMetrics(),
  };
}

/**
 * Checks whether a tool performs mutations/destructive operations.
 * Destructive tools should not be silently cached or blindly retried.
 * @param {string} toolName
 * @returns {boolean}
 */
export function isDestructiveTool(toolName) {
  const destructive = ["create_task", "delete_task", "complete_task", "complete_subtask", "schedule_task", "update_deadline"];
  return destructive.includes(toolName);
}

/**
 * Interactive terminal assistant entry point.
 */
export async function main() {
  const rl = readline.createInterface({ input, output });
  let groqTools = [];

  try {
    validateEnvironment();
    safeLogger.info("Starting LifePilot AI Agent...");
    groqTools = await connectMcp();

    console.log("\n=======================================================");
    console.log("   🚀 LifePilot AI - Personal Productivity Assistant");
    console.log("   Model: " + MODEL_NAME);
    console.log("   Type 'exit' or 'quit' to exit.");
    console.log("=======================================================\n");

    const history = [];

    while (true) {
      const inputLine = await rl.question("You: ");
      const trimmed = inputLine.trim();

      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        break;
      }
      if (!trimmed) continue;

      try {
        const { response } = await askLifePilot(trimmed, groqTools, {
          conversationHistory: history,
        });

        console.log(`\nLifePilot: ${response}\n`);

        // Bounded conversation memory
        history.push({ role: "user", content: trimmed });
        history.push({ role: "assistant", content: response });
        if (history.length > MAX_HISTORY_MESSAGES) {
          history.splice(0, history.length - MAX_HISTORY_MESSAGES);
        }
      } catch (reqError) {
        safeLogger.error(`Request failed: ${reqError.message}`);
      }
    }
  } catch (initError) {
    safeLogger.error(`Failed to start LifePilot: ${initError.message}`);
  } finally {
    rl.close();
    try {
      await mcpClient.close();
    } catch {
      // ignore
    }
  }
}

// Run directly if this is the main module
const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && process.argv[1] === currentFilePath) {
  main();
}
