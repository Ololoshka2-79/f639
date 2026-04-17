/**
 * Telegram user id === chat_id для личных сообщений от бота.
 * Список задаётся в VITE_ADMIN_CHAT_IDS (через запятую) или VITE_ADMIN_TELEGRAM_USER_IDS.
 * Fallback — два аккаунта владельцев (если env не задан при сборке).
 */
const DEFAULT_ADMIN_TELEGRAM_IDS = ['1077071564', '790931541'] as const;

function parseIdsFromEnv(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getAdminTelegramUserIds(): string[] {
  const fromTelegramUser = parseIdsFromEnv(import.meta.env.VITE_ADMIN_TELEGRAM_USER_IDS);
  if (fromTelegramUser.length > 0) return fromTelegramUser;

  const fromChatIds = parseIdsFromEnv(import.meta.env.VITE_ADMIN_CHAT_IDS);
  if (fromChatIds.length > 0) return fromChatIds;

  const single = import.meta.env.VITE_ADMIN_CHAT_ID;
  if (single != null && String(single).trim() !== '') {
    return [String(single).trim()];
  }

  return [...DEFAULT_ADMIN_TELEGRAM_IDS];
}
