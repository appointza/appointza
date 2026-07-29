/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_DOMAIN?: string;
  readonly VITE_TEMPLATE_BASE_URL?: string;
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ENABLE_DEBUG_LOGS?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_ERROR_REPORTING?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_RAZORPAY_KEY_SECRET?: string;
  readonly VITE_RAZORPAY_TEST_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}