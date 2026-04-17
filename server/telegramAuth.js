import { createHmac, timingSafeEqual } from 'node:crypto';
import { botTokenSecret } from './config.js';

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return { valid: false };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { valid: false };

  const pairs = [];
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort((a, b) => a.localeCompare(b));

  const dataCheckString = pairs.join('\n');
  const secret = botTokenSecret(botToken);
  const computedHash = createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (!safeEqualHex(computedHash, hash)) {
    return { valid: false };
  }

  const rawUser = params.get('user');
  if (!rawUser) return { valid: false };

  try {
    const user = JSON.parse(rawUser);
    const userId = Number(user?.id);
    if (!Number.isInteger(userId)) return { valid: false };
    return { valid: true, user: { id: userId } };
  } catch {
    return { valid: false };
  }
}
