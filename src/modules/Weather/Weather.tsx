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

// Deterministic pseudo-random from seed
function seeded(seed: number) {
  return (((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1) + 1) % 1;
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
  const [debugWeatherCode, setDebugWeatherCode] = useState<number | null>(null);

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
    () =>
      payload
        ? getWeatherLabel(debugWeatherCode ?? payload.weatherCode)
        : "Meteo",
    [payload, debugWeatherCode],
  );
  const weatherIcon = useMemo(
    () =>
      payload
        ? getWeatherIcon(debugWeatherCode ?? payload.weatherCode, payload.isDay)
        : "🌤️",
    [payload, debugWeatherCode],
  );
  const code = debugWeatherCode ?? payload?.weatherCode ?? -1;
  const isDay = payload?.isDay ?? true;
  const isRainy = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
    code,
  );
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
  const isStormy = [95, 96, 99].includes(code);
  const isClear = code === 0;
  const isCloudy = [1, 2, 3, 45, 48].includes(code);

  // Temperature-based accent
  const temp = payload?.temperature ?? 15;
  const accent =
    temp >= 30
      ? {
          grad: "from-orange-400 to-amber-300",
          glow: "rgba(251,146,60,0.5)",
          orbA: "rgba(251,146,60,0.2)",
          orbB: "rgba(245,158,11,0.15)",
        }
      : temp >= 20
        ? {
            grad: "from-amber-300 to-yellow-200",
            glow: "rgba(252,211,77,0.4)",
            orbA: "rgba(252,211,77,0.15)",
            orbB: "rgba(250,204,21,0.1)",
          }
        : temp >= 10
          ? {
              grad: "from-cyan-300 to-sky-200",
              glow: "rgba(103,232,249,0.4)",
              orbA: "rgba(125,211,252,0.15)",
              orbB: "rgba(56,189,248,0.1)",
            }
          : temp >= 0
            ? {
                grad: "from-blue-300 to-indigo-200",
                glow: "rgba(147,197,253,0.4)",
                orbA: "rgba(147,197,253,0.12)",
                orbB: "rgba(99,102,241,0.1)",
              }
            : {
                grad: "from-indigo-300 to-violet-200",
                glow: "rgba(165,180,252,0.4)",
                orbA: "rgba(165,180,252,0.15)",
                orbB: "rgba(139,92,246,0.1)",
              };

  // Rain drops array
  const rainDrops = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${seeded(i) * 100}%`,
        delay: `${seeded(i + 50) * 1.5}s`,
        duration: `${0.5 + seeded(i + 100) * 0.6}s`,
        height: `${14 + seeded(i + 200) * 12}px`,
        opacity: 0.3 + seeded(i + 300) * 0.5,
      })),
    [],
  );

  // Snow flakes array
  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: `${seeded(i + 400) * 100}%`,
        delay: `${seeded(i + 500) * 4}s`,
        duration: `${3 + seeded(i + 600) * 3}s`,
        size: `${3 + seeded(i + 700) * 4}px`,
        opacity: 0.3 + seeded(i + 800) * 0.5,
        drift: `${-20 + seeded(i + 900) * 40}px`,
      })),
    [],
  );

  // Night stars
  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: `${seeded(i + 1000) * 90 + 5}%`,
        top: `${seeded(i + 1100) * 40 + 5}%`,
        delay: `${seeded(i + 1200) * 3}s`,
        size: `${1.5 + seeded(i + 1300) * 2}px`,
      })),
    [],
  );

  return (
    <>
      <style>{`
        @keyframes w-rain {
          0% { transform: translateY(-10px); opacity: 0; }
          15% { opacity: var(--drop-opacity); }
          100% { transform: translateY(calc(100cqh + 20px)); opacity: 0; }
        }
        @keyframes w-snow {
          0% { transform: translate(0, -10px); opacity: 0; }
          10% { opacity: var(--flake-opacity); }
          100% { transform: translate(var(--drift), calc(100cqh + 10px)); opacity: 0; }
        }
        @keyframes w-star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        @keyframes w-cloud-a {
          from { transform: translateX(-40%); }
          to { transform: translateX(140%); }
        }
        @keyframes w-cloud-b {
          from { transform: translateX(-50%) scale(0.8); }
          to { transform: translateX(160%) scale(0.8); }
        }
        @keyframes w-cloud-c {
          from { transform: translateX(-30%) scale(0.6); }
          to { transform: translateX(180%) scale(0.6); }
        }
        @keyframes w-sun-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes w-sun-pulse {
          0%, 100% { opacity: 0.12; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes w-lightning {
          0%, 100% { opacity: 0; }
          4% { opacity: 0.8; }
          6% { opacity: 0; }
          8% { opacity: 0.5; }
          10% { opacity: 0; }
        }
        @keyframes w-icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div
        className="relative h-full flex flex-col rounded-2xl overflow-hidden backdrop-blur-xl"
        style={{ containerType: "size" }}
      >
        {/* === Sky gradient === */}
        <div
          className="absolute inset-0 transition-all duration-1000 pointer-events-none"
          style={{
            background: isDay
              ? isRainy || isStormy
                ? "linear-gradient(to bottom, #374151 0%, #1e293b 40%, #0f172a 100%)"
                : isCloudy
                  ? "linear-gradient(to bottom, #475569 0%, #334155 40%, #1e293b 100%)"
                  : "linear-gradient(to bottom, #0c4a6e 0%, #0369a1 30%, #0284c7 60%, #38bdf8 100%)"
              : "linear-gradient(to bottom, #0f0a2e 0%, #1a1145 30%, #0f172a 70%, #020617 100%)",
          }}
        />

        {/* === Sun (clear day) === */}
        {isClear && isDay && (
          <>
            {/* Rays */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "8%",
                right: "12%",
                width: "120px",
                height: "120px",
                background:
                  "conic-gradient(from 0deg, transparent, rgba(250,204,21,0.08) 10%, transparent 20%)",
                borderRadius: "50%",
                animation: "w-sun-rotate 20s linear infinite",
              }}
            />
            {/* Orb */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                top: "12%",
                right: "16%",
                width: "60px",
                height: "60px",
                background:
                  "radial-gradient(circle, rgba(253,224,71,0.7) 0%, rgba(250,204,21,0.3) 40%, transparent 70%)",
                boxShadow:
                  "0 0 60px rgba(250,204,21,0.3), 0 0 120px rgba(250,204,21,0.15)",
              }}
            />
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                top: "12%",
                right: "16%",
                width: "60px",
                height: "60px",
                animation: "w-sun-pulse 4s ease-in-out infinite",
                background:
                  "radial-gradient(circle, rgba(253,224,71,0.2) 0%, transparent 70%)",
                transform: "translate(-50%, -50%) scale(2.5)",
              }}
            />
          </>
        )}

        {/* === Moon + Stars (night) === */}
        {!isDay && (
          <>
            {/* Moon */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                top: "10%",
                right: "14%",
                width: "44px",
                height: "44px",
                background:
                  "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)",
                boxShadow:
                  "0 0 30px rgba(148,163,184,0.3), 0 0 80px rgba(148,163,184,0.1), inset -6px -4px 10px rgba(15,23,42,0.4)",
              }}
            />
            {/* Stars */}
            {!isCloudy &&
              !isRainy &&
              stars.map((s, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white pointer-events-none"
                  style={{
                    left: s.left,
                    top: s.top,
                    width: s.size,
                    height: s.size,
                    animation: `w-star-twinkle ${2 + i * 0.3}s ease-in-out infinite ${s.delay}`,
                  }}
                />
              ))}
          </>
        )}

        {/* === Clouds === */}
        {(isCloudy || isRainy || isStormy) && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{
                top: "12%",
                width: "45%",
                height: "22%",
                borderRadius: "999px",
                background: isDay
                  ? "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.3), rgba(71,85,105,0.08))",
                border: `1px solid ${isDay ? "rgba(255,255,255,0.15)" : "rgba(100,116,139,0.2)"}`,
                animation: "w-cloud-a 22s linear infinite",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: "6%",
                width: "35%",
                height: "16%",
                borderRadius: "999px",
                background: isDay
                  ? "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.2), rgba(71,85,105,0.04))",
                border: `1px solid ${isDay ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.12)"}`,
                animation: "w-cloud-b 30s linear infinite",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: "20%",
                width: "28%",
                height: "13%",
                borderRadius: "999px",
                background: isDay
                  ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.15), rgba(71,85,105,0.03))",
                animation: "w-cloud-c 26s linear infinite",
              }}
            />
          </>
        )}

        {/* === Rain === */}
        {(isRainy || isStormy) &&
          rainDrops.map((d, i) => (
            <div
              key={i}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: d.left,
                top: "-10px",
                width: "1.5px",
                height: d.height,
                background:
                  "linear-gradient(to bottom, transparent, rgba(147,197,253,0.7))",
                opacity: d.opacity,
                ["--drop-opacity" as string]: d.opacity,
                animation: `w-rain ${d.duration} linear infinite ${d.delay}`,
              }}
            />
          ))}

        {/* === Snow === */}
        {isSnowy &&
          snowFlakes.map((f, i) => (
            <div
              key={i}
              className="absolute pointer-events-none rounded-full bg-white"
              style={{
                left: f.left,
                top: "-10px",
                width: f.size,
                height: f.size,
                opacity: f.opacity,
                ["--flake-opacity" as string]: f.opacity,
                ["--drift" as string]: f.drift,
                animation: `w-snow ${f.duration} linear infinite ${f.delay}`,
              }}
            />
          ))}

        {/* === Lightning flash === */}
        {isStormy && (
          <div
            className="absolute inset-0 bg-white pointer-events-none"
            style={{ animation: "w-lightning 6s ease-in-out infinite" }}
          />
        )}

        {/* === Content === */}
        <div className="relative z-10 flex flex-col h-full p-5">
          {/* Debug mode selector */}
          <div className="absolute top-2 left-2 z-50">
            <select
              value={debugWeatherCode ?? ""}
              onChange={(e) =>
                setDebugWeatherCode(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="text-xs px-2 py-1 rounded bg-black/40 text-white/90 border border-white/20 backdrop-blur-sm"
            >
              <option value="">🔴 Live</option>
              <option value="0">☀️ Ciel dégagé (0)</option>
              <option value="1">⛅ Peu nuageux (1)</option>
              <option value="3">☁️ Couvert (3)</option>
              <option value="45">🌫️ Brouillard (45)</option>
              <option value="51">🌧️ Bruine légère (51)</option>
              <option value="61">🌧️ Pluie (61)</option>
              <option value="65">🌧️ Pluie forte (65)</option>
              <option value="71">❄️ Neige légère (71)</option>
              <option value="75">❄️ Neige forte (75)</option>
              <option value="95">⛈️ Orage (95)</option>
            </select>
          </div>

          {/* Top bar: location + icon */}
          <div className="flex items-start justify-between mb-auto">
            <div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
                {dashboardWidget.name || "Meteo"}
              </p>
              <p className="text-sm text-white/70 mt-0.5 line-clamp-1">
                {payload?.locationName || address}
              </p>
            </div>
            <span
              className="text-5xl leading-none"
              style={{
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                animation: "w-icon-float 5s ease-in-out infinite",
              }}
            >
              {weatherIcon}
            </span>
          </div>

          {/* Center: temperature hero */}
          <div className="flex-1 flex items-center">
            {loading ? (
              <div className="text-white/40 text-sm">Chargement...</div>
            ) : error ? (
              <p className="text-sm text-amber-300/90">{error}</p>
            ) : payload ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-7xl md:text-8xl font-black leading-none bg-gradient-to-br ${accent.grad} bg-clip-text text-transparent`}
                    style={{ filter: `drop-shadow(0 0 30px ${accent.glow})` }}
                  >
                    {Math.round(payload.temperature)}
                  </span>
                  <span
                    className={`text-3xl font-bold bg-gradient-to-br ${accent.grad} bg-clip-text text-transparent`}
                  >
                    °C
                  </span>
                </div>
                <p className="mt-2 text-base text-white/80 font-medium">
                  {weatherLabel}
                </p>
              </div>
            ) : null}
          </div>

          {/* Bottom stats bar */}
          {payload && !loading && !error && (
            <div className="flex items-center gap-4 pt-3 border-t border-white/10">
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase tracking-wider text-white/35">
                  Ressenti
                </p>
                <p className="text-white/90 font-bold text-sm tabular-nums mt-0.5">
                  {Math.round(payload.feelsLike)}°
                </p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase tracking-wider text-white/35">
                  Humidite
                </p>
                <p className="text-white/90 font-bold text-sm tabular-nums mt-0.5">
                  {Math.round(payload.humidity)}%
                </p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex-1 text-center">
                <p className="text-[10px] uppercase tracking-wider text-white/35">
                  Vent
                </p>
                <p className="text-white/90 font-bold text-sm tabular-nums mt-0.5">
                  {Math.round(payload.windSpeed)}
                  <span className="text-[10px] text-white/40 ml-0.5">km/h</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
