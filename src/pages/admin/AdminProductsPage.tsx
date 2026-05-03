import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { ProductCard } from '../../components/admin/ProductCard';
import { CategorySidebar } from '../../components/admin/CategorySidebar';
import { ProductToolbar } from '../../components/admin/ProductToolbar';
import { DeleteProductModal } from '../../components/admin/DeleteProductModal';
import { ProductEditorModal } from '../../components/admin/ProductEditorModal';
import { Info, PackageOpen } from 'lucide-react';
import type { Product } from '../../types';
import { api } from '../../lib/api/endpoints';

export const AdminProductsPage: React.FC = () => {
    const { isAdmin } = useAdminStore();
    const { 
        products, 
        allCategories, 
        searchQuery, 
        setSearchQuery, 
        selectedCategoryId, 
        setSelectedCategoryId,
        sortBy,
        setSortBy,
        actions 
    } = useAdminProducts();

    // Modal States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [deletingProduct, setDeletingProduct] = useState<Product | undefined>(undefined);

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
        // Удаляем локально в store сразу — UX должен быть отзывчивым
        actions.removeProduct(deletingProduct.id);
        // Отправляем запрос на сервер, но не ждём его для закрытия модалки
        api.products.remove(deletingProduct.id).catch((e) => {
            console.warn('[Admin] Server delete failed, item removed locally:', e);
        });
        setDeletingProduct(undefined);
        setIsDeleteOpen(false);
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
            // Сначала обновляем локально — UX
            actions.updateProduct(editingProduct.id, merged);
            // Затем отправляем на сервер (не блокируем UI)
            api.products.upsert(merged).catch((e) => {
                console.warn('[Admin] Server upsert failed, item saved locally:', e);
            });
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
            // Сначала добавляем локально — мгновенный UX
            actions.addProduct(payload);
            // Затем отправляем на сервер (не блокируем UI)
            api.products.upsert(payload).catch((e) => {
                console.warn('[Admin] Server create failed, product saved locally:', e);
            });
        }
        setEditingProduct(undefined);
        setIsEditorOpen(false);
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
                                actions.addCategory({ 
                                    name, 
                                    slug: name.toLowerCase().replace(/ /g, '-'), 
                                    sortOrder: allCategories.length + 1 
                                });
                            }
                        }}
                        onEditCategory={(cat) => {
                            const name = prompt('Новое название:', cat.name);
                            if (name) actions.updateCategory(cat.id, { name });
                        }}
                        onDeleteCategory={(id) => {
                            const count = products.filter(p => p.categoryId === id).length;
                            if (count > 0) {
                                if (window.confirm(`В этой категории ${count} товаров. Удалить их все вместе с категорией?`)) {
                                    actions.removeCategory(id);
                                }
                            } else {
                                if (window.confirm('Удалить категорию?')) actions.removeCategory(id);
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
                                    onDuplicate={() => actions.duplicateProduct(p.id)}
                                    onToggleVisibility={() => actions.updateProduct(p.id, { isHidden: !p.isHidden })}
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
        </div>
    );
};
