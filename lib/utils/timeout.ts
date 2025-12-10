import { TimeoutError } from '../services/perplexity';

/**
 * Execute a function with a timeout using AbortController
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Optional custom timeout error message
 * @returns The result of the function
 * @throws TimeoutError if the function exceeds the timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  const controller = new AbortController();
  const signal = controller.signal;

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(
        new TimeoutError(
          timeoutMessage || `Operation timed out after ${timeoutMs}ms`,
          timeoutMs
        )
      );
    }, timeoutMs);

    // Clean up timeout if the signal is aborted
    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });
  });

  try {
    // Race between the function and timeout
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    // Ensure cleanup happens
    controller.abort();
    throw error;
  }
}

/**
 * Create an AbortSignal that times out after the specified duration
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after timeout
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();

  setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return controller.signal;
}
