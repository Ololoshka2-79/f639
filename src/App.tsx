import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { syncRouteStack } from './lib/appRouteStack';
import { AnimatePresence } from 'framer-motion';
import { SplashScreen } from './components/ui/SplashScreen';
import { BottomNav } from './components/ui/BottomNav';
import { ThemeManager } from './components/ui/ThemeManager';
import { HomeScreen } from './features/HomeScreen';
import { CartScreen } from './features/cart/CartScreen';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/Placeholders';
import { ProfilePage } from './pages/ProfilePage';
import { RequireCart } from './components/routing/RequireCart';
import { bootstrapApp } from './lib/bootstrap';
import { bootstrapTelegramViewport } from './lib/telegramWebApp';
import { analytics } from './lib/analytics';
import { useAdminStore } from './store/adminStore';
import { AdminToolbar } from './components/ui/AdminToolbar';
const AnalyticsPage = lazy(() =>
  import('./pages/admin/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);

function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    syncRouteStack(location.pathname, navigationType);
  }, [location.pathname, navigationType]);
  const [clickCount, setClickCount] = useState(0);
  const { setAdminStatus, allowedIds } = useAdminStore();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    let cleanupSwipe: (() => void) | undefined;

    if (tg) {
      bootstrapTelegramViewport();
      tg.enableClosingConfirmation?.();
      const disableSwipe = () => {
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }
      };
      disableSwipe();
      window.addEventListener('focus', disableSwipe);
      cleanupSwipe = () => window.removeEventListener('focus', disableSwipe);
      tg.headerColor = '#0A0A0A';
      tg.backgroundColor = '#0A0A0A';
    }

    const tgUser = tg?.initDataUnsafe?.user;
    const isAllowedAdmin = tgUser && allowedIds.includes(tgUser.id.toString());
    if (isAllowedAdmin) {
      setAdminStatus(true);
    } else {
      setAdminStatus(false);
    }

    bootstrapApp().then(() => {
      setLoading(false);
      analytics.trackAppOpen();
    });

    return () => {
      cleanupSwipe?.();
    };
  }, [setAdminStatus, allowedIds]);

  useEffect(() => {
    if (clickCount > 0) {
      console.log(`[Admin] Activation progress: ${clickCount}/5`);
    }
  }, [clickCount]);

  // Secret Admin Trigger: 5 clicks on logo
  const handleLogoClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setAdminStatus(true);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        return 0;
      }
      return next;
    });
    // Reset counter after 5s of inactivity
    setTimeout(() => setClickCount(0), 5000);
  };

  // Determine active tab from location
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/catalog')) return 'catalog';
    if (path === '/favorites') return 'favorites';
    if (path === '/cart') return 'cart';
    if (path === '/profile') return 'profile';
    return 'home';
  };
  const isImmersiveProductPage = location.pathname.startsWith('/product/');

  return (
    <div className="min-h-screen min-h-[100dvh] w-full text-app-text transition-colors duration-500 overflow-x-hidden">
      <ThemeManager />
      <AdminToolbar />
      <AnimatePresence>
        {loading && (
          <SplashScreen onComplete={() => setLoading(false)} />
        )}
      </AnimatePresence>

      {!loading && (
        <>
          {!isImmersiveProductPage && (
            <header className="absolute top-0 left-0 right-0 z-40 p-6 pt-20 flex items-center justify-between pointer-events-none">
              <h1
                className="text-xl font-serif tracking-[0.2em] text-app-accent uppercase cursor-pointer pointer-events-auto"
                onClick={() => { navigate('/'); handleLogoClick(); }}
              >
                F 63.9
              </h1>
              <div className="flex items-center gap-4 text-app-text-muted pointer-events-none opacity-0">
                <div className="w-8 h-8 rounded-full bg-app-surface-1 flex items-center justify-center border border-app-border">
                  <span className="text-[10px] font-bold">JD</span>
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className={isImmersiveProductPage ? '' : 'pt-32'}>
            <Suspense
              fallback={
                <div className="px-6 py-24 text-center text-sm text-app-text-muted font-serif">
                  Загрузка…
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/catalog/:category" element={<CatalogPage />} />
                <Route path="/product/:idSlug" element={<ProductPage />} />
                <Route path="/favorites" element={<CatalogPage />} />
                <Route path="/cart" element={<CartScreen onCheckout={() => navigate('/checkout')} />} />

                <Route element={<RequireCart />}>
                  <Route path="/checkout" element={<CheckoutPage />} />
                </Route>

                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
                <Route path="/admin/products" element={<AdminProductsPage />} />
              </Routes>
            </Suspense>
          </main>

          {/* Bottom Nav */}
          {location.pathname !== '/checkout' && (
            <BottomNav 
              activeTab={getActiveTab()} 
              setActiveTab={(tab) => {
                if (tab === 'home') navigate('/');
                else navigate(`/${tab}`);
              }} 
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
