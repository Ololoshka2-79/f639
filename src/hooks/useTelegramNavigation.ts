import { useState } from 'react';

/** Детект Telegram Mini App (без дублирования BackButton — см. TelegramRouter). */
export const useTelegramNavigation = () => {
  const [isTelegram] = useState(
    () => typeof window !== 'undefined' && !!window.Telegram?.WebApp
  );

  return { isTelegram };
};
