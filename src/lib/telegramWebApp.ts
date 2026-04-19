/**
 * Инициализация Telegram Mini App: ready + expand как можно раньше и с повторами.
 * Критично для inline-кнопки: WebView-контекст часто не ready на момент первого expand().
 * Трёхволновой форс закрывает баги iOS, Android WebView и Telegram Desktop.
 */
export function bootstrapTelegramViewport(): void {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  // ❗ FORCE FULLSCREEN — 3-wave expand cascade
  // Wave 1: synchronous — fires before any frame is painted
  tg.ready?.();
  tg.expand?.();

  // Wave 2: next microtask tick — catches iOS WebView that ignores sync expand
  setTimeout(() => { tg.expand?.(); }, 50);

  // Wave 3: after layout stabilizes — catches slow Android / Telegram Desktop
  setTimeout(() => { tg.expand?.(); }, 300);


  const setHeight = () => {
    // window.innerHeight is much more stable than tg.viewportHeight on initial render
    const h = window.innerHeight;
    const safeTop = tg.contentSafeAreaInset?.top || tg.safeAreaInset?.top || 0;
    
    document.documentElement.style.setProperty('--tg-height', `${h}px`);
    document.documentElement.style.setProperty('--tg-safe-top', `${safeTop}px`);
    
    console.log('Telegram WebApp init:', {
      isWebApp: !!tg.initData,
      platform: tg.platform,
      version: tg.version,
    });

    console.log('[Telegram Diagnostics]', {
      innerHeight: h,
      tgViewport: tg.viewportHeight,
      tgSafeTop: safeTop,
    });
  };

  try {
    // ready/expand already called in cascade above; call once more inside try for safety
    tg.ready?.();
    tg.expand?.();

    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
    }
    
    // Force fullscreen colors
    if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#ffffff');

    // Initial set
    setHeight();

    // iOS Guard: Initial visual viewport stabilization
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      requestAnimationFrame(() => {
        setTimeout(setHeight, 50);
      });
    }

    // Listen for changes (keyboard open, orientation, expand stabilization)
    tg.onEvent?.('viewportChanged', () => {
      setHeight();
      
      // Force hardware repaint on iOS to fix initial paint offset bugs
      if (isIOS) {
        requestAnimationFrame(() => {
          document.body.style.transform = 'translateZ(0)';
          // @ts-ignore
          document.body.offsetHeight;
        });
      }
    });

    window.addEventListener('resize', setHeight);

  } catch (e) {
    console.error('[Telegram] Init failed', e);
  }
}
