/** Нормализованный путь приложения (без лишнего хвоста `/`) */
export function normalizeAppPath(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p.toLowerCase();
}

/** Главный экран приложения (дом) — закрываем Mini App */
export function isAppRootPath(pathname: string): boolean {
  const p = normalizeAppPath(pathname);
  return p === '/' || p === '';
}

/** Вкладки нижней навигации: «Назад» ведёт на главную `/` */
export function isMainTabPath(pathname: string): boolean {
  const p = normalizeAppPath(pathname);
  if (p === '/favorites' || p === '/cart') return true;
  if (p === '/profile') return true;
  if (p === '/catalog' || p.startsWith('/catalog/')) return true;
  return false;
}

export type TelegramBackLabelMode = 'close' | 'back';

/** Режим подписи нативной кнопки Telegram */
export function resolveTelegramBackLabelMode(
  pathname: string,
  opts: { profileSubScreen: string | null; lightboxOpen: boolean }
): TelegramBackLabelMode {
  if (opts.lightboxOpen) return 'back';
  const p = normalizeAppPath(pathname);
  if (p === '/checkout') return 'back';
  if (p === '/profile' && opts.profileSubScreen) return 'back';
  if (isAppRootPath(pathname)) return 'close';
  return 'back';
}

/** Подпись нативной кнопки: «Закрыть» на доме, иначе «Назад». BackButton всегда show — иначе теряется выход с корня. */
export function syncTelegramBackButtonLabel(mode: TelegramBackLabelMode): void {
  const bb = window.Telegram?.WebApp?.BackButton;
  if (!bb) return;

  const label = mode === 'close' ? 'Закрыть' : 'Назад';
  try {
    const extended = bb as {
      setText?: (text: string) => void;
      setParams?: (p: { is_visible?: boolean; text?: string }) => void;
    };
    extended.setText?.(label);
    extended.setParams?.({ is_visible: true, text: label });
    } catch {
      console.warn('[telegramBackButton] Failed to hide back button via hash change');
    }
}
