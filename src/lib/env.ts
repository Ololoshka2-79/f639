/** When true, failed API calls return local mock data. When false in production, errors propagate. */
export function shouldUseApiMockFallback(): boolean {
  const v = import.meta.env.VITE_API_FALLBACK_TO_MOCKS;
  // If explicitly set to 'false', respect that
  if (v === 'false') return false;
  // Otherwise always fall back to mocks (in dev and prod without explicit config)
  return true;
}
