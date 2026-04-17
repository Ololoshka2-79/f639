declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?(): void;
        expand?(): void;
        enableClosingConfirmation?(): void;
        disableVerticalSwipes?(): void;
        close?(): void;
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
            photo_url?: string;
            /** Может появиться после успешного requestContact (зависит от клиента). */
            phone_number?: string;
          };
        };
        headerColor?: string;
        backgroundColor?: string;
        colorScheme?: 'light' | 'dark';
        isVersionAtLeast?(version: string): boolean;
        shareUrl?(url: string, text?: string): void;
        /** Открывает t.me / @username ссылки внутри Telegram */
        openTelegramLink?(url: string): void;
        /** Bot API 6.9+ */
        requestContact?(callback: (shared: boolean) => void): void;
        onEvent?(eventType: string, eventHandler: (data: unknown) => void): void;
        offEvent?(eventType: string, eventHandler: (data: unknown) => void): void;
        BackButton?: {
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          setText?(text: string): void;
          setParams?(params: { is_visible?: boolean; text?: string }): void;
        };
        HapticFeedback?: {
          impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
          notificationOccurred(type: 'success' | 'error' | 'warning'): void;
          selectionChanged?(): void;
        };
      };
    };
  }
}

export {};