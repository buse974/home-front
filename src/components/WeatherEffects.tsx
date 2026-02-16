import { useMemo } from "react";

type WeatherEffectsProps = {
  weatherCode: number;
  isDay: boolean;
};

// Deterministic pseudo-random from seed
function seeded(seed: number) {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;
}

export function WeatherEffects({ weatherCode, isDay }: WeatherEffectsProps) {
  const code = weatherCode;
  const isRainy = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
  const isStormy = [95, 96, 99].includes(code);
  const isClear = code === 0;
  const isCloudy = [1, 2, 3, 45, 48].includes(code);

  // Rain drops array
  const rainDrops = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left: `${seeded(i) * 100}%`,
      delay: `${seeded(i + 50) * 1.5}s`,
      duration: `${0.5 + seeded(i + 100) * 0.6}s`,
      height: `${14 + seeded(i + 200) * 12}px`,
      opacity: 0.3 + seeded(i + 300) * 0.5,
    })),
    [],
  );

  // Snow flakes array
  const snowFlakes = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
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
  const stars = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
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
        @keyframes bg-rain {
          0% { transform: translateY(-10px); opacity: 0; }
          15% { opacity: var(--drop-opacity); }
          100% { transform: translateY(calc(100vh + 20px)); opacity: 0; }
        }
        @keyframes bg-snow {
          0% { transform: translate(0, -10px); opacity: 0; }
          10% { opacity: var(--flake-opacity); }
          100% { transform: translate(var(--drift), calc(100vh + 10px)); opacity: 0; }
        }
        @keyframes bg-star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        @keyframes bg-cloud-a {
          from { transform: translateX(-40%); }
          to { transform: translateX(140%); }
        }
        @keyframes bg-cloud-b {
          from { transform: translateX(-50%) scale(0.8); }
          to { transform: translateX(160%) scale(0.8); }
        }
        @keyframes bg-cloud-c {
          from { transform: translateX(-30%) scale(0.6); }
          to { transform: translateX(180%) scale(0.6); }
        }
        @keyframes bg-sun-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes bg-sun-pulse {
          0%, 100% { opacity: 0.12; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes bg-lightning {
          0%, 100% { opacity: 0; }
          4% { opacity: 0.5; }
          6% { opacity: 0; }
          8% { opacity: 0.3; }
          10% { opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* === Sky gradient === */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: isDay
              ? isRainy || isStormy
                ? "linear-gradient(to bottom, rgba(55,65,81,0.3) 0%, rgba(30,41,59,0.2) 40%, rgba(15,23,42,0.1) 100%)"
                : isCloudy
                  ? "linear-gradient(to bottom, rgba(71,85,105,0.2) 0%, rgba(51,65,85,0.15) 40%, rgba(30,41,59,0.1) 100%)"
                  : "transparent"
              : "linear-gradient(to bottom, rgba(15,10,46,0.4) 0%, rgba(26,17,69,0.3) 30%, rgba(15,23,42,0.2) 70%, rgba(2,6,23,0.15) 100%)",
          }}
        />

        {/* === Sun (clear day) === */}
        {isClear && isDay && (
          <>
            {/* Rays */}
            <div
              className="absolute"
              style={{
                top: "8%", right: "12%", width: "120px", height: "120px",
                background: "conic-gradient(from 0deg, transparent, rgba(250,204,21,0.06) 10%, transparent 20%)",
                borderRadius: "50%",
                animation: "bg-sun-rotate 20s linear infinite",
              }}
            />
            {/* Orb */}
            <div
              className="absolute rounded-full"
              style={{
                top: "12%", right: "16%", width: "60px", height: "60px",
                background: "radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(250,204,21,0.2) 40%, transparent 70%)",
                boxShadow: "0 0 60px rgba(250,204,21,0.2), 0 0 120px rgba(250,204,21,0.1)",
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                top: "12%", right: "16%", width: "60px", height: "60px",
                animation: "bg-sun-pulse 4s ease-in-out infinite",
                background: "radial-gradient(circle, rgba(253,224,71,0.15) 0%, transparent 70%)",
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
              className="absolute rounded-full"
              style={{
                top: "10%", right: "14%", width: "44px", height: "44px",
                background: "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)",
                boxShadow: "0 0 30px rgba(148,163,184,0.2), 0 0 80px rgba(148,163,184,0.08), inset -6px -4px 10px rgba(15,23,42,0.3)",
              }}
            />
            {/* Stars */}
            {!isCloudy && !isRainy && stars.map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: s.left, top: s.top,
                  width: s.size, height: s.size,
                  animation: `bg-star-twinkle ${2 + i * 0.3}s ease-in-out infinite ${s.delay}`,
                }}
              />
            ))}
          </>
        )}

        {/* === Clouds === */}
        {(isCloudy || isRainy || isStormy) && (
          <>
            <div
              className="absolute"
              style={{
                top: "12%", width: "45%", height: "22%", borderRadius: "999px",
                background: isDay
                  ? "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.2), rgba(71,85,105,0.05))",
                border: `1px solid ${isDay ? "rgba(255,255,255,0.08)" : "rgba(100,116,139,0.12)"}`,
                animation: "bg-cloud-a 22s linear infinite",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "6%", width: "35%", height: "16%", borderRadius: "999px",
                background: isDay
                  ? "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.15), rgba(71,85,105,0.03))",
                border: `1px solid ${isDay ? "rgba(255,255,255,0.06)" : "rgba(100,116,139,0.08)"}`,
                animation: "bg-cloud-b 30s linear infinite",
              }}
            />
            <div
              className="absolute"
              style={{
                top: "20%", width: "28%", height: "13%", borderRadius: "999px",
                background: isDay
                  ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.1), rgba(71,85,105,0.02))",
                animation: "bg-cloud-c 26s linear infinite",
              }}
            />
          </>
        )}

        {/* === Rain === */}
        {(isRainy || isStormy) && rainDrops.map((d, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: d.left, top: "-10px",
              width: "1.5px", height: d.height,
              background: "linear-gradient(to bottom, transparent, rgba(147,197,253,0.6))",
              opacity: d.opacity,
              ["--drop-opacity" as string]: d.opacity,
              animation: `bg-rain ${d.duration} linear infinite ${d.delay}`,
            }}
          />
        ))}

        {/* === Snow === */}
        {isSnowy && snowFlakes.map((f, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: f.left, top: "-10px",
              width: f.size, height: f.size,
              opacity: f.opacity,
              ["--flake-opacity" as string]: f.opacity,
              ["--drift" as string]: f.drift,
              animation: `bg-snow ${f.duration} linear infinite ${f.delay}`,
            }}
          />
        ))}

        {/* === Lightning flash === */}
        {isStormy && (
          <div
            className="absolute inset-0 bg-white"
            style={{ animation: "bg-lightning 6s ease-in-out infinite" }}
          />
        )}
      </div>
    </>
  );
}
