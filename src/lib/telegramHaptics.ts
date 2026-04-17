export type TelegramImpactStyle = 'light' | 'medium' | 'heavy';

export function triggerHaptic(style: TelegramImpactStyle = 'light'): void {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
}

export function triggerSelectionHaptic(): void {
  window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.();
}

export function triggerNotificationHaptic(type: 'success' | 'error' | 'warning'): void {
  window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(type);
}
