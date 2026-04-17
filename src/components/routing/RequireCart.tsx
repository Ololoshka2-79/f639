import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import type { CartItem } from '../../types';

export const RequireCart: React.FC = () => {
  const items = useCartStore((state: { items: CartItem[] }) => state.items);
  const buyNowItem = useCheckoutStore((s) => s.checkoutBuyNowItem);

  if (items.length === 0 && !buyNowItem) {
    return <Navigate to="/cart" replace />;
  }

  return <Outlet />;
};
