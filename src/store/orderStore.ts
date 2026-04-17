import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderStatus, CartItem } from '../types';

export interface Order {
  id: string;
  status: OrderStatus;
  date: string;
  total: number;
  items: CartItem[];
  deliveryAddress: string;
}

interface OrderState {
  orders: Order[];
  orderedPvzIds: string[];
  notificationsEnabled: boolean;
  addOrder: (order: Order) => void;
  addPvzId: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  toggleNotifications: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      orderedPvzIds: [],
      notificationsEnabled: true,
      addOrder: (order) => set((state) => ({ 
        orders: [order, ...state.orders] 
      })),
      addPvzId: (id) => set((state) => ({
        orderedPvzIds: state.orderedPvzIds.includes(id) ? state.orderedPvzIds : [...state.orderedPvzIds, id]
      })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),
      toggleNotifications: () => set((state) => ({ 
        notificationsEnabled: !state.notificationsEnabled 
      }))
    }),
    { name: 'f639-order-storage' }
  )
);
