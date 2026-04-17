import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LuxuryErrorBoundary } from './components/ui/LuxuryErrorBoundary';
import App from './App.tsx';
import './index.css';
import { TelegramRouter } from './components/routing/TelegramRouter';
import { bootstrapTelegramViewport } from './lib/telegramWebApp';

bootstrapTelegramViewport();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LuxuryErrorBoundary>
        <BrowserRouter>
          <TelegramRouter>
            <App />
          </TelegramRouter>
        </BrowserRouter>
      </LuxuryErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
);
