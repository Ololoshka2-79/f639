/** When true, failed API calls return local mock data. When false in production, errors propagate. */
export function shouldUseApiMockFallback(): boolean {
  const v = import.meta.env.VITE_API_FALLBACK_TO_MOCKS;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return import.meta.env.DEV;
}
