/**
 * Инициализация Telegram Mini App: ready + expand как можно раньше и с повторами —
 * при открытии по inline-кнопке web_app иногда первый expand срабатывает до готовности viewport.
 */
export function bootstrapTelegramViewport(): void {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  const setHeight = () => {
    // window.innerHeight is much more stable than tg.viewportHeight on initial render
    const h = window.innerHeight;
    const safeTop = tg.contentSafeAreaInset?.top || tg.safeAreaInset?.top || 0;
    
    document.documentElement.style.setProperty('--tg-height', `${h}px`);
    document.documentElement.style.setProperty('--tg-safe-top', `${safeTop}px`);
    
    console.log('[Telegram Diagnostics]', {
      innerHeight: h,
      tgViewport: tg.viewportHeight,
      tgSafeTop: safeTop,
    });
  };

  try {
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

    // Listen for changes (keyboard open, orientation, expand stabilization)
    tg.onEvent?.('viewportChanged', setHeight);
    window.addEventListener('resize', setHeight);

  } catch (e) {
    console.error('[Telegram] Init failed', e);
  }
}
