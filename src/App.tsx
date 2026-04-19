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
  const tg = window.Telegram?.WebApp;
  const [loading, setLoading] = useState(true);
  
  // Guard against browser mode (missing initData)
  if (!tg?.initData) {
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'f_639_bot';
    const appLink = `https://t.me/${botUsername}/open`;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#000] p-8 text-center text-white">
        <div className="mb-8 h-20 w-20 rounded-full border-2 border-white/20 flex items-center justify-center">
          <span className="text-4xl">💎</span>
        </div>
        <h2 className="mb-4 font-serif text-2xl uppercase tracking-widest">Открыть магазин</h2>
        <p className="mb-8 text-sm text-white/60 leading-relaxed">
          Пожалуйста, откройте это приложение через официальный Mini App в Telegram для полноценного опыта.
        </p>
        
        <a 
          href={appLink}
          className="rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-transform active:scale-95"
        >
          Запустить в Telegram
        </a>

        <div className="mt-12 text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">
          Browsers are not supported for luxury experience
        </div>
      </div>
    );
  }

  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  // 🚨 1. ПОЛНАЯ ДИАГНОСТИКА TELEGRAM CONTEXT
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    console.log("🔥 TELEGRAM INIT DEBUG", {
      exists: !!tg,
      platform: tg?.platform,
      version: tg?.version,
      initData: tg?.initData,
      initDataUnsafe: tg?.initDataUnsafe,
      startParam: (tg?.initDataUnsafe as any)?.start_param,
    });
    
    if (!tg || !tg.initData) {
      console.warn("⚠️ NOT A VALID TELEGRAM WEBAPP CONTEXT");
    }
  }, []);

  useEffect(() => {
    syncRouteStack(location.pathname, navigationType);
  }, [location.pathname, navigationType]);

  const [clickCount, setClickCount] = useState(0);
  const { setAdminStatus, allowedIds } = useAdminStore();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();
    }

    const tgUser = tg?.initDataUnsafe?.user;
    const isAllowedAdmin = tgUser && allowedIds.includes(tgUser.id.toString());
    if (isAllowedAdmin) {
      setAdminStatus(true);
    } else {
      setAdminStatus(false);
    }

    setLoading(false);
    analytics.trackAppOpen();
  }, [setAdminStatus, allowedIds]);

  // 2. Улучшенная логика начальной маршрутизации (без мерцания)
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

    if (location.pathname === '/' || location.pathname === '/index.html') {
      navigate('/', { replace: true });
    }
  }, []);

  // Sync Safe Areas from Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const safeTop = (tg as any).contentSafeAreaInset?.top || (tg as any).safeAreaInset?.top || 0;
      const safeBottom = (tg as any).contentSafeAreaInset?.bottom || (tg as any).safeAreaInset?.bottom || 0;
      
      document.documentElement.style.setProperty('--tg-safe-top', `${safeTop}px`);
      document.documentElement.style.setProperty('--tg-safe-area-inset-bottom', `${safeBottom}px`);
    }
  }, []);

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

  const [debugOverlay, setDebugOverlay] = useState(false);

  return (
    <div className="min-h-[var(--tg-height,100vh)] w-full text-app-text transition-colors duration-500 overflow-x-hidden relative">
      <ThemeManager />
      <AdminToolbar />
      <AnimatePresence>
        {loading && (
          <SplashScreen onComplete={() => setLoading(false)} />
        )}
      </AnimatePresence>

      {/* DEBUG OVERLAY (Tap logo 3 times to toggle) */}
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
          <p><b>chat_type:</b> {(window.Telegram?.WebApp?.initDataUnsafe as any)?.chat_type}</p>
          <p><b>isExpanded:</b> {String((window.Telegram?.WebApp as any)?.isExpanded)}</p>
          <p><b>tg-height:</b> {document.documentElement.style.getPropertyValue('--tg-height')}</p>
        </div>
      )}

      {!loading && (
        <>
          {!isImmersiveProductPage && (
            <header className="absolute left-0 right-0 z-40 p-6 flex items-center justify-between pointer-events-none" style={{ top: 'calc(var(--tg-safe-top, 0px) + 8px)' }}>
              <h1
                className="text-xl font-serif tracking-[0.2em] text-app-accent uppercase cursor-pointer pointer-events-auto"
                onClick={() => { 
                  navigate('/'); 
                  handleLogoClick(); 
                  if (clickCount >= 3) setDebugOverlay(true); 
                }}
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
          <main 
            className={isImmersiveProductPage ? '' : ''} 
            style={{ paddingTop: isImmersiveProductPage ? '0' : 'calc(var(--tg-safe-top, 0px) + 80px)' }}
          >
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
