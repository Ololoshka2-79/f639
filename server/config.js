import { createHmac } from 'node:crypto';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Загружаем .env, потом .env.local, потом .env.development.local (локальная разработка)
const __dirname = fileURLToPath(new URL('.', import.meta.url));

dotenv.config(); // .env
const localEnv = resolve(__dirname, '../.env.local');
if (existsSync(localEnv)) dotenv.config({ path: localEnv });

const devLocalEnv = resolve(__dirname, '../.env.development.local');
if (existsSync(devLocalEnv)) dotenv.config({ path: devLocalEnv });

function parseAdminIds(raw) {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter(Number.isInteger);
}

const detectedPort = Number(process.env.PORT || 8787);

export const config = {
  port: detectedPort,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  adminIds: parseAdminIds(process.env.ADMIN_IDS),
  skipAdminAuth: process.env.SKIP_ADMIN_AUTH === 'true',  // локальная разработка без Telegram
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

export function validateConfig() {
  const missing = [];
  if (!config.telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (config.adminIds.length === 0) missing.push('ADMIN_IDS');
  if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length) {
    console.warn(`[server] Warning! Missing required env vars: ${missing.join(', ')}. Some admin features might not work.`);
  }

  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required for server to function');
  }
}

export function botTokenSecret(token) {
  return createHmac('sha256', 'WebAppData').update(token).digest();
}