import { useEffect, useState } from "react";

type LiveWeatherProps = {
  title?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  locationLabel?: string;
};

type WeatherSnapshot = {
  temperature: string;
  condition: string;
  wind: string;
  humidity: string;
};

function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "Mixed";
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lng))}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };
  const c = data.current;
  if (!c || c.temperature_2m == null) return null;
  return {
    temperature: `${Math.round(c.temperature_2m)}°C`,
    condition: weatherCodeLabel(Number(c.weather_code ?? 0)),
    wind: c.wind_speed_10m != null ? `${Math.round(c.wind_speed_10m)} km/h` : "—",
    humidity: c.relative_humidity_2m != null ? `${Math.round(c.relative_humidity_2m)}%` : "—",
  };
}

/** Live weather strip for the public site — Open-Meteo from property coordinates. */
export function LiveWeatherStats({ title, latitude, longitude, locationLabel }: LiveWeatherProps) {
  const [snap, setSnap] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError(true);
      return;
    }
    let cancelled = false;
    void fetchOpenMeteo(lat, lng)
      .then((result) => {
        if (cancelled) return;
        if (result) setSnap(result);
        else setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const items = snap
    ? [
        { value: snap.temperature, label: "Now" },
        { value: snap.condition, label: "Condition" },
        { value: snap.humidity, label: "Humidity" },
        { value: snap.wind, label: "Wind" },
      ]
    : [
        { value: "…", label: "Now" },
        { value: "…", label: "Condition" },
        { value: "…", label: "Humidity" },
        { value: "…", label: "Wind" },
      ];

  return (
    <section className="px-10 py-16">
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          {title || "Weather"}
        </h2>
        {locationLabel ? (
          <p className="text-xs font-mono uppercase tracking-widest text-muted">
            Live · {locationLabel}
          </p>
        ) : null}
      </div>
      {error && !snap ? (
        <p className="text-sm text-muted">Weather unavailable for this location right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((it, i) => (
            <div key={i} className="space-y-2">
              <div className="font-display text-4xl font-extrabold tracking-tight">{it.value}</div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted">{it.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
