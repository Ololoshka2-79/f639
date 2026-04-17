import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, Users, Filter, Activity, ChevronRight } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useAnalytics, type AnalyticsUserSessionRow } from '../../hooks/useAnalytics';
import { useAnalyticsStore, type AnalyticsEvent } from '../../store/analyticsStore';
import { useProductStore } from '../../store/productStore';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { isAdmin } = useAdminStore();
  const [period, setPeriod] = useState<number>(7);
  const { kpi, chartData, funnel, topProducts, userSessions, recentActivity, hasData } = useAnalytics(period);
  useEffect(() => {
    const store = useAnalyticsStore.getState();
    if (store.events.length < 5) {
      const types = ['view_product', 'add_to_cart', 'open_checkout', 'select_pvz', 'create_order'] as const;
      const products = useProductStore.getState().products;
      const tg = window.Telegram?.WebApp;
      const me = tg?.initDataUnsafe?.user?.id?.toString() || 'admin';
      
      const newEvents: AnalyticsEvent[] = [];
      const now = Date.now();
      
      for(let i=0; i<300; i++) {
         const daysAgo = Math.random() < 0.2 ? 0 : Math.floor(Math.random() * 90);
         const time = new Date(now - daysAgo * 24 * 3600 * 1000 - Math.random() * 5000000);
         
         const eventType = types[Math.floor(Math.random() * types.length)];
         const p = products[Math.floor(Math.random() * products.length)];
         
         if (!p) continue;

         newEvents.push({
            id: crypto.randomUUID(),
            userId: Math.random() > 0.4 ? me : `user_${Math.floor(Math.random()*1000)}`,
            event: eventType,
            productId: p.id,
            amount: eventType === 'create_order' ? p.price : undefined,
            deliveryType: eventType === 'select_pvz' ? (Math.random() > 0.3 ? 'pickup' : 'courier') : undefined,
            pvzAddress: eventType === 'select_pvz' ? 'Москва, Покровка 2/1' : undefined,
            createdAt: time.toISOString()
         });
      }
      
      useAnalyticsStore.setState({ events: [...store.events, ...newEvents] });
      // Force un-memoize trigger by set timeout or let zustand do it
    }
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ru-RU') + ' ₽';
  };

  const getEventName = (evt: string) => {
    switch (evt) {
      case 'view_product': return 'Просмотр товара';
      case 'add_to_cart': return 'Добавление в корзину';
      case 'open_checkout': return 'Начало оформления';
      case 'select_pvz': return 'Выбор ПВЗ';
      case 'create_order': return 'Создание заказа';
      default: return evt;
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-app-bg font-sans text-app-text">
      {/* Header */}
      <header className="sticky top-0 z-40 mb-8 flex items-center justify-center border-b border-neutral-500/[0.14] bg-app-surface-1/95 px-6 py-6 backdrop-blur-md dark:border-neutral-400/[0.12]">
        <div className="w-10 flex-shrink-0" aria-hidden />
        <h1 className="flex-1 text-center font-serif text-xl text-app-text">Аналитика</h1>
        <div className="w-10 flex-shrink-0" aria-hidden />
      </header>

      <div className="p-6 space-y-6">
        {/* Period Selector */}
        <div className="mb-2 flex justify-end">
          <div className="inline-flex rounded-xl border-2 border-app-border-strong bg-app-surface-2 p-1 shadow-sm">
            {[1, 7, 30, 90].map(days => (
              <button
                key={days}
                type="button"
                onClick={() => setPeriod(days)}
                className={`rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  period === days 
                    ? 'bg-app-accent text-app-bg shadow-md ring-1 ring-black/10 dark:ring-white/20' 
                    : 'text-app-text-muted hover:bg-app-surface-3 hover:text-app-text'
                }`}
              >
                {days === 1 ? 'За день' : `${days} Дней`}
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-app-border-strong rounded-2xl bg-app-surface-1">
            <BarChart3 size={48} className="text-app-text-muted mb-4 opacity-50" />
            <p className="text-xs text-app-text-muted uppercase tracking-widest text-center leading-relaxed">
              Нет данных для аналитики.<br/>Ожидаются первые действия пользователей.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Заказы', value: kpi.orders, icon: <Package size={16} /> },
                { label: 'Выручка', value: formatMoney(kpi.revenue), icon: <TrendingUp size={16} /> },
                { label: 'Новые пользователи', value: kpi.users, icon: <Users size={16} /> },
                { label: 'Брошено корзин', value: kpi.abandonedCarts, icon: <Filter size={16} />, warn: true },
              ].map((metric, i) => (
                <div key={i} className="p-4 rounded-2xl bg-app-surface-1 border border-app-border flex flex-col gap-2 relative overflow-hidden">
                   <div className={`text-${metric.warn ? 'red-400' : 'app-accent'} opacity-80`}>
                     {metric.icon}
                   </div>
                   <div className="mt-2">
                     <p className={`text-xl font-serif ${metric.warn ? 'text-red-400' : 'text-app-text'}`}>{metric.value}</p>
                     <p className="text-[9px] uppercase tracking-wider text-app-text-muted font-bold mt-1 max-w-[90%] leading-tight">{metric.label}</p>
                   </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="space-y-6">
              {/* Revenue */}
              <div className="rounded-2xl border-2 border-app-border-strong bg-app-surface-1 p-5 shadow-sm">
                <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-app-text-muted">Выручка (₽)</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-strong)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--app-border-strong)" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} tickFormatter={(val) => format(parseISO(val), 'dd MMM', {locale: ru})} />
                      <YAxis stroke="var(--app-border-strong)" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} tickFormatter={(val) => `${val/1000}k`} width={40} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--app-surface-1)', border: '1px solid var(--app-border-strong)', borderRadius: '12px', fontSize: '12px', color: 'var(--app-text)' }}
                        itemStyle={{ color: 'var(--app-accent)' }}
                        labelFormatter={(val) => format(parseISO(val as string), 'dd MMMM yyyy', {locale: ru})}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="var(--app-accent)" strokeWidth={2} dot={{ fill: 'var(--app-accent)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Orders */}
              <div className="rounded-2xl border-2 border-app-border-strong bg-app-surface-1 p-5 shadow-sm">
                <h3 className="mb-6 text-[10px] font-bold uppercase tracking-widest text-app-text-muted">Количество заказов</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-strong)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--app-border-strong)" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} tickFormatter={(val) => format(parseISO(val), 'dd MMM', {locale: ru})} />
                      <YAxis stroke="var(--app-border-strong)" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} allowDecimals={false} width={30} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--app-surface-1)', border: '1px solid var(--app-border-strong)', borderRadius: '12px', fontSize: '12px', color: 'var(--app-text)' }}
                        cursor={{ fill: 'rgba(128,128,128,0.12)' }}
                      />
                      <Bar dataKey="orders" fill="var(--app-accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="p-5 rounded-2xl bg-app-surface-1 border border-app-border space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-app-text-muted mb-2">Конверсионная воронка</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Просмотрели товар', value: funnel.views },
                  { label: 'Добавили в корзину', value: funnel.carts },
                  { label: 'Открыли оформление', value: funnel.checkouts },
                  { label: 'Выбрали ПВЗ', value: funnel.pvz },
                  { label: 'Оформили заказ', value: funnel.orders }
                ].map((step, idx, arr) => {
                  const max = arr[0].value || 1;
                  const percentOfMax = Math.round((step.value / max) * 100) || 0;
                  return (
                    <div key={idx} className="space-y-2">
                       <div className="flex justify-between text-xs">
                         <span className="text-app-text/80">{step.value} {step.label}</span>
                         <span className="text-app-accent font-bold">{percentOfMax}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           className="h-full bg-app-accent rounded-full" 
                           initial={{ width: 0 }}
                           animate={{ width: `${percentOfMax}%` }}
                           transition={{ duration: 1, delay: idx * 0.1 }}
                         />
                       </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-app-border grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[9px] uppercase tracking-widest text-app-text-muted mb-1">Кликрейт корзины</p>
                   <p className="text-sm font-bold text-app-text">
                     {funnel.views ? ((funnel.carts / funnel.views) * 100).toFixed(1) : 0}%
                   </p>
                 </div>
                 <div>
                   <p className="text-[9px] uppercase tracking-widest text-app-text-muted mb-1">Общая конверсия</p>
                   <p className="text-sm font-bold text-success">
                     {funnel.views ? ((funnel.orders / funnel.views) * 100).toFixed(1) : 0}%
                   </p>
                 </div>
              </div>
            </div>

            {/* User Activity Redesign */}
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-app-border-strong bg-app-accent/10 p-6 flex items-center justify-between shadow-sm">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text/60">Всего пользователей</span>
                    <span className="text-[9px] uppercase tracking-widest text-app-text-muted">(за последние 7 дней)</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="font-serif text-3xl text-app-accent">{kpi.users}</span>
                 </div>
              </div>

              <div className="p-5 rounded-2xl bg-app-surface-1 border border-app-border">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-app-text-muted mb-6 flex items-center gap-2">
                  <Users size={14} className="text-app-accent" />
                  Список пользователей
                </h3>
                
                <div className="space-y-3">
                   {userSessions.map((session: AnalyticsUserSessionRow, i: number) => {
                     const [isExpanded, setIsExpanded] = useState(false);
                     return (
                       <div key={`${session.userId}-${i}`} className="group overflow-hidden rounded-xl border border-app-border-strong bg-app-bg/20 transition-all hover:bg-app-bg/40">
                          <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex w-full items-center justify-between p-4 text-left"
                          >
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-app-accent/10 font-serif text-app-accent">
                                   {session.firstName?.[0] || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                   <span className="text-xs font-medium text-app-text truncate">{session.firstName} {session.username ? `(@${session.username})` : ''}</span>
                                   {session.phone && <span className="text-[9px] text-app-text-muted">{session.phone}</span>}
                                </div>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] text-app-text-muted uppercase tracking-tighter">
                                  {format(parseISO(session.lastActive), 'HH:mm • dd MMM', {locale: ru})}
                                </span>
                                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                   <ChevronRight size={14} className="text-app-text-muted" />
                                </div>
                             </div>
                          </button>
                          
                          {isExpanded && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               className="px-4 pb-4 pt-1 border-t border-app-border-strong bg-app-surface-2/30"
                             >
                                <div className="space-y-3 pt-3">
                                   <span className="text-[8px] font-bold uppercase tracking-widest text-app-accent flex items-center gap-1.5 mb-2">
                                     <Activity size={10} /> Активность (3 дня)
                                   </span>
                                   
                                   {session.viewsRaw.length > 0 ? (
                                     <div className="space-y-2 border-l border-app-accent/20 pl-4 ml-1">
                                        {session.viewsRaw.map((view, vIdx) => (
                                           <div key={vIdx} className="relative flex justify-between items-center text-[10px]">
                                              <div className="absolute -left-[21px] top-1 h-1 w-1 rounded-full bg-app-accent" />
                                              <span className="text-app-text/90 pr-2 line-clamp-1 truncate">{view.name}</span>
                                              <span className="text-app-text-muted/60 whitespace-nowrap">{format(parseISO(view.time), 'HH:mm', {locale: ru})}</span>
                                           </div>
                                        ))}
                                     </div>
                                   ) : (
                                     <p className="text-[10px] text-app-text-muted italic py-2">Нет записей о просмотрах</p>
                                   )}
                                </div>
                             </motion.div>
                          )}
                       </div>
                     );
                   })}
                   {userSessions.length === 0 && (
                     <p className="text-xs text-app-text-muted text-center py-8 border border-app-border-strong border-dashed rounded-xl">
                       Пользователи не найдены
                     </p>
                   )}
                </div>
              </div>
            </div>

            {/* Popular Products */}
            <div className="p-5 rounded-2xl bg-app-surface-1 border border-app-border">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-app-text-muted mb-4">Популярные товары</h3>
              <div className="space-y-4">
                 {topProducts.map((p, i) => (
                   <div key={i} className="flex gap-3 justify-between items-center">
                      <div className="flex gap-3 items-center flex-1 min-w-0">
                         <span className="text-app-text-muted font-serif text-sm w-4">{i + 1}.</span>
                         <div className="min-w-0 flex-1">
                            <p className="text-xs text-app-text truncate pr-2">{p.name || `ID: ${p.id}`}</p>
                            <p className="text-[9px] text-app-text-muted mt-0.5">{p.views} просмотров / {p.orders} заказов</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-app-accent font-bold">{formatMoney(p.revenue)}</p>
                      </div>
                   </div>
                 ))}
                 {topProducts.length === 0 && <p className="text-xs text-app-text-muted text-center py-4">Нет данных по товарам</p>}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-5 rounded-2xl bg-app-surface-1 border border-app-border">
               <h3 className="text-[10px] uppercase tracking-widest font-bold text-app-text-muted mb-4 flex items-center justify-between">
                 Последние события
                 <Activity size={12} className="text-app-accent animate-pulse" />
               </h3>
               
               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {recentActivity.map(evt => (
                    <div key={evt.id} className="flex gap-3 items-start border-l border-app-border pl-3 relative">
                       <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-app-accent/50" />
                       <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[9px] text-app-text-muted mb-1">{format(parseISO(evt.createdAt), 'HH:mm • dd MMM', {locale: ru})} {evt.userId && `• Пользователь ${evt.userId.slice(-4)}`}</span>
                          <p className="text-xs text-app-text">
                            {getEventName(evt.event)}
                            {evt.orderId && <span className="text-app-accent ml-1">#{evt.orderId.split('-')[0].toUpperCase()}</span>}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
