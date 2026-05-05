import React, { useEffect, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeManager: React.FC = () => {
  const { mode } = useThemeStore();

  const updateTheme = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    const isDark =
      mode === 'dark' ||
      (mode === 'auto' && tg?.colorScheme === 'dark');

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      if (tg) {
        tg.headerColor = '#000000'; // Match --app-bg
        tg.backgroundColor = '#000000'; // Match --app-bg
      }
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      if (tg) {
        tg.headerColor = '#FFFFFF'; // Match --app-bg
        tg.backgroundColor = '#FFFFFF'; // Match --app-bg
      }
    }
  }, [mode]);

  useEffect(() => {
    updateTheme();

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.onEvent?.('themeChanged', updateTheme);
      return () => {
        tg.offEvent?.('themeChanged', updateTheme);
      };
    }
  }, [updateTheme]);

  return null; // Side-effect only component
};
