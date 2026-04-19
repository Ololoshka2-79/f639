import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle2, ChevronRight, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api/endpoints';
import { useHaptics } from '../hooks/useHaptics';

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  items: OrderItem[];
  created_at: string;
  deliveryData?: {
    address: string;
  };
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Новый', color: 'text-blue-400 bg-blue-400/10', icon: Clock },
  processing: { label: 'В обработке', color: 'text-amber-400 bg-amber-400/10', icon: Package },
  shipped: { label: 'Отправлен', color: 'text-purple-400 bg-purple-400/10', icon: Package },
  completed: { label: 'Завершен', color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle2 },
  cancelled: { label: 'Отменен', color: 'text-red-400 bg-red-400/10', icon: ShoppingBag },
};

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await api.orders.list();
        // Sort by date desc
        const sorted = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
      } catch (err) {
        console.error('Failed to fetch orders', err);
        setError('Не удалось загрузить историю заказов');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const bb = tg?.BackButton;
    if (bb) {
      bb.show();
      const handleBack = () => navigate(-1);
      bb.onClick(handleBack);
      return () => {
        bb.offClick(handleBack);
        bb.hide();
      };
    }
  }, [navigate]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU') + ' ₽';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const toggleExpand = (id: string) => {
    haptics.impactLight();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-app-bg pb-24 text-app-text">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-app-border/40 bg-app-bg/80 px-6 py-6 backdrop-blur-xl">
        <div className="flex items-center justify-center">
          <h1 className="text-lg font-semibold tracking-tight uppercase">История заказов</h1>
        </div>
      </header>

      <main className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-accent border-t-transparent" />
            <p className="mt-4 text-xs uppercase tracking-widest">Загрузка...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs font-semibold uppercase tracking-widest text-app-accent"
            >
              Попробовать снова
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <ShoppingBag className="h-8 w-8 text-app-text-muted" />
            </div>
            <p className="text-sm">У вас пока нет заказов</p>
            <button
              onClick={() => navigate('/catalog')}
              className="mt-6 rounded-lg border border-app-accent px-6 py-3 text-xs font-semibold uppercase tracking-widest text-app-accent active:scale-95"
            >
              Перейти в каталог
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusMap[order.status] || statusMap.new;
              const isExpanded = expandedId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-app-border/40 bg-app-surface-1/40 backdrop-blur-sm"
                >
                  {/* Summary Card */}
                  <div
                    onClick={() => toggleExpand(order.id)}
                    className="cursor-pointer p-5 transition-colors hover:bg-white/5 active:bg-white/[0.02]"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                          Заказ #{order.id.split('-')[1] || order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-app-text/60">{formatDate(order.created_at)}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${status.color}`}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-app-text-muted">
                          {order.items.length} {order.items.length === 1 ? 'товар' : 'товара'}
                        </p>
                        <p className="text-lg font-medium tracking-tight mt-0.5">{formatPrice(order.total)}</p>
                      </div>
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight className="h-5 w-5 text-app-text-muted" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="border-t border-app-border/20 p-5 space-y-4 bg-black/20">
                          {/* Items List */}
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.title}</p>
                                  <p className="text-[10px] text-app-text-muted uppercase tracking-wider">
                                    {item.size ? `Размер: ${item.size} • ` : ''}
                                    {item.quantity} шт.
                                  </p>
                                </div>
                                <p className="text-sm font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Address */}
                          {order.deliveryData?.address && (
                            <div className="rounded-xl bg-white/5 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted mb-1">
                                Адрес доставки
                              </p>
                              <p className="text-xs leading-relaxed text-app-text/80">{order.deliveryData.address}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
