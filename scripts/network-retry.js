"use strict";
class RequestError extends Error {
  constructor(
    message,
    { status, retryable = false, retryAfterMs = null } = {},
  ) {
    super(message);
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function retryAfter(value, now = Date.now()) {
  if (!value) return null;
  const ms = /^\d+$/.test(value.trim())
    ? Number(value) * 1000
    : Date.parse(value) - now;
  return Number.isFinite(ms) ? Math.max(0, ms) : null;
}
async function withRetry(
  action,
  { attempts = 3, sleep = wait, maxWaitMs = 30000 } = {},
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (error.retryAfterMs > maxWaitMs) {
        error.retryDeferred = true;
        throw error;
      }
      if (!error.retryable || attempt === attempts - 1) throw error;
      await sleep(error.retryAfterMs ?? Math.min(1000 * 2 ** attempt, 5000));
    }
  }
}
module.exports = { RequestError, retryAfter, withRetry, wait };
