/**
 * Safe logging utility and Token Metrics Tracker for LifePilot AI.
 * Masks credentials, secrets, and connection strings.
 */

const SENSITIVE_PATTERNS = [
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi,
  /gsk_[A-Za-z0-9_-]{20,}/g,
  /AIza[0-9A-Za-z-_]{35}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
];

/**
 * Masks any sensitive tokens, API keys, or database credentials from text.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeLogText(text) {
  if (typeof text !== "string") {
    try {
      text = JSON.stringify(text);
    } catch {
      return "[Unserializable object]";
    }
  }

  let sanitized = text;
  sanitized = sanitized.replace(
    /mongodb(\+srv)?:\/\/[^:]+:([^@]+)@/gi,
    "mongodb$1://***:***@"
  );
  sanitized = sanitized.replace(/gsk_[A-Za-z0-9_-]{10,}/g, "gsk_***[REDACTED]");
  sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{20,}/g, "AIza***[REDACTED]");
  sanitized = sanitized.replace(/sk-[A-Za-z0-9_-]{10,}/g, "sk-***[REDACTED]");

  return sanitized;
}

/**
 * Safe console logger that filters out sensitive information.
 */
export const safeLogger = {
  info: (...args) => {
    console.log(...args.map((a) => (typeof a === "string" ? sanitizeLogText(a) : a)));
  },
  warn: (...args) => {
    console.warn(...args.map((a) => (typeof a === "string" ? sanitizeLogText(a) : a)));
  },
  error: (...args) => {
    console.error(...args.map((a) => (typeof a === "string" ? sanitizeLogText(a) : a)));
  },
};

/**
 * Tracks token usage and execution metrics for LLM requests.
 */
export class TokenMetricsTracker {
  constructor(options = {}) {
    this.model = options.model || "openai/gpt-oss-20b";
    this.promptTokens = 0;
    this.completionTokens = 0;
    this.totalTokens = 0;
    this.cachedPromptTokens = 0;
    this.requestCount = 0;
    this.toolCallsCount = 0;
    this.startTime = Date.now();
    this.endTime = null;
    this.durations = [];
    this.enabled = process.env.ENABLE_METRICS !== "false";
  }

  /**
   * Records usage data from an OpenAI/Groq API completion response.
   * @param {Object} response
   */
  recordUsage(response) {
    this.requestCount++;
    if (response?.model) {
      this.model = response.model;
    }

    const usage = response?.usage;
    if (usage) {
      const pTokens = Number(usage.prompt_tokens) || 0;
      const cTokens = Number(usage.completion_tokens) || 0;
      const tTokens = Number(usage.total_tokens) || (pTokens + cTokens);
      // Check for cached tokens if supported by provider
      const cached =
        Number(usage.prompt_tokens_details?.cached_tokens) ||
        Number(usage.cached_prompt_tokens) ||
        0;

      this.promptTokens += pTokens;
      this.completionTokens += cTokens;
      this.totalTokens += tTokens;
      this.cachedPromptTokens += cached;
    }
  }

  /**
   * Increments the count of tool calls executed.
   * @param {number} count
   */
  recordToolCalls(count = 1) {
    this.toolCallsCount += count;
  }

  /**
   * Finishes tracking and calculates duration.
   */
  finish() {
    this.endTime = Date.now();
  }

  /**
   * Returns a copy of the gathered metrics.
   * @returns {Object}
   */
  getMetrics() {
    const durationMs = (this.endTime || Date.now()) - this.startTime;
    return {
      model: this.model,
      requestCount: this.requestCount,
      toolCallsCount: this.toolCallsCount,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
      cachedPromptTokens: this.cachedPromptTokens,
      durationMs,
    };
  }

  /**
   * Prints a formatted metrics summary banner if metrics are enabled.
   */
  logSummary() {
    if (!this.enabled) return;
    const m = this.getMetrics();
    console.log("\n================ [TOKEN USAGE & METRICS] ================");
    console.log(` Model:            ${m.model}`);
    console.log(` LLM Requests:     ${m.requestCount}`);
    console.log(` Tool Calls:       ${m.toolCallsCount}`);
    console.log(` Input Tokens:     ${m.promptTokens}`);
    console.log(` Output Tokens:    ${m.completionTokens}`);
    console.log(` Total Tokens:     ${m.totalTokens}`);
    console.log(` Cached Tokens:    ${m.cachedPromptTokens} ${m.cachedPromptTokens === 0 ? "(Provider does not report cache/unsupported)" : ""}`);
    console.log(` Latency:          ${m.durationMs}ms`);
    console.log("=========================================================\n");
  }
}
