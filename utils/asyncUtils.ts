/**
 * Retries a promise-returning function with exponential backoff.
 * @param fn The async function to retry
 * @param retries Max number of retries (default 3)
 * @param delay Initial delay in ms (default 1000)
 * @returns The result of the function or throws the last error
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000,
    backoffFactor: number = 2
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;

        // Check if error is retryable (optional logic could go here)
        const isRetryable = true;

        if (!isRetryable) throw error;

        // Log the retry attempt
        const nextDelay = delay * backoffFactor;
        console.warn(`[Retry] Operation failed. Retrying in ${delay}ms... (${retries} left). Error: ${error instanceof Error ? error.message : String(error)}`);

        await new Promise(resolve => setTimeout(resolve, delay));

        return retryWithBackoff(fn, retries - 1, nextDelay, backoffFactor);
    }
}
