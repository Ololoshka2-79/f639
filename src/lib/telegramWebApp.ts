/**
 * Инициализация Telegram Mini App: только базовый bootstrap.
 * Все дополнительные расширения (expand) теперь только в App.tsx.
 */
export function bootstrapTelegramViewport(): void {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();

  // Базовые стили
  if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#ffffff');
  
  // Установка высоты (базовая)
  const setHeight = () => {
    const h = window.innerHeight;
    document.documentElement.style.setProperty('--tg-height', `${h}px`);
    
    console.log('Telegram WebApp bootstrap debug:', {
      platform: tg.platform,
      initDataExists: !!tg.initData,
    });
  };

  setHeight();
  window.addEventListener('resize', setHeight);
  tg.onEvent?.('viewportChanged', setHeight);

  if (tg.disableVerticalSwipes) {
    tg.disableVerticalSwipes();
  }
}
