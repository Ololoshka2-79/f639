import { useCallback } from 'react';
import { triggerHaptic, triggerNotificationHaptic, triggerSelectionHaptic } from '../lib/telegramHaptics';

export const useHaptics = () => {
  const success = useCallback(() => {
    triggerNotificationHaptic('success');
  }, []);

  const error = useCallback(() => {
    triggerNotificationHaptic('error');
  }, []);

  const warning = useCallback(() => {
    triggerNotificationHaptic('warning');
  }, []);

  const selection = useCallback(() => {
    triggerSelectionHaptic();
  }, []);

  const impactLight = useCallback(() => {
    triggerHaptic('light');
  }, []);

  const impactMedium = useCallback(() => {
    triggerHaptic('medium');
  }, []);

  return {
    success,
    error,
    warning,
    selection,
    impactLight,
    impactMedium,
  };
};
