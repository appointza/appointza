// Base URL constant - single reference point for the application domain
// Uses Vite environment variables (VITE_ prefix required)
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://appointza.com';
export const DOMAIN = import.meta.env.VITE_DOMAIN || 'appointza.com';

// Get configuration from environment variables or window.APP_CONFIG
const getConfig = () => {
  // Check if config is available in window object (for runtime config)
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return (window as any).APP_CONFIG;
  }
  
  // Use Vite environment variables (VITE_ prefix required)
  return {
    baseurl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BASE_URL || 'https://appointza.com',
    templateBaseUrl: import.meta.env.VITE_TEMPLATE_BASE_URL || `${BASE_URL}/template`,
    production: import.meta.env.PROD || false,
    mode: import.meta.env.MODE || 'development',
    debugMode: import.meta.env.DEV || false,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    razorpayKeySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
    razorpayTestMode: import.meta.env.VITE_RAZORPAY_TEST_MODE !== 'false',
    appTitle: import.meta.env.VITE_APP_TITLE || 'Webzys',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    features: {
      enableDebugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true'
    }
  };
};

export const environment = getConfig();

// Export baseurl directly for convenience
export const API_BASE_URL = environment.baseurl;

