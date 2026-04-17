import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import type { ThemeMode } from '../store/themeStore';
import { useHaptics } from '../hooks/useHaptics';
import { useOrderStore } from '../store/orderStore';
import { useCheckoutStore } from '../store/checkoutStore';
import { useLocation } from 'react-router-dom';
import { useProfileNavStore } from '../store/profileNavStore';
import {
  ShoppingBag,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  MapPin,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { mode, setMode } = useThemeStore();
  const { orders } = useOrderStore();
  const { deliveryData } = useCheckoutStore();
  const location = useLocation();
  const haptics = useHaptics();
  const subScreen = useProfileNavStore((s) => s.subScreen);
  const openSubScreen = useProfileNavStore((s) => s.openSubScreen);
  const closeSubScreen = useProfileNavStore((s) => s.closeSubScreen);
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

  useEffect(() => {
    if (!location.pathname.startsWith('/profile')) {
      closeSubScreen();
    }
  }, [location.pathname, closeSubScreen]);

  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    haptics.selection();
  };

  type ProfileDisplayUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };

  const displayUser: ProfileDisplayUser = user ?? {
    id: 0,
    first_name: 'Пользователь',
    last_name: '',
    username: 'guest_user',
  };

  const menuItems = [
    { id: 'orders', icon: <ShoppingBag size={20} />, label: 'Мои заказы', count: orders.length },
    { id: 'address', icon: <MapPin size={20} />, label: 'Адреса доставки', count: deliveryData.address ? 1 : 0 },
    { id: 'help', icon: <MessageCircle size={20} />, label: 'Помощь', count: null },
  ];

  const [copiedAddr, setCopiedAddr] = React.useState(false);

  const handleCopyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(true);
    haptics.success();
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleOpenSupport = () => {
    window.open('https://t.me/bonni08', '_blank');
    haptics.impactLight();
  };

  const subTitle =
    subScreen === 'orders'
      ? 'Мои заказы'
      : subScreen === 'address'
        ? 'Адреса доставки'
        : subScreen === 'help'
          ? 'Помощь'
          : '';

  return (
    <div className="min-h-screen bg-app-bg pb-32 pt-12">
      <header className="mb-10 animate-in fade-in zoom-in-95 px-6 text-center duration-700">
        <div className="group relative inline-block">
          <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-app-accent bg-app-accent/20 shadow-[0_0_30px_rgba(201,168,106,0.3)]">
            {displayUser.photo_url ? (
              <img src={displayUser.photo_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-app-surface-1 font-serif text-2xl text-app-accent">
                {displayUser.first_name?.[0] || 'G'}
              </div>
            )}
          </div>
        </div>
        <h2 className="font-serif text-2xl text-app-text">
          {displayUser.first_name} {displayUser.last_name}
        </h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-app-accent">
          @{displayUser.username}
        </p>
      </header>

      <section className="mb-10 space-y-3 px-6">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            type="button"
            onClick={() => {
              if (item.id === 'help') {
                handleOpenSupport();
              } else {
                openSubScreen(item.id);
              }
              haptics.impactLight();
            }}
            className="flex w-full items-center justify-between rounded-3xl border border-app-border bg-app-surface-1 p-4 backdrop-blur-md transition-all hover:bg-app-surface-1 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="text-app-accent">{item.icon}</div>
              <span className="text-sm font-medium text-app-text">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.count !== null && (
                <span className="rounded-full bg-app-accent/20 px-2 py-0.5 text-[10px] font-bold text-app-accent">
                  {item.count}
                </span>
              )}
              <ChevronRight size={16} className="text-app-text-muted" />
            </div>
          </motion.button>
        ))}
      </section>

      <section className="mb-10 px-6">
        <h3 className="mb-4 px-2 text-[10px] font-bold uppercase tracking-[0.4em] text-app-text-muted">
          Тема оформления
        </h3>
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-app-border bg-app-surface-1 p-1.5">
          {[
            { id: 'auto', label: 'Авто', icon: <Monitor size={16} /> },
            { id: 'light', label: 'Светло', icon: <Sun size={16} /> },
            { id: 'dark', label: 'Темно', icon: <Moon size={16} /> },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleThemeChange(option.id as ThemeMode)}
              className={`flex flex-col items-center gap-2 rounded-xl py-3 transition-all ${
                mode === option.id
                  ? 'bg-app-accent text-app-bg shadow-lg shadow-app-accent/20'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              {option.icon}
              <span className="text-[9px] font-bold uppercase tracking-widest">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {subScreen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[100] flex flex-col bg-app-bg"
          >
            <div className="flex items-center justify-center border-b border-neutral-500/[0.14] px-6 pb-4 pt-20 dark:border-neutral-400/[0.12]">
              <h3 className="text-center font-serif text-xl text-app-text">{subTitle}</h3>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto p-6">
              {subScreen === 'orders' && (
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order.id} className="space-y-4 rounded-2xl border border-app-border bg-app-surface-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="mb-1 text-[10px] uppercase tracking-widest text-app-text-muted">
                              Заказ #{order.id.split('-')[0].toUpperCase()}
                            </p>
                            <p className="font-serif text-sm text-app-text">{order.total.toLocaleString()} ₽</p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${
                              order.status === 'completed'
                                ? 'bg-success/20 text-success'
                                : 'bg-app-accent/20 text-app-accent'
                            }`}
                          >
                            {order.status === 'paid'
                              ? 'Оплачен'
                              : order.status === 'completed'
                                ? 'Доставлен'
                                : order.status === 'cancelled'
                                  ? 'Отменен'
                                  : 'В работе'}
                          </span>
                        </div>

                        <div className="text-[11px] leading-relaxed text-app-text-muted">
                          <p>{order.deliveryAddress}</p>
                        </div>

                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={handleOpenSupport}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-app-border-strong py-3 text-[9px] font-bold uppercase tracking-widest text-app-text-muted transition-all hover:border-app-accent/30 hover:text-app-accent"
                          >
                            <MessageCircle size={14} /> Связаться по заказу
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-app-text-muted">Нет активных заказов</div>
                  )}
                </div>
              )}

              {subScreen === 'address' && (
                <div className="space-y-4">
                  {deliveryData.address ? (
                    <div className="relative group overflow-hidden rounded-2xl border border-app-accent/20 bg-app-surface-1 p-5 transition-all active:scale-[0.99]" onClick={() => handleCopyAddr(deliveryData.address)}>
                      <div className="flex gap-4">
                        <MapPin size={20} className="mt-1 flex-shrink-0 text-app-accent" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-app-text leading-relaxed">{deliveryData.address}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-widest text-app-text-muted">
                            Последний адрес из оформления
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-1 min-w-[60px]">
                           <div className={`rounded-full p-2 transition-all ${copiedAddr ? 'bg-success/20 text-success' : 'bg-app-accent/10 text-app-accent'}`}>
                             {copiedAddr ? <Check size={16} /> : <Copy size={16} />}
                           </div>
                           <span className="text-[8px] font-bold uppercase tracking-wider text-app-text-muted">
                             {copiedAddr ? 'Готово' : 'Копия'}
                           </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="py-20 text-center text-app-text-muted">История адресов пуста</p>
                  )}
                </div>
              )}


            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="px-6 text-center">
        <div className="text-[9px] tracking-[0.4em] text-app-text-muted/40">
          <span>F 63.9 &lt;code of love&gt;</span>
        </div>
      </footer>
    </div>
  );
};
