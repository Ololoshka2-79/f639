/**
 * Шаринг ссылки в Telegram из Mini App через startapp deep link.
 */
export function shareInTelegram(payload: string, text: string): void {
  const tg = window.Telegram?.WebApp;
  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'f_639_bot';
  
  // Создаем deep link: https://t.me/bot?startapp=payload
  const deepLink = `https://t.me/${botUsername}?startapp=${payload}`;
  
  const encodedUrl = encodeURIComponent(deepLink);
  const encodedText = encodeURIComponent(text);
  const telegramShareHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  if (tg) {
    try {
      // Пытаемся использовать нативный метод shareUrl если доступен
      if (typeof tg.shareUrl === 'function') {
        tg.shareUrl(deepLink, text);
        return;
      }
    } catch (e) {
      console.warn('[telegramShare] shareUrl failed', e);
    }

    try {
      if (typeof tg.openTelegramLink === 'function') {
        tg.openTelegramLink(telegramShareHref);
        return;
      }
    } catch (e) {
      console.warn('[telegramShare] openTelegramLink failed', e);
    }
  }

  window.open(telegramShareHref, '_blank', 'noopener,noreferrer');
}
