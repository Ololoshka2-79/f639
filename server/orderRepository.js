import { promises as fs } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('server', 'data');
const ordersPath = path.resolve(dataDir, 'orders.json');

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(ordersPath);
  } catch {
    await fs.writeFile(ordersPath, '[]', 'utf8');
  }
}

async function readOrders() {
  await ensureStore();
  const raw = await fs.readFile(ordersPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders) {
  await ensureStore();
  await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf8');
}

export async function listAllOrders() {
  return readOrders();
}

export async function listOrdersByUserId(userId) {
  const orders = await readOrders();
  if (!userId) return [];
  // Ensure userId is string for comparison if it comes as number from TG
  const sUserId = String(userId);
  return orders.filter((o) => String(o.user_id) === sUserId);
}

export async function getOrderById(id) {
  const orders = await readOrders();
  return orders.find((o) => o.id === id) || null;
}

export async function saveOrder(order) {
  const orders = await readOrders();
  orders.unshift(order); // Newer orders first
  await writeOrders(orders);
  return order;
}

export async function updateOrder(id, updates) {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index >= 0) {
    orders[index] = { ...orders[index], ...updates };
    await writeOrders(orders);
    return orders[index];
  }
  return null;
}
