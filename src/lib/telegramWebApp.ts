/**
 * Инициализация Telegram Mini App: ready + expand как можно раньше и с повторами —
 * при открытии по inline-кнопке web_app иногда первый expand срабатывает до готовности viewport.
 */
export function bootstrapTelegramViewport(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  try {
    tg.ready?.();
  } catch {
    /* noop */
  }

  const expand = () => {
    try {
      tg.expand?.();
    } catch {
      /* noop */
    }
  };

  expand();
  requestAnimationFrame(expand);
  queueMicrotask(expand);
  window.setTimeout(expand, 0);
  window.setTimeout(expand, 120);
  window.setTimeout(expand, 400);
}
