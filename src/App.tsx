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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app-bg p-8 text-center">
        <h2 className="mb-4 font-serif text-2xl text-app-text">Пожалуйста, откройте приложение через Telegram</h2>
        <p className="text-sm text-app-text-muted">Это необходимо для корректной работы магазина и вашей безопасности.</p>
      </div>
    );
  }

  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();

  // ❗ CRITICAL: Force expand at the very first React lifecycle moment.
  // This fires BEFORE any other effects and is essential for inline-button WebView context.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready?.();
    tg.expand?.();
    // Wave 2: next tick (catches cases where viewport isn't ready yet)
    setTimeout(() => tg.expand?.(), 0);
    // Wave 3: after first layout (catches slow iOS WebView)
    setTimeout(() => tg.expand?.(), 150);
  }, []);

  useEffect(() => {
    syncRouteStack(location.pathname, navigationType);
  }, [location.pathname, navigationType]);
  const [clickCount, setClickCount] = useState(0);
  const { setAdminStatus, allowedIds } = useAdminStore();

  useEffect(() => {
    let cleanupSwipe: (() => void) | undefined;
    const anyTg = tg as any;

    console.log('WEBAPP CHECK', {
      hasWebApp: !!window.Telegram?.WebApp,
      initData: window.Telegram?.WebApp?.initData,
      platform: (window.Telegram?.WebApp as any)?.platform,
    });

    console.log('TELEGRAM OPEN CONTEXT', {
      url: window.location.href,
      ref: document.referrer,
      tg: tg,
      initData: tg?.initData,
      start_param: (tg?.initDataUnsafe as any)?.start_param,
    });

    console.log('LAUNCH MODE DEBUG', {
      href: window.location.href,
      initData: anyTg?.initData,
      initDataUnsafe: anyTg?.initDataUnsafe,
      platform: anyTg?.platform,
      version: anyTg?.version,
      isExpanded: anyTg?.isExpanded,
    });
    
    tg?.enableClosingConfirmation?.();
    
    // Force fullscreen expansion (additional waves after mount cascade)
    tg?.expand?.();
    
    // Recovery attempt after React paint settles
    const expandTimer = setTimeout(() => {
      tg?.expand?.();
      console.log('[WebApp] Recovery expand called');
    }, 150);

    tg?.ready?.();

    const tgUser = tg?.initDataUnsafe?.user;
    const isAllowedAdmin = tgUser && allowedIds.includes(tgUser.id.toString());
    if (isAllowedAdmin) {
      setAdminStatus(true);
    } else {
      setAdminStatus(false);
    }

    setLoading(false);
    analytics.trackAppOpen();

    return () => {
      clearTimeout(expandTimer);
      cleanupSwipe?.();
    };
  }, [setAdminStatus, allowedIds, tg]);

  // Separate useEffect for initial routing to ensure it only runs ONCE on mount
  useEffect(() => {
    const startParam = (tg?.initDataUnsafe as any)?.start_param;

    // ❗ ВСЕГДА сначала главная
    navigate('/', { replace: true });

    // только после этого — ручная маршрутизация
    setTimeout(() => {
      if (startParam && startParam.startsWith('product_')) {
        const productId = startParam.replace('product_', '');
        console.log('[Routing] Initializing at product (new prefix):', productId);
        navigate(`/product/${productId}`, { replace: true });
      } else if (startParam && startParam.startsWith('p_')) {
        const productId = startParam.substring(2);
        console.log('[Routing] Initializing at product (old prefix):', productId);
        navigate(`/product/${productId}`, { replace: true });
      }
    }, 0);
  }, []); // Run exactly once on mount

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
    <div className="h-[var(--tg-height,100vh)] w-full text-app-text transition-colors duration-500 overflow-x-hidden relative">
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
