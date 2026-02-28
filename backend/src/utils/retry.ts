export const retry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100,
  shouldRetry: (error: any) => boolean = (error) => error.retryable
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  
  throw lastError;
};