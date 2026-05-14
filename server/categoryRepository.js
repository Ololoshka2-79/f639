import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Инициализируем клиент Supabase с Service Role Key для обхода RLS на бэкенде
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

function mapFromDb(dbCat) {
  if (!dbCat) return null;
  return {
    id: dbCat.id,
    name: dbCat.name,
    slug: dbCat.slug,
    sortOrder: dbCat.sort_order,
  };
}

function mapToDb(cat) {
  if (!cat) return null;
  const dbData = {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    sort_order: cat.sortOrder,
  };
  
  Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);
  return dbData;
}

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Supabase] listCategories error:', error);
    return [];
  }

  return (data || []).map(mapFromDb);
}

export async function upsertCategory(category) {
  const dbData = mapToDb(category);

  const { data, error } = await supabase
    .from('categories')
    .upsert(dbData)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] upsertCategory error:', error);
    throw error;
  }

  return mapFromDb(data);
}

export async function removeCategoryById(id) {
  const { data, error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] removeCategoryById error:', error);
    throw error;
  }

  return mapFromDb(data);
}
