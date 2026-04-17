import { useState, useMemo } from 'react';
import { useProductStore } from '../store/productStore';

export const useAdminProducts = () => {
    const { 
        products, 
        categories, 
        addProduct, 
        updateProduct, 
        removeProduct, 
        duplicateProduct,
        addCategory,
        updateCategory,
        removeCategory,
        reorderProducts
    } = useProductStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'created' | 'title' | 'price' | 'popularity'>('created');

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
          const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
          return matchesSearch && matchesCategory;
        }).sort((a, b) => {
           if (sortBy === 'title') return a.title.localeCompare(b.title);
           if (sortBy === 'price') return a.price - b.price;
           if (sortBy === 'popularity') return (a.isBestSeller ? -1 : 1);
           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Date created
        });
    }, [products, searchQuery, selectedCategoryId, sortBy]);

    return {
        products: filteredProducts,
        allCategories: categories,
        searchQuery,
        setSearchQuery,
        selectedCategoryId,
        setSelectedCategoryId,
        sortBy,
        setSortBy,
        actions: {
            addProduct,
            updateProduct,
            removeProduct,
            duplicateProduct,
            addCategory,
            updateCategory,
            removeCategory,
            reorderProducts
        }
    };
};
