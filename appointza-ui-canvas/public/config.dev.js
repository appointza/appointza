// Development Configuration - used when building with --mode development
(function () {
  var isLocal =
    typeof location !== "undefined" &&
    (location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname.endsWith(".localhost"));
  window.APP_CONFIG = {
  baseurl: isLocal ? "http://localhost:5117" : "https://appointza.com",
  templateBaseUrl: isLocal ? "http://localhost:5117/template" : "https://appointza.com/template",
  uiBaseUrl: isLocal ? "http://localhost:8083" : "https://appointza.com",
  marketingDomain: 'appointza.com',
  
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
})();

