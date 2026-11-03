type GoogleMapsNamespace = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: Record<string, unknown>,
    ) => GoogleMapInstance;
    Marker: new (opts: Record<string, unknown>) => GoogleMarkerInstance;
    LatLngBounds: new () => GoogleLatLngBounds;
    event: { clearInstanceListeners: (instance: unknown) => void };
  };
};

export type GoogleMapInstance = {
  setCenter: (c: { lat: number; lng: number }) => void;
  setZoom: (z: number) => void;
  fitBounds: (b: GoogleLatLngBounds, padding?: number) => void;
};

export type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void;
  addListener: (event: string, handler: () => void) => void;
};

export type GoogleLatLngBounds = {
  extend: (c: { lat: number; lng: number }) => void;
  isEmpty: () => boolean;
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
    __appointzaMapsReady?: Promise<void>;
  }
}

/** Load Google Maps JS once using the browser key from config.js. */
export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps requires a browser."));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }
  const key = (apiKey || "").trim();
  if (!key) {
    return Promise.reject(new Error("Google Maps API key is missing in config.js"));
  }

  if (!window.__appointzaMapsReady) {
    window.__appointzaMapsReady = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-appointza-maps]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
        return;
      }
      const script = document.createElement("script");
      script.dataset.appointzaMaps = "1";
      script.async = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
        "&v=weekly";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  }

  return window.__appointzaMapsReady.then(() => {
    if (!window.google?.maps) {
      throw new Error("Google Maps failed to initialize");
    }
    return window.google;
  });
}
