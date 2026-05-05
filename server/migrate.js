import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Данные категорий из mocks
const CATEGORIES = [
  { id: 'cat-rings', slug: 'rings', name: 'Кольца', sortOrder: 1 },
  { id: 'cat-necklaces', slug: 'necklaces', name: 'Колье', sortOrder: 2 },
  { id: 'cat-earrings', slug: 'earrings', name: 'Серьги', sortOrder: 3 },
  { id: 'cat-bracelets', slug: 'bracelets', name: 'Браслеты', sortOrder: 4 },
];

async function migrate() {
  console.log('🚀 Starting migration to Supabase...');

  // 1. Миграция категорий
  console.log('Migrating categories...');
  for (const cat of CATEGORIES) {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      sort_order: cat.sortOrder
    });
    if (error) console.error(`Error migrating category ${cat.id}:`, error);
  }
  console.log('✅ Categories migrated.');

  // 2. Миграция товаров из JSON
  const productsPath = path.resolve('server', 'data', 'products.json');
  try {
    const raw = await fs.readFile(productsPath, 'utf8');
    const products = JSON.parse(raw);

    if (products.length === 0) {
      console.log('No products found in products.json to migrate.');
    } else {
      console.log(`Migrating ${products.length} products...`);
      for (const p of products) {
        const dbData = {
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          price: p.price,
          old_price: p.oldPrice,
          category_id: p.categoryId,
          in_stock: p.inStock ?? true,
          is_on_sale: p.isOnSale ?? false,
          is_new: p.isNew ?? false,
          is_best_seller: p.isBestSeller ?? false,
          is_hidden: p.isHidden ?? false,
          material: p.material,
          size: p.size,
          image: p.image,
          image_public_id: p.image_public_id,
          gallery: p.gallery || [],
          gallery_public_ids: p.gallery_public_ids || [],
          images: p.images || [],
          created_at: p.createdAt || new Date().toISOString(),
          updated_at: p.updatedAt || new Date().toISOString()
        };

        const { error } = await supabase.from('products').upsert(dbData);
        if (error) console.error(`Error migrating product ${p.id}:`, error);
      }
      console.log('✅ Products migrated.');
    }
  } catch (err) {
    console.log('ℹ️ No products.json found or error reading it. Skipping product migration.');
  }

  console.log('🎉 Migration finished!');
}

migrate();
