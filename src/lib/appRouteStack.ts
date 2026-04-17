import type { NavigateFunction } from 'react-router-dom';
import type { NavigationType } from 'react-router-dom';

const stack: string[] = [];

/**
 * Синхронизация внутреннего стека с React Router (pathname + тип навигации).
 */
export function syncRouteStack(pathname: string, type: NavigationType): void {
  if (stack.length === 0) {
    stack.push(pathname);
    return;
  }

  if (type === 'POP') {
    if (stack.length > 1) stack.pop();
    return;
  }

  if (type === 'REPLACE') {
    stack[stack.length - 1] = pathname;
    return;
  }

  if (type === 'PUSH') {
    if (stack[stack.length - 1] !== pathname) stack.push(pathname);
  }
}

/**
 * Нативная «Назад» в Mini App: предыдущий экран в стеке без выхода из сценария.
 */
export function performAppBack(navigate: NavigateFunction): boolean {
  if (stack.length <= 1) {
    navigate('/');
    return true;
  }
  stack.pop();
  const dest = stack[stack.length - 1];
  navigate(dest, { replace: true });
  return true;
}
