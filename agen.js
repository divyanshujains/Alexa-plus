/**
 * LifePilot AI Agent (Compatibility Alias)
 * Forwards to agent.js to preserve backward compatibility with existing configs and scripts.
 */
import {
  askLifePilot,
  connectMcp,
  convertMcpTools,
  systemInstruction,
  mcpClient,
  main,
} from "./agent.js";
import { fileURLToPath } from "node:url";

export {
  askLifePilot,
  connectMcp,
  convertMcpTools,
  systemInstruction,
  mcpClient,
  main,
};

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && process.argv[1] === currentFilePath) {
  main();
}
