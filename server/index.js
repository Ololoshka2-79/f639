import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { promises as fs } from 'node:fs';
import { cloudinary, enabled as cloudinaryEnabled } from './cloudinary.js';
import { requireAdmin } from './requireAdmin.js';
import { config, validateConfig } from './config.js';
import {
  getProductById,
  listProducts,
  removeProductById,
  upsertProduct,
} from './productRepository.js';
import { saveOrder, listOrdersByUserId } from './orderRepository.js';
import { validateTelegramInitData } from './telegramAuth.js';
import { getSettings, updateSettings } from './settingsRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // Если allowedOrigins пуст — разрешаем все (для обратной совместимости)
      if (config.allowedOrigins.length === 0) {
        return callback(null, true);
      }
      // Разрешаем отсутствие origin (серверные запросы, curl и т.д.)
      if (!origin) {
        return callback(null, true);
      }
      if (config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Разрешаем Telegram WebApp origins (все возможные домены Mini Apps)
      const allowedDomains = [
        '.telegram.org',
        '.t.me',
        '.telegramweb.app',
        '.tgwebapp.com',
        'localhost',
        '127.0.0.1',
        '.vercel.app',
        '.netlify.app',
        '.railway.app',
        '.f639.luxury',
        '.api.f639.luxury',
      ];
      const isAllowed = allowedDomains.some((domain) => {
        if (origin === domain) return true;
        if (origin.includes(domain)) return true;
        if (origin.endsWith(domain)) return true;
        return false;
      });
      if (isAllowed) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-telegram-init-data', 'x-tg-init-data', 'Accept'],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(express.json({ limit: '50mb' }));

// Увеличено с 5MB до 15MB для современных мобильных фото
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const uploadsDir = path.join(__dirname, '../uploads');

async function ensureUploadsDir() {
  try { await fs.access(uploadsDir); }
  catch { await fs.mkdir(uploadsDir, { recursive: true }); }
}

async function uploadBuffer(fileBuffer, folder) {
  if (cloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          return resolve(result);
        }
      );
      Readable.from(fileBuffer).pipe(stream);
    });
  }
  // Fallback: local file system
  await ensureUploadsDir();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const filepath = path.join(uploadsDir, filename);
  await fs.writeFile(filepath, fileBuffer);
  return {
    secure_url: `/uploads/${filename}`,
    public_id: `local_${filename}`,
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
app.get('/products', async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});

