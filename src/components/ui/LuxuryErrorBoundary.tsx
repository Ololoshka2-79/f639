import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LuxuryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Luxury Error] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-error/10 border border-error/20 rounded-full flex items-center justify-center text-error mb-8"
          >
            <AlertCircle size={40} />
          </motion.div>
          
          <h1 className="text-2xl font-serif text-app-text mb-4">Что-то пошло не так</h1>
          <p className="text-sm text-app-text-muted mb-10 max-w-xs leading-relaxed">
            Произошла непредвиденная ошибка. Пожалуйста, обновите страницу или вернитесь в начало.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={this.handleReset}
              className="w-full app-button-primary flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              Обновить страницу
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 text-app-text-muted uppercase text-[10px] tracking-[0.2em] font-bold"
            >
              На главную
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
