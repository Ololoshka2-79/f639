import { config } from './config.js';
import { validateTelegramInitData } from './telegramAuth.js';

export function requireAdmin(req, res, next) {
  const initData =
    req.headers['x-telegram-init-data'] ||
    req.headers['x-tg-init-data'] ||
    '';

  console.log('[requireAdmin] Debug: Received initData length:', initData.length);

  const verified = validateTelegramInitData(
    String(initData),
    config.telegramBotToken
  );

  if (!verified.valid || !verified.user) {
    console.error('[requireAdmin] Forbidden: invalid telegram signature or data missing. Token length:', config.telegramBotToken?.length || 0);
    return res.status(403).json({ message: 'Forbidden: invalid telegram signature' });
  }

  const adminIds = config.adminIds.map(id => Number(id));
  const userId = Number(verified.user.id);

  console.log('[requireAdmin] Admin check:', { userId, adminIds });

  if (!adminIds.includes(userId)) {
    console.warn(`[requireAdmin] Forbidden: user ${userId} is not in ADMIN_IDS list:`, adminIds);
    return res.status(403).json({ message: 'Forbidden: user is not admin' });
  }

  req.telegramUser = verified.user;
  return next();
}
