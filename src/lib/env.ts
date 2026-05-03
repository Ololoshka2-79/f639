/**
 * When true, failed API calls return local mock data for READ-ONLY operations.
 * When false (default in production), errors propagate properly.
 * Admin CRUD operations NEVER fall back to mocks regardless of this setting.
 */
export function shouldUseApiMockFallback(): boolean {
  const v = import.meta.env.VITE_API_FALLBACK_TO_MOCKS;
  // If explicitly set to 'true', enable fallback (for development/demo)
  if (v === 'true') return true;
  // Default to false — errors should propagate so admin knows API is down
  return false;
}