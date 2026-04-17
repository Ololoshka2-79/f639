import React, { useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  isAppRootPath,
  isMainTabPath,
  normalizeAppPath,
  resolveTelegramBackLabelMode,
  syncTelegramBackButtonLabel,
} from '../../lib/telegramBackButton';
import { useCheckoutStore } from '../../store/checkoutStore';
import { performAppBack } from '../../lib/appRouteStack';
import { useProductLightboxStore } from '../../store/productLightboxStore';
import { useProfileNavStore } from '../../store/profileNavStore';

/**
 * Telegram WebApp: на главной скрываем BackButton, чтобы Telegram показывал нативное закрытие Mini App.
 * На вложенных экранах показываем BackButton и оставляем поведение «Назад».
 */
export const TelegramRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const profileSub = useProfileNavStore((s) => s.subScreen);
  const lightboxOpen = useProductLightboxStore((s) => s.isOpen);
  useLayoutEffect(() => {
    const tg = window.Telegram?.WebApp;
    const BackButton = tg?.BackButton;
    if (!tg || !BackButton) return;

    const handleBack = () => {
      const path = normalizeAppPath(window.location.pathname);

      if (useProductLightboxStore.getState().isOpen) {
        useProductLightboxStore.getState().setOpen(false);
        return;
      }

      if (path === '/checkout') {
        const step = useCheckoutStore.getState().currentStep;
        if (step > 1) {
          useCheckoutStore.getState().setStep(step - 1);
          window.scrollTo(0, 0);
          return;
        }
        navigate('/cart');
        return;
      }

      if (path === '/profile') {
        const sub = useProfileNavStore.getState().subScreen;
        if (sub) {
          useProfileNavStore.getState().closeSubScreen();
          return;
        }
      }

      if (isAppRootPath(window.location.pathname)) {
        tg.close?.();
        return;
      }

      if (isMainTabPath(window.location.pathname)) {
        navigate('/');
        return;
      }

      if (path.startsWith('/product/')) {
        navigate(-1);
        return;
      }

      performAppBack(navigate);
    };

    const syncVisibilityAndLabel = (path: string) => {
      const isRoot = isAppRootPath(path) && !useProductLightboxStore.getState().isOpen;
      if (isRoot) {
        BackButton.hide?.();
        return;
      }
      BackButton.show?.();
      const mode = resolveTelegramBackLabelMode(path, {
        profileSubScreen: useProfileNavStore.getState().subScreen,
        lightboxOpen: useProductLightboxStore.getState().isOpen,
      });
      syncTelegramBackButtonLabel(mode);
    };

    syncVisibilityAndLabel(location.pathname);

    const applyLabel = () => {
      syncVisibilityAndLabel(window.location.pathname);
    };

    const raf = requestAnimationFrame(applyLabel);
    const t0 = window.setTimeout(applyLabel, 0);
    const t1 = window.setTimeout(applyLabel, 50);

    BackButton.onClick(handleBack);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      BackButton.offClick(handleBack);
    };
  }, [location.pathname, location.key, navigate, profileSub, lightboxOpen]);

  return <>{children}</>;
};
