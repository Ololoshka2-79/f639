/**
 * Инициализация Telegram Mini App: ready + expand как можно раньше и с повторами —
 * при открытии по inline-кнопке web_app иногда первый expand срабатывает до готовности viewport.
 */
export function bootstrapTelegramViewport(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  function setAppHeight() {
    const height = tg.viewportHeight;
    document.documentElement.style.setProperty('--tg-height', `${height}px`);
    // Also explicitly set on body to be sure
    document.body.style.height = `${height}px`;
    
    console.log('[Telegram Diagnostics]', {
      innerHeight: window.innerHeight,
      tgViewport: tg.viewportHeight,
      tgStableHeight: (tg as any).viewportStableHeight
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
    tg.onEvent('viewportChanged', () => {
      setAppHeight();
      // Force scroll to top to prevent "floating" layout
      window.scrollTo(0, 0);
    });

    // Force recalculation after ready
    setTimeout(() => {
      tg.expand?.();
      setAppHeight();
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('resize'));
    }, 300);

    // One more check for slow devices
    setTimeout(setAppHeight, 1000);

  } catch (e) {
    console.error('[Telegram] Init failed', e);
  }
}
