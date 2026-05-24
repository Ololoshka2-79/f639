import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Инициализируем клиент Supabase с Service Role Key для обхода RLS на бэкенде
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

/**
 * Преобразует поля из БД (snake_case) в поля для фронтенда (camelCase)
 */
function mapFromDb(dbEvent) {
  if (!dbEvent) return null;
  return {
    id: dbEvent.id,
    userId: dbEvent.user_id,
    username: dbEvent.username,
    firstName: dbEvent.first_name,
    phone: dbEvent.phone,
    event: dbEvent.event,
    productId: dbEvent.product_id,
    orderId: dbEvent.order_id,
    deliveryType: dbEvent.delivery_type,
    pvzAddress: dbEvent.pvz_address,
    amount: dbEvent.amount,
    createdAt: dbEvent.created_at,
  };
}

/**
 * Преобразует поля из фронтенда (camelCase) в поля для БД (snake_case)
 */
function mapToDb(evt) {
  if (!evt) return null;
  const dbData = {
    user_id: evt.userId,
    username: evt.username,
    first_name: evt.firstName,
    phone: evt.phone,
    event: evt.event,
    product_id: evt.productId,
    order_id: evt.orderId,
    delivery_type: evt.deliveryType,
    pvz_address: evt.pvzAddress,
    amount: evt.amount,
  };

  // Удаляем undefined поля
  Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);
  
  return dbData;
}

export async function addEvent(evt) {
  const dbData = mapToDb(evt);

  const { data, error } = await supabase
    .from('analytics_events')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] addEvent error:', error);
    throw error;
  }

  return mapFromDb(data);
}

export async function listEvents(days = 30) {
  // Вычисляем дату N дней назад
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', dateThreshold.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] listEvents error:', error);
    return [];
  }

  return (data || []).map(mapFromDb);
}

export async function deleteAllEvents() {
  const { error } = await supabase
    .from('analytics_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Условие для DELETE через Supabase SDK обязательно

  if (error) {
    console.error('[Supabase] deleteAllEvents error:', error);
    throw error;
  }
}