app.get('/products/by-slug/:slug', async (req, res) => {
  const products = await listProducts();
  const product = products.find((p) => p.slug === req.params.slug);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

app.get('/products/:id', async (req, res) => {
  // Try to find by ID first, then by slug
  // idSlug формат: "abc123-product-name". Берём только id (до первого дефиса)
  const rawId = req.params.id;
  const bareId = rawId.split('-')[0];
  let product = await getProductById(bareId);
  if (!product) {
    const products = await listProducts();
    product = products.find((p) => p.slug === req.params.id) || null;
  }
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// FIX #1: POST /products — генерируем id, если не передан
app.post('/products', requireAdmin, async (req, res) => {
  const product = req.body;
  if (!product) {
    return res.status(400).json({ message: 'Product body is required' });
  }
  // Генерируем id, если не передан (создание нового товара)
  if (!product.id) {
    product.id = Math.random().toString(36).slice(2, 11);
  }
  // Генерируем slug, если не передан
  if (!product.slug && product.title) {
    product.slug = product.title
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) + '-' + product.id;
  }
  console.log(`[POST /products] Creating/Updating product: ${product.id} - ${product.title}`);
  const saved = await upsertProduct(product);
  return res.json(saved);
});

app.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  try {
    const result = await uploadBuffer(req.file.buffer, 'products');
    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('[upload] cloudinary upload failed', error);
    return res.status(502).json({ message: 'Cloudinary upload failed' });
  }
});

app.delete('/products/:id', requireAdmin, async (req, res) => {
  // idSlug формат: "abc123-product-name". Берём только id (до первого дефиса)
  const productId = req.params.id.split('-')[0];
  console.log(`[DELETE /products/${productId}] Attempting to delete product`);
  const product = await getProductById(productId);

  if (!product) {
    console.warn(`[DELETE /product/${productId}] Product not found`);
    return res.status(404).json({ message: 'Product not found' });
  }

  const publicIds = [
    product.image_public_id,
    ...(Array.isArray(product.gallery_public_ids) ? product.gallery_public_ids : []),
  ].filter(Boolean);

  if (publicIds.length > 0) {
    try {
      await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
    } catch (error) {
      console.error('[delete] cloudinary destroy failed', {
        productId,
        publicIds,
        error,
      });
    }
  }

  await removeProductById(productId);
  console.log(`[DELETE /products/${productId}] Successfully deleted`);
  return res.status(200).json({ deleted: true });
});

// --- Order Endpoints ---

const handleGetOrders = async (req, res) => {
  const initData = req.headers['x-telegram-init-data'] || req.headers['x-tg-init-data'];
  const auth = validateTelegramInitData(initData, config.telegramBotToken);

  if (!auth.valid) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const orders = await listOrdersByUserId(auth.user.id);
  return res.json(orders);
};

const handlePostOrder = async (req, res) => {
  const initData = req.headers['x-telegram-init-data'] || req.headers['x-tg-init-data'];
  const auth = validateTelegramInitData(initData, config.telegramBotToken);
  const userId = auth.valid ? auth.user.id : null;

  const { items, total, contactInfo, deliveryData } = req.body;
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

  const newOrder = {
    id: orderId,
    user_id: userId,
    username: auth.user?.username,
    status: 'new',
    items,
    total,
    contactInfo,
    deliveryData,
    created_at: new Date().toISOString(),
  };

  try {
    await saveOrder(newOrder);

    if (config.telegramBotToken && config.adminIds.length > 0) {
      const itemsText = items
        .map((item, idx) => `${idx + 1}. ${item.title || item.productId} (x${item.quantity}) - ${item.price}₽`)
        .join('\n');

      const userNickname = auth.user?.username ? `@${auth.user.username}` : 'скрыт/нет';

      const message =
        `<b>🛍 Новый заказ #${orderId}</b>\n` +
        `<b>━━━━━━━━━━━━━━━━</b>\n\n` +
        `<b>👤 Клиент:</b> ${contactInfo?.name || '—'}\n` +
        `<b>📞 Телефон:</b> ${contactInfo?.phone || '—'}\n` +
        `<b>💬 TG:</b> ${userNickname}\n` +
        `<b>📍 Адрес:</b> ${deliveryData?.address || '—'}\n\n` +
        `<b>📦 Товары:</b>\n${itemsText}\n\n` +
        `<b>💰 Итого:</b> ${total}₽\n\n` +
        `<i>Заказ успешно сохранен в базе.</i>`;

      for (const adminId of config.adminIds) {
        try {
          const tgUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
          await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: adminId,
              text: message,
              parse_mode: 'HTML',
            }),
          });
        } catch (botErr) {
          console.error(`[ORDER ERROR] Failed to notify admin ${adminId}:`, botErr.message);
        }
      }
    }

    return res.status(201).json({ id: orderId, orderId });
  } catch (error) {
    console.error('[ORDER ERROR] Failed to process order:', error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
};

app.get('/orders', handleGetOrders);
app.post('/orders', handlePostOrder);

// --- Settings Endpoints ---
app.get('/settings', async (_req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

app.post('/settings', requireAdmin, async (req, res) => {
  const settings = await updateSettings(req.body);
  res.json(settings);
});

app.use((error, _req, res, _next) => {
  if (error?.code === 'LIMIT_FILE_SIZE' || error?.message?.includes('File too large')) {
    return res.status(413).json({ message: `File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB` });
  }
  if (error?.message?.includes('Only image files')) {
    return res.status(400).json({ message: 'Only image files are allowed' });
  }
  console.error('[server] unhandled error', error);
  return res.status(500).json({ message: 'Internal server error' });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve static files from the React app
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

try {
  validateConfig();
  const port = config.port;
  app.listen(port, '0.0.0.0', () => {
    console.log('=========================================');
    console.log(`🚀 [server] Started successfully!`);
    console.log(`📡 Listening on: 0.0.0.0:${port}`);
    console.log(`👉 Health check: http://localhost:${port}/health`);
    console.log(`📸 Max upload size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    console.log('=========================================');
  });
} catch (error) {
  console.error('❌ [server] CRITICAL: Startup failed', error);
  process.exit(1);
}