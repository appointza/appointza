// Development — local API (edit this for local API host/port)
(function () {
  var isLocal =
    typeof location !== "undefined" &&
    (location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname.endsWith(".localhost"));

  window.APP_CONFIG = {
    baseurl: isLocal ? "http://localhost:5000" : "https://stay.appointza.com",
    templateBaseUrl: isLocal
      ? "http://localhost:5000/template"
      : "https://stay.appointza.com/template",
    domainSuffix: "stay.appointza.com",
    production: false,
    debugMode: true,
    appTitle: "Appointza Stay (Dev)",
    version: "1.0.0-dev",
    features: {
      enableDebugLogs: true,
      enableAnalytics: false,
      enableErrorReporting: false,
    },
  };
})();
