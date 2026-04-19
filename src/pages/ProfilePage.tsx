import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore, type ThemeMode } from '../store/themeStore';
import { useHaptics } from '../hooks/useHaptics';
import { useOrderStore } from '../store/orderStore';
import { useProfileNavStore } from '../store/profileNavStore';
import {
  MapPin,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  MessageCircle,
  Copy,
  Check,
  Package,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { mode, setMode } = useThemeStore();
  const { savedAddresses } = useOrderStore();
  const navigate = useNavigate();
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
    { id: 'orders', icon: <Package size={20} />, label: 'История заказов', count: null },
    { id: 'address', icon: <MapPin size={20} />, label: 'Адреса доставки', count: savedAddresses.length },
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
    subScreen === 'address'
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
              } else if (item.id === 'orders') {
                navigate('/orders');
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
              {subScreen === 'address' && (
                <div className="space-y-4">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map((addr, idx) => (
                      <div 
                        key={idx} 
                        className="relative group overflow-hidden rounded-2xl border border-app-accent/20 bg-app-surface-1 p-5 transition-all active:scale-[0.99] cursor-pointer" 
                        onClick={() => handleCopyAddr(addr)}
                      >
                        <div className="flex gap-4">
                          <MapPin size={20} className="mt-1 flex-shrink-0 text-app-accent" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-app-text leading-relaxed">{addr}</p>
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
                    ))
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
