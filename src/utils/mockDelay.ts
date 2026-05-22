/**
 * Simulates network latency for mock APIs.
 * Useful when backend is not ready.
 */
export const mockDelay = (ms = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
