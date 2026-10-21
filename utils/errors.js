/**
 * Standardized error classes and handlers for LifePilot AI.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class ToolExecutionError extends AppError {
  constructor(toolName, message) {
    super(`Tool [${toolName}] failed: ${message}`, 500);
    this.toolName = toolName;
  }
}

export class LlmProviderError extends AppError {
  constructor(message, statusCode = 502) {
    super(`LLM Provider error: ${message}`, statusCode);
  }
}

/**
 * Checks whether an error is transient and can be retried.
 * Rate limits (429), temporary service unavailability (503), and network timeouts are retryable.
 * Validation errors (400) and unauthorized (401) are non-retryable.
 * @param {Error|Object} error
 * @returns {boolean}
 */
export function isRetryableError(error) {
  if (!error) return false;
  const status = error.status || error.statusCode || error.response?.status;
  if (status === 429 || status === 503 || status === 504 || status === 502) {
    return true;
  }

  const msg = String(error.message || error).toLowerCase();
  if (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("network")
  ) {
    return true;
  }

  return false;
}

/**
 * Formats an error into a safe string for LLM or user consumption,
 * preventing stack trace and internal secrets exposure.
 * @param {Error|unknown} error
 * @returns {string}
 */
export function formatSafeErrorMessage(error) {
  if (!error) return "An unknown error occurred.";
  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}`;
  }
  if (error.code === 11000) {
    return "A duplicate record already exists.";
  }
  return error.message || "An unexpected error occurred while processing the request.";
}
