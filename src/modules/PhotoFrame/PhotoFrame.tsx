import { useEffect, useMemo, useState } from "react";
import type { WidgetComponentProps } from "../../types";

export function PhotoFrame({ dashboardWidget }: WidgetComponentProps) {
  const config = dashboardWidget.config || {};
  const photos = Array.isArray(config.photos)
    ? config.photos.filter((p: unknown) => typeof p === "string" && p.trim())
    : [];
  const intervalSeconds =
    typeof config.intervalSeconds === "number" && config.intervalSeconds > 0
      ? config.intervalSeconds
      : 6;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [photos.length, intervalSeconds]);

  const activeSrc = useMemo(() => {
    if (photos.length === 0) return null;
    return photos[index % photos.length];
  }, [photos, index]);

  return (
    <div className="relative h-full flex flex-col p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-black/20" />

      <div className="relative z-10 flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white/90 line-clamp-1">
          {dashboardWidget.name || "Cadre photo"}
        </p>
        {photos.length > 1 && (
          <p className="text-xs text-white/60">
            {index + 1}/{photos.length}
          </p>
        )}
      </div>

      <div className="relative z-10 flex-1 min-h-0 rounded-xl border border-white/10 overflow-hidden bg-black/25">
        {activeSrc ? (
          <img
            key={activeSrc}
            src={activeSrc}
            alt="Photo"
            className="w-full h-full object-cover animate-[photofade_700ms_ease]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-center px-4">
            <p className="text-sm text-white/65">
              Aucune photo. Ajoute des images dans la config du widget.
            </p>
          </div>
        )}
      </div>

      {photos.length > 1 && (
        <div className="relative z-10 mt-3 flex items-center justify-center gap-1.5">
          {photos.map((_: string, i: number) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === index ? "bg-white/90 w-4" : "bg-white/35"
              }`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes photofade {
          from { opacity: 0.55; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
