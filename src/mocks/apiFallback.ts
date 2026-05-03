import type { Category, Product, OrderStatus, PaymentStatus } from '../types';
import { PRODUCTS, CATEGORIES } from './data';

export function getFallbackCategories(): Category[] {
  return CATEGORIES;
}

export function getFallbackProductsList(params: { category?: string }): Product[] {
  return PRODUCTS.filter(
    (p) => !params.category || p.categoryId === params.category
  );
}

export function getFallbackProductById(idOrSlug: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export function getFallbackRelated(excludeId: string): Product[] {
  return PRODUCTS.filter((p) => p.id !== excludeId);
}

export const FALLBACK_PVZ = [
  {
    id: '1',
    city: 'Москва',
    address: 'ул. Тверская, 7',
    name: 'ПВЗ Центр',
    coords: [55.758, 37.611] as [number, number],
    eta: 'Завтра',
    price: 0,
  },
  {
    id: '2',
    city: 'Москва',
    address: 'Кутузовский пр-т, 24',
    name: 'ПВЗ Кутузовский',
    coords: [55.748, 37.545] as [number, number],
    eta: 'Завтра',
    price: 0,
  },
  {
    id: '3',
    city: 'Москва',
    address: 'Ленинский пр-т, 45',
    name: 'ПВЗ Ленинский',
    coords: [55.702, 37.575] as [number, number],
    eta: 'Завтра',
    price: 0,
  },
];

export function getFallbackOrderStatus(_orderId: string): { status: OrderStatus } {
  void _orderId;
  return { status: 'awaiting_payment' };
}

export function getFallbackPaymentStatus(_paymentId: string): { status: PaymentStatus } {
  void _paymentId;
  return { status: 'paid' };
}
