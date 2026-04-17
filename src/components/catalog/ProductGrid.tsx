import React from 'react';
import { ProductCard } from '../ui/ProductCard';
import { useCatalogStore } from '../../store/catalogStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useMergedCatalogProducts } from '../../hooks/useMergedCatalogProducts';

export const ProductGrid: React.FC = () => {
  const { searchQuery, selectedCategory, sortBy, filters } = useCatalogStore();
  const { products: allProducts } = useMergedCatalogProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const isFavorites = location.pathname === '/favorites';
  const favoriteItems = useFavoritesStore((state) => state.items);

  const sourceProducts = isFavorites ? favoriteItems : allProducts;

  const filteredProducts = sourceProducts?.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesMaterial = !filters.material || product.material?.toLowerCase().includes(filters.material.toLowerCase());
    const matchesPrice = (!filters.minPrice || product.price >= filters.minPrice) && 
                         (!filters.maxPrice || product.price <= filters.maxPrice);
    
    // Also respect isHidden
    const isVisible = !product.isHidden;

    return matchesSearch && matchesCategory && matchesMaterial && matchesPrice && isVisible;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'new') return a.isNew ? -1 : 1;
    return 0; // Default: popular
  });

  if (!filteredProducts?.length) {
    return (
      <div className="py-24 px-12 text-center">
        <h3 className="text-app-text text-lg font-serif">
          {isFavorites ? 'Список избранного пуст' : 'Ничего не найдено'}
        </h3>
        <p className="text-xs text-app-text-muted mt-2">
          {isFavorites 
            ? 'Добавляйте понравившиеся украшения в избранное, чтобы не потерять их.' 
            : 'Попробуйте изменить параметры фильтрации или поисковый запрос.'}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      layout
      className="grid grid-cols-2 items-stretch gap-4 px-6 mb-32"
    >
      <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <ProductCard 
              product={product} 
              onClick={() => navigate(`/product/${product.id}-${product.slug}`)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
