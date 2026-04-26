/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_FALLBACK_TO_MOCKS?: string;
  readonly VITE_TELEGRAM_BOT_TOKEN?: string;
  readonly VITE_ADMIN_CHAT_IDS?: string;
  readonly VITE_ADMIN_CHAT_ID?: string;
  readonly VITE_ADMIN_TELEGRAM_USER_IDS?: string;
  readonly VITE_BOT_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
