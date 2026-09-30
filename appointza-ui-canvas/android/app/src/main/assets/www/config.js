window.APP_CONFIG = {
  // 1) Backend API — host:port the API runs on. The frontend calls this for /api/*.
  baseurl: "https://localhost:7117",
  // 2) Frontend UI — public site URL (login, Google, booking return links).
  uiBaseUrl: "http://localhost:8083",
  marketingDomain: "appointza.com",
  domainname: "appointza.com",

  production: true,
  debugMode: false,

  googleMapsApiKey: "AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ",
  vapidKey: "BG6qfOt_h6ujiW_J14D57NDN_B-O2MS5WN-lq6C-d6ZpjJLYUnkBslIonPEnd55Ds-29ph9kU1IZisxaW-IMDBo",

  razorpayKeyId: "rzp_live_RCRKKPVDZ3tLDv",
  razorpayKeySecret: "cLvDMGMb9AWeggkxTbs5qZms",
  razorpayTestMode: false,

  appTitle: "Appointza",
  version: "1.0.0",

  features: {
    enableDebugLogs: false,
    enableAnalytics: true,
    enableErrorReporting: true,
  },
};
