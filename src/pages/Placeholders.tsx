import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="pt-24 px-6 text-center">
    <h1 className="text-2xl font-serif text-app-accent uppercase tracking-widest">{title}</h1>
    <p className="mt-4 text-xs text-app-text-muted uppercase tracking-widest">Coming Soon in the next collection</p>
  </div>
);

export const ProductPage = () => <PlaceholderPage title="Product Details" />;
export const OrdersPage = () => <PlaceholderPage title="My Orders" />;
export const ProfilePage = () => <PlaceholderPage title="Profile" />;
