export type ReverseGeocodeResult = {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export function getCurrentPositionCoords(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission denied. Allow access and try again."));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Timed out getting your location. Try again."));
        } else {
          reject(new Error("Could not get your current location."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
}

/** Reverse-geocode via OpenStreetMap Nominatim (best-effort; may be rate-limited). */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${encodeURIComponent(String(latitude))}` +
      `&lon=${encodeURIComponent(String(longitude))}` +
      `&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    const road = [a.house_number, a.road].filter(Boolean).join(" ");
    const address =
      road ||
      a.neighbourhood ||
      a.suburb ||
      data.display_name ||
      "";
    return {
      address,
      city: a.city || a.town || a.village || a.municipality || a.suburb || "",
      state: a.state || a.region || a.province || "",
      country: a.country || "",
      pincode: a.postcode || "",
    };
  } catch {
    return null;
  }
}
