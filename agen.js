import "dotenv/config";

import { GoogleGenAI } from "@google/genai";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// MCP client
const mcpClient = new Client({
  name: "lifepilot-ai-agent",
  version: "1.0.0",
});

// MCP connection
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp"),
);

// System instructions
const systemInstruction = `
You are LifePilot AI, a personal productivity assistant.

Your responsibilities:
- Help users create, view, complete, and delete tasks.
- Use available MCP tools to perform task operations.
- Never claim an operation succeeded unless the tool confirms it.
- Ask for clarification when a request is ambiguous.

Preparation planning:
- When users request a preparation plan, break their goal into
  manageable daily tasks.
- Consider their deadline and available study time.
- Give each task a clear, actionable title.
- Assign low, medium, or high priority.
- Use the create_task tool to save each task.
- Create tasks one at a time and check each tool result.
- If a task creation fails, do not claim it was saved.
- Summarize which tasks were successfully created.
- Do not invent deadlines or claim deadline support unless
  the available tools support it.
`;
// Convert MCP tools into Gemini function declarations
function convertMcpTools(mcpTools) {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description || `Execute ${tool.name}`,
    parametersJsonSchema: tool.inputSchema || {
      type: "object",
      properties: {},
    },
  }));
}

// Connect to MCP and discover available tools
async function connectMcp() {
  await mcpClient.connect(transport);

  console.log("✅ Connected to LifePilot MCP server");

  const { tools } = await mcpClient.listTools();

  console.log("🛠️ Available tools:", tools.map((tool) => tool.name).join(", "));

  return convertMcpTools(tools);
}



  // Agent loop: continue until Gemini produces a final answer
 // Retry Gemini when temporary service errors occur
async function generateWithRetry(request, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      const message = String(error.message || error);

      const isTemporaryError =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED");

      if (!isTemporaryError || attempt === maxRetries) {
        throw error;
      }

      const delay = 2000 * 2 ** attempt;

      console.log(
        `Gemini temporarily unavailable. Retrying in ${delay / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Process a user's message
async function askLifePilot(userMessage, geminiTools) {
  const contents = [
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  // Agent loop: Gemini can call tools and then use their results.
  for (let turn = 0; turn < 10; turn++) {
    const response = await generateWithRetry({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: geminiTools,
          },
        ],
      },
    });

    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent?.parts) {
      throw new Error("Gemini returned no response content.");
    }

    // Preserve Gemini's response for the next conversation turn.
    contents.push(modelContent);

    const functionCalls = modelContent.parts.filter(
      (part) => part.functionCall
    );

    // No tool calls means Gemini has produced its final answer.
    if (functionCalls.length === 0) {
      return modelContent.parts
        .filter((part) => part.text)
        .map((part) => part.text)
        .join("\n");
    }

    const functionResponses = [];

    // Execute each requested MCP tool.
    for (const part of functionCalls) {
      const { name, args } = part.functionCall;

      console.log(`\n🔧 Calling MCP tool: ${name}`);
      console.log("Arguments:", args || {});

      try {
        const result = await mcpClient.callTool({
          name,
          arguments: args || {},
        });

        const toolResult = {
          content: result.content ?? [],
          ...(result.structuredContent !== undefined
            ? { structuredContent: result.structuredContent }
            : {}),
          ...(result.isError ? { isError: true } : {}),
        };

        console.log("📦 Tool result:", JSON.stringify(toolResult));

        functionResponses.push({
          functionResponse: {
            name,
            response: {
              result: toolResult,
            },
          },
        });
      } catch (error) {
        console.error(`❌ Tool failed: ${name}`, error.message);

        functionResponses.push({
          functionResponse: {
            name,
            response: {
              error: error.message,
            },
          },
        });
      }
    }

    // Send tool results back to Gemini.
    contents.push({
      role: "user",
      parts: functionResponses,
    });
  }

  return "I reached the maximum number of tool calls. Please try a simpler request.";
}
// Start the interactive assistant
async function main() {
  let geminiTools;
  const rl = readline.createInterface({ input, output });

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from your .env file.");
    }

    await connectMcp();

    const { tools } = await mcpClient.listTools();
    geminiTools = convertMcpTools(tools);

    console.log("\n🚀 LifePilot AI is ready!");
    console.log('Type "exit" to quit.\n');

    while (true) {
      const message = await rl.question("You: ");

      if (message.trim().toLowerCase() === "exit") {
        break;
      }

      if (!message.trim()) {
        continue;
      }

      try {
        const answer = await askLifePilot(message, geminiTools);
        console.log("\nLifePilot:", answer, "\n");
      } catch (error) {
        console.error("\n❌ Request failed:", error.message, "\n");
      }
    }
  } catch (error) {
    console.error("❌ Failed to start LifePilot:", error.message);
  } finally {
    rl.close();

    try {
      await mcpClient.close();
    } catch {
      // Ignore errors during cleanup
    }
  }
}

main();
