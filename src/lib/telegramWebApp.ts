/**
 * Инициализация Telegram Mini App: ready + expand как можно раньше и с повторами —
 * при открытии по inline-кнопке web_app иногда первый expand срабатывает до готовности viewport.
 */
export function bootstrapTelegramViewport(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    tg.ready?.();
    tg.expand?.();

    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
    }
    
    // Force fullscreen colors to avoid slit
    if ((tg as any).setHeaderColor) (tg as any).setHeaderColor('#ffffff');
    if ((tg as any).setBackgroundColor) (tg as any).setBackgroundColor('#ffffff');

    // Key fix: Set explicitly from telegram viewport height
    if ((tg as any).viewportHeight) {
      document.body.style.height = `${(tg as any).viewportHeight}px`;
    }

    // Re-expand slightly later to catch delayed layout
    setTimeout(() => {
      tg.expand?.();
      if ((tg as any).viewportHeight) {
        document.body.style.height = `${(tg as any).viewportHeight}px`;
      }
    }, 200);

    // Force layout recalculation
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

  } catch (e) {
    console.error('[Telegram] Init failed', e);
  }
}
