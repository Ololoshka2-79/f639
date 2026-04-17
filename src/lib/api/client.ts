import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/v1';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Telegram Auth
apiClient.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData;
  
  if (initData) {
    config.headers['x-telegram-init-data'] = initData;
    config.headers['X-TG-Init-Data'] = initData;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for Global Error Handling
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  const message = error.response?.data?.message || error.message || 'Unknown API Error';
  console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
  
  // We could trigger a global toast or redirect to error page here
  return Promise.reject(error);
});
