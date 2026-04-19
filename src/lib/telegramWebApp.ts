/**
 * Инициализация Telegram Mini App: только базовый bootstrap.
 * Все дополнительные расширения (expand) теперь только в App.tsx.
 */
export function bootstrapTelegramViewport(): void {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  
  // 🚀 КАСКАДНЫЙ EXPAND: Пытаемся раскрыть приложение несколько раз, чтобы «дожать» Telegram
  const forceExpand = () => {
    tg.expand?.();
    if (!(tg as any).isExpanded) {
      setTimeout(() => tg.expand?.(), 100);
      setTimeout(() => tg.expand?.(), 500);
      setTimeout(() => tg.expand?.(), 1000);
    }
  };

  forceExpand();
  window.addEventListener('load', forceExpand);
  tg.onEvent?.('viewportChanged', (data: any) => {
    if (!data.isStateStable) forceExpand();
  });

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
