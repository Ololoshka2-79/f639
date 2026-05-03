import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminStore } from '../../store/adminStore';
import { useMergedCatalogProducts } from '../../hooks/useMergedCatalogProducts';
import { ProductCard } from '../../components/admin/ProductCard';
import { CategorySidebar } from '../../components/admin/CategorySidebar';
import { ProductToolbar } from '../../components/admin/ProductToolbar';
import { DeleteProductModal } from '../../components/admin/DeleteProductModal';
import { ProductEditorModal } from '../../components/admin/ProductEditorModal';
import { Info, PackageOpen, AlertTriangle, X } from 'lucide-react';
import type { Product } from '../../types';
import { useProductStore } from '../../store/productStore';
import { api } from '../../lib/api/endpoints';
import { queryKeys } from '../../lib/queryKeys';

export const AdminProductsPage: React.FC = () => {
    const { isAdmin } = useAdminStore();
    const queryClient = useQueryClient();

    // ЕДИНЫЙ источник данных — API через React Query.
    // Все пользователи (админы и обычные) видят одни и те же товары.
    const { products: allProducts } = useMergedCatalogProducts();

    // Zustand store — ТОЛЬКО для optimistic UI при CRUD (categories + быстрые мутации).
    // Данные ПОЛНОСТЬЮ перезаписываются из API при каждом ответе (useEffect в хуке).
    const {
        categories: allCategories,
        updateProduct,
        addProduct,
        duplicateProduct,
        removeProduct,
        addCategory,
        updateCategory,
        removeCategory,
    } = useProductStore();

    // Локальный UI state — поиск, фильтрация, сортировка
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'created' | 'title' | 'price' | 'popularity'>('created');

    // Деривированное состояние — локальная фильтрация/сортировка из API-данных
    const products = useMemo(() => {
        return (allProducts || []).filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'price') return a.price - b.price;
            if (sortBy === 'popularity') return (a.isBestSeller ? -1 : 1);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [allProducts, searchQuery, selectedCategoryId, sortBy]);

    // Modal States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [deletingProduct, setDeletingProduct] = useState<Product | undefined>(undefined);

    // Toast errors visible to admin
    const [toastError, setToastError] = useState<string | null>(null);

    const showError = (message: string) => {
        setToastError(message);
        // Auto-dismiss after 8 seconds
        setTimeout(() => setToastError(null), 8000);
    };

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handleAddProduct = () => {
        setEditingProduct(undefined);
        setIsEditorOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsEditorOpen(true);
    };

    const handleDeleteProduct = (product: Product) => {
        setDeletingProduct(product);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingProduct) return;
        // Оптимистичное удаление из Zustand store — мгновенный UX
        removeProduct(deletingProduct.id);
        setDeletingProduct(undefined);
        setIsDeleteOpen(false);
        // Отправляем запрос на сервер
        try {
            await api.products.remove(deletingProduct.id);
            // УСПЕХ: инвалидируем кеш → синхронизация ВСЕХ клиентов
            queryClient.invalidateQueries({ queryKey: queryKeys.products });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Ошибка сервера';
            console.error('[Admin] Server delete failed:', msg);
            showError(`Не удалось удалить на сервере: ${msg}. Товар удалён локально — обновите страницу позже.`);
            // НЕ invalidateQueries — сохраняем оптимистичное удаление в UI.
            // Серверный refetch вернул бы старый список с этим товаром — он бы «воскрес».
        }
    };

    const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingProduct) {
            // Редактирование существующего товара
            const merged: Product = {
                ...editingProduct,
                ...productData,
                updatedAt: new Date().toISOString()
            };
            if (!merged.slug) {
                merged.slug = merged.title
                    .toLowerCase()
                    .replace(/[^a-zа-яё0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .slice(0, 60);
            }
            // Оптимистично обновляем Zustand — мгновенный UX
            updateProduct(editingProduct.id, merged);
            setEditingProduct(undefined);
            setIsEditorOpen(false);
            // Отправляем на сервер
            try {
                await api.products.upsert(merged);
                // УСПЕХ: инвалидируем кеш
                queryClient.invalidateQueries({ queryKey: queryKeys.products });
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Ошибка сервера';
                console.error('[Admin] Server upsert failed:', msg);
                showError(`Не удалось сохранить на сервере: ${msg}. Изменения сохранены локально.`);
                // НЕ invalidateQueries — сохраняем оптимистичные данные в UI
            }
        } else {
            // Создание нового товара
            const id = Math.random().toString(36).slice(2, 11);
            const slug = (productData.title || 'product')
                .toLowerCase()
                .replace(/[^a-zа-яё0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .slice(0, 60) + '-' + id;
            const now = new Date().toISOString();
            const payload: Product = {
                ...productData,
                id,
                slug,
                createdAt: now,
                updatedAt: now,
                images: productData.images || []
            } as Product;
            // Оптимистично добавляем в Zustand — мгновенный UX
            addProduct(payload);
            setEditingProduct(undefined);
            setIsEditorOpen(false);
            // Отправляем на сервер
            try {
                await api.products.upsert(payload);
                // УСПЕХ: инвалидируем кеш → синхронизация
                queryClient.invalidateQueries({ queryKey: queryKeys.products });
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Ошибка сервера';
                console.error('[Admin] Server create failed:', msg);
                showError(`Не удалось сохранить на сервере: ${msg}. Товар сохранён локально — обновите страницу позже.`);
                // НЕ invalidateQueries — сохраняем оптимистично созданный товар в UI
            }
        }
    };

    return (
        <div className="min-h-screen pb-32 bg-app-bg font-sans text-app-text">
            {/* Header */}
            <header className="sticky top-0 z-40 mb-8 flex items-center justify-center border-b border-neutral-500/[0.14] bg-app-surface-1/95 px-6 py-6 backdrop-blur-md dark:border-neutral-400/[0.12]">
                <div className="w-10 flex-shrink-0" aria-hidden />
                <div className="flex flex-1 flex-col items-center">
                    <h1 className="text-xl font-serif text-app-text">Управление товарами</h1>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-app-accent">Boutique Admin Panel</span>
                </div>
                <div className="w-10 flex-shrink-0" aria-hidden />
            </header>

            <div className="px-6 grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                     <CategorySidebar 
                        categories={allCategories}
                        products={products}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={setSelectedCategoryId}
                        onAddCategory={() => {
                            const name = prompt('Название категории:');
                            if (name) {
                                addCategory({ 
                                    name, 
                                    slug: name.toLowerCase().replace(/ /g, '-'), 
                                    sortOrder: allCategories.length + 1 
                                });
                            }
                        }}
                        onEditCategory={(cat) => {
                            const name = prompt('Новое название:', cat.name);
                            if (name) updateCategory(cat.id, { name });
                        }}
                        onDeleteCategory={(id) => {
                            const catProducts = products.filter(p => p.categoryId === id);
                            const count = catProducts.length;
                            if (count > 0) {
                                if (window.confirm(`В этой категории ${count} товаров. Удалить их все вместе с категорией?`)) {
                                    // Удаляем товары категории с сервера и из store
                                    catProducts.forEach(p => {
                                        api.products.remove(p.id).catch(() => {});
                                        removeProduct(p.id);
                                    });
                                    removeCategory(id);
                                    // Инвалидируем кеш → все клиенты синхронизируются
                                    queryClient.invalidateQueries({ queryKey: queryKeys.products });
                                }
                            } else {
                                if (window.confirm('Удалить категорию?')) removeCategory(id);
                            }
                        }}
                     />
                     
                     <div className="p-5 rounded-3xl bg-app-surface-3 border border-app-border flex gap-4">
                        <Info className="text-app-accent flex-shrink-0" size={20} />
                        <div className="space-y-1">
                             <p className="text-[10px] font-bold uppercase tracking-widest">Admin Logic</p>
                             <p className="text-[10px] text-app-text-muted leading-relaxed italic">
                                Изменения применяются мгновенно ко всем витринам приложения.
                             </p>
                        </div>
                     </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-10">
                    <ProductToolbar 
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        onAddProduct={handleAddProduct}
                    />

                    {products.length === 0 ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center bg-app-surface-1 rounded-[40px] border border-app-border border-dashed">
                             <div className="w-20 h-20 bg-app-surface-3 rounded-full flex items-center justify-center text-app-text-muted mb-6">
                                <PackageOpen size={32} />
                             </div>
                             <h3 className="text-xl font-serif text-app-text mb-2">Товаров пока нет</h3>
                             <p className="text-[10px] text-app-text-muted uppercase tracking-widest mb-8">Создайте первую карточку для вашей коллекции</p>
                             <button 
                                onClick={handleAddProduct}
                                className="px-8 py-4 rounded-xl bg-app-accent text-app-bg font-bold uppercase tracking-widest text-[10px] transition-transform active:scale-95"
                             >
                                Добавить товар
                             </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            {products.map((p) => (
                                <ProductCard 
                                    key={p.id}
                                    product={p}
                                    onEdit={() => handleEditProduct(p)}
                                    onDuplicate={() => duplicateProduct(p.id)}
                                    onToggleVisibility={() => updateProduct(p.id, { isHidden: !p.isHidden })}
                                    onDelete={() => handleDeleteProduct(p)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ProductEditorModal 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveProduct}
                initialProduct={editingProduct}
                categories={allCategories}
            />

            <DeleteProductModal 
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                productTitle={deletingProduct?.title || ''}
            />

            {/* Error Toast */}
            {toastError && (
                <div className="fixed bottom-6 left-6 right-6 z-[200] max-w-lg mx-auto animate-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-950/95 p-5 shadow-2xl backdrop-blur-md">
                        <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="flex-1 text-xs text-red-200 leading-relaxed">{toastError}</p>
                        <button
                            onClick={() => setToastError(null)}
                            className="flex-shrink-0 rounded-full p-1 text-red-400 hover:bg-red-800/50 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
