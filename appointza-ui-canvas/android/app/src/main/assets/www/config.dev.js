// Development Configuration - used when building with --mode development
window.APP_CONFIG = {
  // API Configuration - Development Server
  baseurl: 'https://appointza.com',
  templateBaseUrl: 'https://appointza.com/template',
  
  // Environment
  production: false,
  debugMode: true,
  
  // Google Maps
  googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',

  // Firebase Web Push (VAPID public key)
  vapidKey: 'BG6qfOt_h6ujiW_J14D57NDN_B-O2MS5WN-lq6C-d6ZpjJLYUnkBslIonPEnd55Ds-29ph9kU1IZisxaW-IMDBo',
  
  // Razorpay Configuration - Test Mode for Development
  razorpayKeyId: 'rzp_test_xxxxxxxxxxxxx',
  razorpayKeySecret: 'xxxxxxxxxxxxxxxxxxxxx',
  razorpayTestMode: true,
  
  // App Information
  appTitle: 'Appointza (Dev)',
  version: '1.0.0-dev',
  
  // Feature Flags
  features: {
    enableDebugLogs: true,
    enableAnalytics: false,
    enableErrorReporting: false
  }
};

