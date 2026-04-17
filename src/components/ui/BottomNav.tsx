import React from 'react';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCartStore } from '../../store';
type Tab = 'home' | 'catalog' | 'favorites' | 'cart' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const cartItemsCount = useCartStore((state) => state.items.length);

  const navItems: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'catalog', icon: Search, label: 'Каталог' },
    { id: 'favorites', icon: Heart, label: 'Избранное' },
    { id: 'cart', icon: ShoppingBag, label: 'Корзина' },
    { id: 'profile', icon: User, label: 'Профиль' },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 pointer-events-none">
      <nav className="mx-auto max-w-md bg-[#FAFAFA]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl border border-app-border-strong rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
              activeTab === item.id ? "text-app-accent" : "text-app-text-muted"
            )}
          >
            <item.icon 
              size={20} 
              className={cn(
                "transition-transform duration-300",
                activeTab === item.id ? "scale-110" : "scale-100"
              )}
            />
            <span className="text-[10px] font-medium tracking-tight">
              {item.label}
            </span>
            
            {item.id === 'cart' && cartItemsCount > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-3 flex items-center justify-center w-4 h-4 bg-app-accent text-app-bg text-[9px] font-bold rounded-full">
                {cartItemsCount}
              </span>
            )}

            {activeTab === item.id && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-app-accent rounded-full" />
            )}
          </button>
        ))}
        </div>
      </nav>
    </div>
);
};
