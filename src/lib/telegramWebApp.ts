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
    
  } catch (e) {
    console.error('[Telegram] Init failed', e);
  }

  const expand = () => {
    try {
      tg.expand?.();
    } catch {
      /* noop */
    }
  };

  // Re-expand on some frames to ensure it sticks on all devices
  requestAnimationFrame(expand);
  window.setTimeout(expand, 100);
  window.setTimeout(expand, 500);
}
