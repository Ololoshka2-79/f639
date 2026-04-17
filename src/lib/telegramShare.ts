/**
 * Шаринг ссылки в Telegram из Mini App.
 * Порядок: shareUrl (синхронно из жеста) → openTelegramLink(t.me/share) → window.open.
 */
export function shareInTelegram(url: string, text: string): void {
  const tg = window.Telegram?.WebApp;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const telegramShareHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  if (tg) {
    try {
      if (typeof tg.shareUrl === 'function') {
        tg.shareUrl(url, text);
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
