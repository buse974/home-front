import { useEffect, useMemo, useState } from "react";
import type { WidgetComponentProps } from "../../types";

type WeatherPayload = {
  locationName: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
};

function buildAddressCandidates(input: string): string[] {
  const normalized = input.trim();
  const candidates: string[] = [];

  if (normalized) candidates.push(normalized);

  const commaParts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (commaParts.length > 1) {
    candidates.push(commaParts[commaParts.length - 1]);
  }

  const postalCityMatch = normalized.match(/\b(\d{5}\s+[A-Za-zÀ-ÿ' -]+)\b/);
  if (postalCityMatch?.[1]) {
    candidates.push(postalCityMatch[1].trim());
  }

  if (commaParts.length > 0) {
    const maybeCity = commaParts[commaParts.length - 1].replace(/^\d+\s*/, "");
    if (maybeCity) candidates.push(maybeCity.trim());
  }

  return [...new Set(candidates)];
}

function getWeatherLabel(code: number): string {
  if (code === 0) return "Ciel degage";
  if ([1, 2].includes(code)) return "Peu nuageux";
  if (code === 3) return "Couvert";
  if ([45, 48].includes(code)) return "Brouillard";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Pluie";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neige";
  if ([95, 96, 99].includes(code)) return "Orage";
  return "Meteo";
}

function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if ([1, 2, 3].includes(code)) return isDay ? "⛅" : "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

export function Weather({ dashboardWidget }: WidgetComponentProps) {
  const config = dashboardWidget.config || {};
  const address =
    typeof config.address === "string" && config.address.trim()
      ? config.address.trim()
      : "Paris";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | null = null;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const addressCandidates = buildAddressCandidates(address);
        let place: any = null;

        for (const candidate of addressCandidates) {
          const geocodeRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=fr&format=json`,
          );
          if (!geocodeRes.ok) continue;
          const geocodeJson = await geocodeRes.json();
          place = geocodeJson?.results?.[0] || null;
          if (place) break;
        }

        if (!place) throw new Error("Adresse introuvable");

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`,
        );
        if (!weatherRes.ok) throw new Error("Weather failed");
        const weatherJson = await weatherRes.json();
        const current = weatherJson?.current;
        if (!current) throw new Error("Donnees meteo indisponibles");

        if (!active) return;
        setPayload({
          locationName: [place.name, place.country].filter(Boolean).join(", "),
          temperature: Number(current.temperature_2m),
          feelsLike: Number(current.apparent_temperature),
          humidity: Number(current.relative_humidity_2m),
          windSpeed: Number(current.wind_speed_10m),
          weatherCode: Number(current.weather_code),
          isDay: Number(current.is_day) === 1,
        });
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Erreur meteo inconnue";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchWeather();
    refreshTimer = window.setInterval(
      () => {
        void fetchWeather();
      },
      10 * 60 * 1000,
    );

    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, [address]);

  const weatherLabel = useMemo(
    () => (payload ? getWeatherLabel(payload.weatherCode) : "Meteo"),
    [payload],
  );
  const weatherIcon = useMemo(
    () => (payload ? getWeatherIcon(payload.weatherCode, payload.isDay) : "🌤️"),
    [payload],
  );

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white line-clamp-1">
            {dashboardWidget.name || "Meteo"}
          </h3>
          <p className="text-xs text-white/55 line-clamp-1">{address}</p>
        </div>
        <span className="text-3xl" aria-hidden>
          {weatherIcon}
        </span>
      </div>

      <div className="relative z-10 flex-1 min-h-0 rounded-xl bg-black/30 border border-white/10 p-4">
        {loading ? (
          <div className="h-full grid place-items-center text-white/70">
            Chargement meteo...
          </div>
        ) : error ? (
          <div className="h-full grid place-items-center text-center">
            <p className="text-sm text-amber-300/90">{error}</p>
          </div>
        ) : payload ? (
          <div className="h-full flex flex-col justify-between">
            <div>
              <p className="text-4xl font-black text-cyan-200 leading-none">
                {Math.round(payload.temperature)}°C
              </p>
              <p className="mt-1 text-sm text-white/80">{weatherLabel}</p>
              <p className="mt-1 text-xs text-white/55 line-clamp-1">
                {payload.locationName}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                <p className="text-white/45">Ressenti</p>
                <p className="text-white font-semibold">
                  {Math.round(payload.feelsLike)}°C
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                <p className="text-white/45">Humidite</p>
                <p className="text-white font-semibold">
                  {Math.round(payload.humidity)}%
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                <p className="text-white/45">Vent</p>
                <p className="text-white font-semibold">
                  {Math.round(payload.windSpeed)} km/h
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-white/60">
            Donnees indisponibles
          </div>
        )}
      </div>
    </div>
  );
}
