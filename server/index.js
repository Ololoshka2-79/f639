import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { cloudinary } from './cloudinary.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // initData signature is verified server-side, so strict origin allowlist is optional here.
      // Allowing all origins removes Telegram WebView/CORS edge issues on mobile clients.
      void origin;
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-telegram-init-data', 'x-tg-init-data'],
  })
);
app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

function uploadBufferToCloudinary(fileBuffer, folder) {
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

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
app.get('/v1/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/products', async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});
app.get('/v1/products', async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});

app.post('/products', requireAdmin, async (req, res) => {
  const product = req.body;
  if (!product?.id) {
    return res.status(400).json({ message: 'Product id is required' });
  }
  console.log(`[POST /products] Creating/Updating product: ${product.id} - ${product.title}`);
  const saved = await upsertProduct(product);
  return res.json(saved);
});
app.post('/v1/products', requireAdmin, async (req, res) => {
  const product = req.body;
  if (!product?.id) {
    return res.status(400).json({ message: 'Product id is required' });
  }
  console.log(`[POST /v1/products] Creating/Updating product: ${product.id} - ${product.title}`);
  const saved = await upsertProduct(product);
  return res.json(saved);
});

app.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'products');
    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('[upload] cloudinary upload failed', error);
    return res.status(502).json({ message: 'Cloudinary upload failed' });
  }
});
app.post('/v1/upload', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer, 'products');
    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('[upload] cloudinary upload failed', error);
    return res.status(502).json({ message: 'Cloudinary upload failed' });
  }
});

app.delete('/product/:id', requireAdmin, async (req, res) => {
  const productId = req.params.id;
  console.log(`[DELETE /product/${productId}] Attempting to delete product`);
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
  console.log(`[DELETE /product/${productId}] Successfully deleted`);
  return res.status(204).send();
});
app.delete('/v1/product/:id', requireAdmin, async (req, res) => {
  const productId = req.params.id;
  const product = await getProductById(productId);

  if (!product) {
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
  return res.status(204).send();
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

      const message =
        `<b>🛍 Новый заказ #${orderId}</b>\n\n` +
        `<b>👤 Клиент:</b> ${contactInfo?.name || '—'}\n` +
        `<b>📞 Телефон:</b> ${contactInfo?.phone || '—'}\n` +
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
app.get('/v1/orders', handleGetOrders);
app.post('/orders', handlePostOrder);
app.post('/v1/orders', handlePostOrder);

app.use((error, _req, res, _next) => {
  if (error?.code === 'LIMIT_FILE_SIZE' || error?.message?.includes('File too large')) {
    return res.status(413).json({ message: 'File is too large. Max size is 5MB' });
  }
  if (error?.message?.includes('Only image files')) {
    return res.status(400).json({ message: 'Only image files are allowed' });
  }
  console.error('[server] unhandled error', error);
  return res.status(500).json({ message: 'Internal server error' });
});

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
    console.log('=========================================');
  });
} catch (error) {
  console.error('❌ [server] CRITICAL: Startup failed', error);
  process.exit(1);
}
