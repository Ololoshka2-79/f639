import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { syncRouteStack } from './lib/appRouteStack';
import { AnimatePresence, motion } from 'framer-motion';
import { SplashScreen } from './components/ui/SplashScreen';
import { BottomNav } from './components/ui/BottomNav';
import { ThemeManager } from './components/ui/ThemeManager';
import { HomeScreen } from './features/HomeScreen';
import { CartScreen } from './features/cart/CartScreen';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { RequireCart } from './components/routing/RequireCart';
import { analytics } from './lib/analytics';
import { useAdminStore } from './store/adminStore';
import { useUIStore } from './store/uiStore';
import { AdminToolbar } from './components/ui/AdminToolbar';
import { useThemeStore } from './store/themeStore';

const AnalyticsPage = lazy(() =>
  import('./pages/admin/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);

function App() {
  const tg = window.Telegram?.WebApp;
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeStore();
  const theme = mode === 'auto' ? (window.Telegram?.WebApp?.colorScheme || 'light') : mode;
  
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  const [clickCount, setClickCount] = useState(0);
  const { setAdminStatus, allowedIds } = useAdminStore();
  const { fetchSettings } = useUIStore();

  useEffect(() => {
    syncRouteStack(location.pathname, navigationType);
  }, [location.pathname, navigationType]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      setTimeout(() => tg.expand?.(), 200);
      setTimeout(() => tg.expand?.(), 500);
      tg.enableClosingConfirmation?.();
    }

    const tgUser = tg?.initDataUnsafe?.user;
    const isAllowedAdmin = tgUser && allowedIds.includes(tgUser.id.toString());
    setAdminStatus(Boolean(isAllowedAdmin));

    analytics.trackAppOpen();
  }, [setAdminStatus, allowedIds]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        (tg as any)?.minimize?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tg]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle Telegram start params
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const startParam = (tg?.initDataUnsafe as any)?.start_param;

    if (startParam) {
      if (startParam.startsWith('product_')) {
        const id = startParam.replace('product_', '');
        navigate(`/product/${id}`, { replace: true });
        return;
      } 
      if (startParam.startsWith('p_')) {
        const id = startParam.substring(2);
        navigate(`/product/${id}`, { replace: true });
        return;
      }
    }
  }, [navigate]);

  // Sync Safe Areas
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const safeTop = (tg as any).contentSafeAreaInset?.top || (tg as any).safeAreaInset?.top || 0;
      const safeBottom = (tg as any).contentSafeAreaInset?.bottom || (tg as any).safeAreaInset?.bottom || 0;
      document.documentElement.style.setProperty('--tg-safe-top', `${safeTop}px`);
      document.documentElement.style.setProperty('--tg-safe-area-inset-bottom', `${safeBottom}px`);
    }
  }, []);

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
    setTimeout(() => setClickCount(0), 5000);
  };

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
  const [debugOverlay, setDebugOverlay] = useState(false);

  return (
    <div className={`min-h-[var(--tg-height,100vh)] w-full text-app-text transition-colors duration-500 overflow-x-hidden relative ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <ThemeManager />
      <AdminToolbar />
      
      <AnimatePresence mode="wait">
        {loading ? (
          <SplashScreen key="splash" onComplete={() => setLoading(false)} />
        ) : !tg?.initData ? (
          <motion.div 
            key="browser-guard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col items-center justify-center bg-black p-8 text-center text-white"
          >
            <div className="mb-8 h-20 w-20 rounded-full border-2 border-white/20 flex items-center justify-center">
              <span className="text-4xl">💎</span>
            </div>
            <h2 className="mb-4 font-serif text-2xl uppercase tracking-widest">Открыть магазин</h2>
            <p className="mb-8 text-sm text-white/60 leading-relaxed">
              Пожалуйста, откройте это приложение через официальный Mini App в Telegram для полноценного опыта.
            </p>
            <a 
              href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'f_639_bot'}/open`}
              className="rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-transform active:scale-95"
            >
              Запустить в Telegram
            </a>
          </motion.div>
        ) : (
          <motion.div 
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {!isImmersiveProductPage && (
              <header className="relative z-40 px-6 flex items-center justify-between" style={{ paddingTop: 'calc(var(--tg-safe-top, 0px) + 20px)', paddingBottom: '10px' }}>
                <h1
                  className="text-[var(--heading-size)] font-bold tracking-[0.1em] text-app-accent uppercase cursor-pointer"
                  style={{ fontFamily: '"Bodoni Moda", serif' }}
                  onClick={() => { 
                    navigate('/'); 
                    handleLogoClick(); 
                    if (clickCount >= 3) setDebugOverlay(true); 
                  }}
                >
                  F 63.9
                </h1>
              </header>
            )}

            <main 
              style={{ 
                minHeight: '100vh'
              }}
            >
              <Suspense fallback={<div className="px-6 py-24 text-center text-sm text-app-text-muted font-serif">Загрузка…</div>}>
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

            {location.pathname !== '/checkout' && (
              <BottomNav 
                activeTab={getActiveTab()} 
                setActiveTab={(tab) => {
                  if (tab === 'home') navigate('/');
                  else navigate(`/${tab}`);
                }} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {debugOverlay && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-black/90 p-4 font-mono text-[10px] text-green-400 overflow-auto max-h-[50vh] backdrop-blur-md">
           <div className="flex justify-between items-center mb-2">
            <b className="text-white">WebApp InitData Payload</b>
            <button onClick={() => setDebugOverlay(false)} className="text-red-400 font-bold border border-red-400 px-2 py-0.5 rounded">Close</button>
          </div>
          <p><b>href:</b> {window.location.href}</p>
          <p><b>platform:</b> {(window.Telegram?.WebApp as any)?.platform}</p>
          <p><b>version:</b> {(window.Telegram?.WebApp as any)?.version}</p>
          <p><b>start_param:</b> {(window.Telegram?.WebApp?.initDataUnsafe as any)?.start_param}</p>
          <p><b>initData (length):</b> {window.Telegram?.WebApp?.initData?.length}</p>
          <p><b>isExpanded:</b> {String((window.Telegram?.WebApp as any)?.isExpanded)}</p>
        </div>
      )}
    </div>
  );
}

export default App;
