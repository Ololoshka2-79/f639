export const queryKeys = {
  products: ["products"],
  product: (slug: string) => ["product", slug],
  categories: ["categories"],
  relatedProducts: (id: string) => ["related-products", id],
  payment: (paymentId: string) => ["payment", paymentId],
  orders: ["orders"],
};
