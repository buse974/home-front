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
  const weatherCode = payload?.weatherCode ?? -1;
  const isRainy = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
    weatherCode,
  );
  const isCloudy = [1, 2, 3, 45, 48].includes(weatherCode);
  const dynamicBg = payload?.isDay
    ? "from-sky-500/25 via-cyan-500/10 to-blue-600/20"
    : "from-indigo-500/25 via-violet-600/10 to-slate-900/25";

  const tempColor = payload
    ? payload.temperature >= 30
      ? "from-orange-300 to-amber-200"
      : payload.temperature >= 20
        ? "from-yellow-200 to-amber-100"
        : payload.temperature >= 10
          ? "from-cyan-200 to-sky-100"
          : "from-blue-200 to-indigo-200"
    : "from-cyan-200 to-sky-100";

  const tempGlow = payload
    ? payload.temperature >= 30
      ? "rgba(251,146,60,0.3)"
      : payload.temperature >= 20
        ? "rgba(250,204,21,0.25)"
        : payload.temperature >= 10
          ? "rgba(125,211,252,0.3)"
          : "rgba(99,102,241,0.25)"
    : "rgba(125,211,252,0.3)";

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Glass base (consistent with other widgets) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-slate-900/20 to-slate-950/45 pointer-events-none" />

      {/* Weather-specific atmosphere overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${dynamicBg} pointer-events-none`} />

      {/* Glow orbs with weather tint */}
      <div
        className="absolute -top-20 -right-10 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-1000"
        style={{ background: payload?.isDay ? "rgba(125,211,252,0.15)" : "rgba(99,102,241,0.12)" }}
      />
      <div
        className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full blur-3xl pointer-events-none transition-colors duration-1000"
        style={{ background: payload?.isDay ? "rgba(56,189,248,0.12)" : "rgba(79,70,229,0.1)" }}
      />

      {(isCloudy || isRainy) && (
        <>
          <div className="weather-cloud weather-cloud-a" />
          <div className="weather-cloud weather-cloud-b" />
        </>
      )}
      {isRainy && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="weather-rain weather-rain-a" />
          <div className="weather-rain weather-rain-b" />
          <div className="weather-rain weather-rain-c" />
        </div>
      )}

      <div className="relative z-10 flex items-start justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-white line-clamp-1 tracking-tight">
            {dashboardWidget.name || "Meteo"}
          </h3>
          <p className="text-xs text-white/60 line-clamp-1 mt-0.5">{address}</p>
        </div>
        <div className="weather-icon-badge" aria-hidden>
          <span className="text-4xl leading-none">{weatherIcon}</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 rounded-2xl bg-black/25 border border-white/8 p-4 md:p-5 shadow-[0_12px_40px_rgba(8,10,22,0.4)]">
        {loading ? (
          <div className="h-full grid place-items-center text-white/50 text-sm">
            Chargement...
          </div>
        ) : error ? (
          <div className="h-full grid place-items-center text-center">
            <p className="text-sm text-amber-300/90">{error}</p>
          </div>
        ) : payload ? (
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between gap-3 flex-1">
              <div>
                <p
                  className={`text-5xl md:text-6xl font-black leading-none bg-gradient-to-br ${tempColor} bg-clip-text text-transparent`}
                  style={{ filter: `drop-shadow(0 0 20px ${tempGlow})` }}
                >
                  {Math.round(payload.temperature)}°
                </p>
                <p className="mt-2 text-sm text-white/90 font-medium">
                  {weatherLabel}
                </p>
                <p className="mt-0.5 text-xs text-white/45 line-clamp-1">
                  {payload.locationName}
                </p>
              </div>
              <div className="weather-hero-icon" aria-hidden>
                <span className="weather-hero-emoji">{weatherIcon}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-2.5 text-center transition-colors hover:bg-white/[0.09]">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Ressenti</p>
                <p className="text-white/90 font-bold text-sm tabular-nums">
                  {Math.round(payload.feelsLike)}°
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-2.5 text-center transition-colors hover:bg-white/[0.09]">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Humidite</p>
                <p className="text-white/90 font-bold text-sm tabular-nums">
                  {Math.round(payload.humidity)}%
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] p-2.5 text-center transition-colors hover:bg-white/[0.09]">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Vent</p>
                <p className="text-white/90 font-bold text-sm tabular-nums">
                  {Math.round(payload.windSpeed)}
                  <span className="text-[10px] text-white/50 ml-0.5">km/h</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-white/40 text-sm">
            Donnees indisponibles
          </div>
        )}
      </div>

      <style>{`
        .weather-icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 10px 28px rgba(4, 6, 20, 0.35);
          backdrop-filter: blur(8px);
        }
        .weather-cloud {
          position: absolute;
          width: 170px;
          height: 58px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgba(255,255,255,0.19), rgba(255,255,255,0.05));
          filter: blur(0.2px);
          opacity: 0.75;
          border: 1px solid rgba(255,255,255,0.16);
          pointer-events: none;
        }
        .weather-cloud-a {
          top: 24%;
          left: -26%;
          animation: weather-cloud-drift-a 19s linear infinite;
        }
        .weather-cloud-b {
          top: 11%;
          left: -34%;
          transform: scale(0.88);
          opacity: 0.55;
          animation: weather-cloud-drift-b 26s linear infinite;
        }
        .weather-rain {
          position: absolute;
          width: 2px;
          height: 18px;
          background: linear-gradient(to bottom, rgba(125,211,252,0), rgba(125,211,252,0.7));
          border-radius: 2px;
          opacity: 0.55;
          animation: weather-rain-fall 1.15s linear infinite;
        }
        .weather-rain-a { left: 28%; top: 8%; animation-delay: 0s; }
        .weather-rain-b { left: 48%; top: 2%; animation-delay: .25s; }
        .weather-rain-c { left: 68%; top: 12%; animation-delay: .5s; }
        .weather-hero-icon {
          width: 120px;
          height: 120px;
          border-radius: 28px;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), rgba(255,255,255,0.03) 68%);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.2),
            0 14px 36px rgba(6, 10, 30, 0.42),
            0 0 30px rgba(125,211,252,0.18);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          animation: weather-hero-float 4.8s ease-in-out infinite;
        }
        .weather-hero-emoji {
          font-size: 64px;
          line-height: 1;
          filter: drop-shadow(0 8px 12px rgba(4, 8, 24, 0.35));
          transform: translateY(2px);
        }
        @keyframes weather-hero-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes weather-cloud-drift-a {
          from { transform: translateX(0); }
          to { transform: translateX(185%); }
        }
        @keyframes weather-cloud-drift-b {
          from { transform: translateX(0) scale(0.88); }
          to { transform: translateX(210%) scale(0.88); }
        }
        @keyframes weather-rain-fall {
          from { transform: translateY(-8px); opacity: 0; }
          20% { opacity: 0.75; }
          to { transform: translateY(140px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
