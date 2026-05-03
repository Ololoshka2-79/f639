/**
 * Уведомления отправляются ТОЛЬКО через сервер.
 * Клиент запрашивает сервер, сервер отправляет уведомления в Telegram.
 * Токен бота НЕ должен быть на клиенте.
 */

export const sendAdminNotification = async (_message: string): Promise<boolean> => {
  console.warn('[TelegramBot] Client-side notifications are disabled. Use server-side API.');
  return false;
};