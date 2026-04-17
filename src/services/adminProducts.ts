import type { Product, Category } from '../types';

// Mocking delayed API responses for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const adminProductsService = {
  async getProducts(): Promise<Product[]> {
    await delay(300);
    // In a real app we'd fetch from an admin-only endpoint
    return JSON.parse(localStorage.getItem('f639-products-v4') || '{}').state?.products || [];
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    await delay(500);
    // Logic for saving to a backend
    return product as Product;
  },

  async deleteProduct(id: string): Promise<boolean> {
    void id;
    await delay(400);
    return true;
  }
};

export const adminCategoriesService = {
  async getCategories(): Promise<Category[]> {
    await delay(200);
    return JSON.parse(localStorage.getItem('f639-products-v4') || '{}').state?.categories || [];
  },
  
  async saveCategory(category: Partial<Category>): Promise<Category> {
    await delay(300);
    return category as Category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    void id;
    await delay(300);
    return true;
  }
};
