import { config } from './config.js';
import { validateTelegramInitData } from './telegramAuth.js';

export function requireAdmin(req, res, next) {
  const initData =
    req.headers['x-telegram-init-data'] ||
    req.headers['x-tg-init-data'] ||
    '';

  const verified = validateTelegramInitData(String(initData), config.telegramBotToken);
  if (!verified.valid || !verified.user) {
    console.error('[requireAdmin] Forbidden: invalid telegram signature or data missing');
    return res.status(403).json({ message: 'Forbidden: invalid telegram signature' });
  }

  const isAdmin = config.adminIds.includes(verified.user.id);
  if (!isAdmin) {
    console.warn(`[requireAdmin] Forbidden: user ${verified.user.id} is not in ADMIN_IDS list:`, config.adminIds);
    return res.status(403).json({ message: 'Forbidden: user is not admin' });
  }

  req.telegramUser = verified.user;
  return next();
}
