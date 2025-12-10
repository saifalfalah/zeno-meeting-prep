export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Execute a function with exponential backoff retry logic and jitter
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt >= maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

      // Add jitter (random value between 0 and 20% of delay)
      const jitter = Math.random() * cappedDelay * 0.2;
      const delayWithJitter = cappedDelay + jitter;

      // Log retry attempt
      console.warn(
        `Retry attempt ${attempt}/${maxAttempts} after ${Math.round(delayWithJitter)}ms`,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayWithJitter));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}
