import { promises as fs } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('server', 'data');
const productsPath = path.resolve(dataDir, 'products.json');

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(productsPath);
  } catch {
    await fs.writeFile(productsPath, '[]', 'utf8');
  }
}

async function readProducts() {
  await ensureStore();
  const raw = await fs.readFile(productsPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeProducts(products) {
  await ensureStore();
  await fs.writeFile(productsPath, JSON.stringify(products, null, 2), 'utf8');
}

export async function listProducts() {
  return readProducts();
}

export async function getProductById(id) {
  const products = await readProducts();
  return products.find((p) => p.id === id) || null;
}

export async function upsertProduct(product) {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = { ...products[index], ...product };
  } else {
    products.push(product);
  }
  await writeProducts(products);
  return product;
}

export async function removeProductById(id) {
  const products = await readProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index < 0) return null;
  const [removed] = products.splice(index, 1);
  await writeProducts(products);
  return removed;
}
