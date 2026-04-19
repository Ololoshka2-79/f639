/**
 * Инициализация Telegram Mini App: ready + expand как можно раньше и с повторами —
 * при открытии по inline-кнопке web_app иногда первый expand срабатывает до готовности viewport.
 */
export function bootstrapTelegramViewport(): void {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  function setAppHeight() {
    const height = tg.viewportHeight || window.innerHeight;
    const safeTop = tg.contentSafeAreaInset?.top || tg.safeAreaInset?.top || 0;
    
    document.documentElement.style.setProperty('--tg-height', `${height}px`);
    document.documentElement.style.setProperty('--tg-safe-top', `${safeTop}px`);
    
    console.log('[Telegram Diagnostics]', {
      innerHeight: window.innerHeight,
      tgViewport: tg.viewportHeight,
      tgSafeTop: safeTop,
    });
  }

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
    setAppHeight();

    // Listen for changes (keyboard open, etc)
    tg.onEvent?.('viewportChanged', setAppHeight);

  } catch (e) {
    console.error('[Telegram] Init failed', e);
  }
}
