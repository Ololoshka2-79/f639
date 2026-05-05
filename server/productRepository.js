import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Инициализируем клиент Supabase с Service Role Key для обхода RLS на бэкенде
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

/**
 * Преобразует поля из БД (snake_case) в поля для фронтенда (camelCase)
 */
function mapFromDb(dbProduct) {
  if (!dbProduct) return null;
  return {
    ...dbProduct,
    categoryId: dbProduct.category_id,
    oldPrice: dbProduct.old_price,
    inStock: dbProduct.in_stock,
    isOnSale: dbProduct.is_on_sale,
    isNew: dbProduct.is_new,
    isBestSeller: dbProduct.is_best_seller,
    isHidden: dbProduct.is_hidden,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
  };
}

/**
 * Преобразует поля из фронтенда (camelCase) в поля для БД (snake_case)
 */
function mapToDb(product) {
  if (!product) return null;
  const dbData = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price,
    old_price: product.oldPrice,
    category_id: product.categoryId,
    in_stock: product.inStock,
    is_on_sale: product.isOnSale,
    is_new: product.isNew,
    is_best_seller: product.isBestSeller,
    is_hidden: product.isHidden,
    material: product.material,
    size: product.size,
    image: product.image,
    image_public_id: product.image_public_id,
    gallery: product.gallery,
    gallery_public_ids: product.gallery_public_ids,
    images: product.images,
  };

  // Удаляем undefined поля, чтобы не затирать данные в БД
  Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);
  
  return dbData;
}

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] listProducts error:', error);
    return [];
  }

  return (data || []).map(mapFromDb);
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 - Not found
      console.error('[Supabase] getProductById error:', error);
    }
    return null;
  }

  return mapFromDb(data);
}

export async function upsertProduct(product) {
  const dbData = mapToDb(product);
  dbData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .upsert(dbData)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] upsertProduct error:', error);
    throw error;
  }

  return mapFromDb(data);
}

export async function removeProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] removeProductById error:', error);
    return null;
  }

  return mapFromDb(data);
}
