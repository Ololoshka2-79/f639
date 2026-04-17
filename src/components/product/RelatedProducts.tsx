import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/endpoints';
import { queryKeys } from '../../lib/queryKeys';
import { ProductCard } from '../ui/ProductCard';
import { Skeleton } from '../ui/Skeleton';
import { useHaptics } from '../../hooks/useHaptics';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';

interface RelatedProductsProps {
  product: Product;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ product }) => {
  const haptics = useHaptics();
  const navigate = useNavigate();

  const { data: related, isLoading } = useQuery({
    queryKey: queryKeys.relatedProducts(product.id),
    queryFn: () => api.products.related(product.id),
  });

  const handleProductClick = (item: Product) => {
    haptics.selection();
    navigate(`/product/${item.id}-${item.slug}`);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="mt-16">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-app-accent mb-6">Вам также понравится</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[160px] flex flex-col gap-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-app-accent">Вам также понравится</h3>
        <span className="text-[9px] uppercase tracking-widest text-app-text-muted font-medium">{related.length} изделий</span>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 -mx-6 px-6">
        {related.map((item) => (
          <div key={item.id} className="min-w-[180px]">
            <ProductCard 
              product={item} 
              onClick={() => handleProductClick(item)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
