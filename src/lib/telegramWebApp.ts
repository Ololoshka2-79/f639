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
    // Also set some colors for seamless look
    tg.headerColor = tg.colorScheme === 'dark' ? '#000000' : '#FFFFFF';
    tg.backgroundColor = tg.colorScheme === 'dark' ? '#000000' : '#FFFFFF';
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
