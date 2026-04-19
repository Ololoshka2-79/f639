export type Badge = 'new' | 'hit' | 'sale';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  categoryId: string;
  inStock: boolean;
  /** Распродажа — бейдж Sale (если не задано — можно вывести по oldPrice в UI) */
  isOnSale?: boolean;
  material?: string;
  size?: string;
  image: string;
  image_public_id?: string;
  gallery: string[];
  gallery_public_ids?: string[];
  images: {
    url: string;
    public_id: string;
  }[];
  isNew: boolean;
  isBestSeller: boolean;
  isOnSale_deprecated?: boolean; // We might want to unify this but let's keep it for now
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  | 'pending'
  | 'waiting_confirmation'
  | 'paid'
  | 'expired'
  | 'cancelled'
  | 'failed'
  | 'refunded';

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'assembling'
  | 'transferred_to_delivery'
  | 'in_transit'
  | 'pickup_ready'
  | 'completed'
  | 'cancelled';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  size?: string;
  quantity: number;
}
