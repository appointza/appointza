// Configuration file - you can change these values without rebuilding
(function () {
  var isLocal =
    typeof location !== "undefined" &&
    (location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname.endsWith(".localhost"));
  window.APP_CONFIG = {
  // Local Vite dev → local appointza API (dotnet run, port 5117). Production → appointza.com.
  baseurl: isLocal ? "http://localhost:5117" : "https://appointza.com",
  templateBaseUrl: isLocal ? "http://localhost:5117/template" : "https://appointza.com/template",
  uiBaseUrl: isLocal ? "http://localhost:8083" : "https://appointza.com",
  marketingDomain: 'appointza.com',
  
  // Environment
  production: true,
  debugMode: false,
  
  // Google Maps
  googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',

  // Firebase Web Push (VAPID public key)
  vapidKey: 'BG6qfOt_h6ujiW_J14D57NDN_B-O2MS5WN-lq6C-d6ZpjJLYUnkBslIonPEnd55Ds-29ph9kU1IZisxaW-IMDBo',
  
  // Razorpay Configuration - CHANGE THESE FOR YOUR LIVE ACCOUNT
  razorpayKeyId: 'rzp_live_RCRKKPVDZ3tLDv',
  razorpayKeySecret: 'cLvDMGMb9AWeggkxTbs5qZms',
  razorpayTestMode: false,
  
  // App Information
  appTitle: 'Appointza',
  version: '1.0.0',
  
  // Feature Flags
  features: {
    enableDebugLogs: false,
    enableAnalytics: true,
    enableErrorReporting: true
  }
};
})();
