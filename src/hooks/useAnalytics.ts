import { useMemo } from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { useProductStore } from '../store/productStore';
import type { Product } from '../types';

type UserSessionAgg = {
  userId: string;
  username: string;
  firstName: string;
  phone?: string;
  lastActive: string;
  views: { time: string; productId: string }[];
};

export type AnalyticsUserSessionRow = UserSessionAgg & {
  viewsRaw: { time: string; name: string }[];
};

export function useAnalytics(periodDays: number = 7) {
  const { events, uniqueUserIds } = useAnalyticsStore();

  return useMemo(() => {
    const now = new Date();
    const periodStart = subDays(now, periodDays);

    const recentEvents = events.filter(e => isAfter(parseISO(e.createdAt), periodStart));
    const allEvents = events;

    // KPI Metrics for selected period
    const periodOrders = recentEvents.filter(e => e.event === 'create_order');
    const orders = periodOrders.length;
    const revenue = periodOrders.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Unique users active in this period
    const users = new Set(recentEvents.map(e => e.userId)).size;
    
    // Total unique users ever seen by the system
    const totalUsers = uniqueUserIds.length || users;

    // Abandoned carts in selected period
    const cartUsers = new Set(recentEvents.filter(e => e.event === 'add_to_cart').map(e => e.userId));
    const orderUsers = new Set(periodOrders.map(e => e.userId));
    const abandonedCarts = Array.from(cartUsers).filter(u => !orderUsers.has(u)).length;

    // Chart Data
    const chartDataMap = new Map<string, { date: string, revenue: number, orders: number }>();
    recentEvents.forEach(e => {
      const dateKey = format(parseISO(e.createdAt), 'yyyy-MM-dd');
      if (!chartDataMap.has(dateKey)) {
        chartDataMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0 });
      }
      const dayData = chartDataMap.get(dateKey)!;
      if (e.event === 'create_order') {
        dayData.orders += 1;
        dayData.revenue += e.amount || 0;
      }
    });

    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Conversion
    const funnel = {
      views: recentEvents.filter(e => e.event === 'view_product').length,
      carts: recentEvents.filter(e => e.event === 'add_to_cart').length,
      checkouts: recentEvents.filter(e => e.event === 'open_checkout').length,
      pvz: recentEvents.filter(e => e.event === 'select_pvz').length,
      orders: recentEvents.filter(e => e.event === 'create_order').length
    };

    // Products
    const productStatsMap = new Map<string, { id: string, name: string, views: number, carts: number, orders: number, revenue: number }>();
    recentEvents.forEach(e => {
      if (!e.productId) return;
      if (!productStatsMap.has(e.productId)) {
        // Fallback names. Could map to a store to get actual names
        productStatsMap.set(e.productId, { id: e.productId, name: `Товар ${e.productId}`, views: 0, carts: 0, orders: 0, revenue: 0 });
      }
      const stat = productStatsMap.get(e.productId)!;
      if (e.event === 'view_product') stat.views++;
      if (e.event === 'add_to_cart') stat.carts++;
      if (e.event === 'create_order') {
        stat.orders++;
        stat.revenue += e.amount || 0;
      }
    });
    
    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // User sessions tracking (Views detail)
    const userSessionsMap = new Map<string, UserSessionAgg>();
    allEvents.forEach(e => {
       if (!userSessionsMap.has(e.userId)) {
          userSessionsMap.set(e.userId, {
             userId: e.userId,
             username: e.username || '',
             firstName: e.firstName || e.userId.slice(-4),
             phone: e.phone,
             lastActive: e.createdAt,
             views: []
          });
       }
       const session = userSessionsMap.get(e.userId)!;
       if (isAfter(parseISO(e.createdAt), parseISO(session.lastActive))) {
          session.lastActive = e.createdAt;
       }
       
       if (e.username) session.username = e.username;
       if (e.firstName) session.firstName = e.firstName;
       if (e.phone) session.phone = e.phone;
       
       if (e.event === 'view_product' && e.productId) {
          if (isAfter(parseISO(e.createdAt), periodStart)) {
             session.views.push({ time: e.createdAt, productId: e.productId });
          }
       }
    });

    const productsRef = useProductStore.getState().products;
    const userSessions = Array.from(userSessionsMap.values())
      .filter(s => s.views.length > 0)
      .sort((a, b) => parseISO(b.lastActive).getTime() - parseISO(a.lastActive).getTime())
      .map(s => {
        const sortedViews = [...s.views].sort((a, b) => parseISO(b.time).getTime() - parseISO(a.time).getTime());
        return {
           ...s,
           viewsRaw: sortedViews.map(v => ({
             time: v.time,
             name: productsRef.find((p: Product) => p.id === v.productId)?.title || v.productId
           }))
        };
      });

    // Recent events feed
    const recentActivity = [...events]
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
      .slice(0, 20);

    return {
      kpi: {
        orders,
        revenue,
        users,
        totalUsers,
        abandonedCarts
      },
      chartData,
      funnel,
      topProducts,
      userSessions,
      recentActivity,
      hasData: allEvents.length > 0
    };
  }, [events, uniqueUserIds, periodDays]);
}
