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
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [photos.length]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = window.setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % photos.length);
        setFading(false);
      }, 500);
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [photos.length, intervalSeconds]);

  const activeSrc = useMemo(() => {
    if (photos.length === 0) return null;
    return photos[index % photos.length];
  }, [photos, index]);

  const hasPhotos = photos.length > 0;

  return (
    <>
      <style>{`
        @keyframes frame-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes frame-breathe {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
      `}</style>

      <div className="relative h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-500 bg-black/40 backdrop-blur-xl">
        {/* Full-bleed image background with blur for ambiance */}
        {activeSrc && (
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              backgroundImage: `url(${activeSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) saturate(1.4) brightness(0.3)",
              opacity: 0.6,
              transform: "scale(1.3)",
            }}
          />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60 pointer-events-none" />

        {/* Glass layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none" />

        {/* Shimmer on the edges */}
        {hasPhotos && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
              style={{ animation: "frame-shimmer 6s ease-in-out infinite" }}
            />
          </div>
        )}

        {/* Header bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-sm font-semibold text-white/90 line-clamp-1">
            {dashboardWidget.name || "Cadre photo"}
          </p>
          {photos.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40 tabular-nums">
                {index + 1} / {photos.length}
              </span>
            </div>
          )}
        </div>

        {/* Main image area */}
        <div className="relative z-10 flex-1 min-h-0 mx-4 mb-3 rounded-xl overflow-hidden">
          {activeSrc ? (
            <div className="relative w-full h-full">
              <img
                key={activeSrc}
                src={activeSrc}
                alt="Photo"
                className="w-full h-full object-cover transition-all duration-500"
                style={{
                  opacity: fading ? 0 : 1,
                  transform: fading ? "scale(1.03)" : "scale(1)",
                }}
                loading="lazy"
              />

              {/* Vignette overlay on image */}
              <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] pointer-events-none rounded-xl" />
            </div>
          ) : (
            <div className="w-full h-full bg-white/5 grid place-items-center text-center px-6 rounded-xl border border-white/5">
              <div>
                <svg
                  className="w-10 h-10 text-white/15 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                  />
                </svg>
                <p className="text-sm text-white/40">
                  Aucune photo configuree
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom dots navigation */}
        {photos.length > 1 && (
          <div className="relative z-10 pb-4 flex items-center justify-center gap-1.5">
            {photos.map((_: string, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setFading(true);
                  setTimeout(() => {
                    setIndex(i);
                    setFading(false);
                  }, 300);
                }}
                className={`h-1.5 rounded-full transition-all duration-400 ${
                  i === index
                    ? "bg-white/90 w-5 shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                    : "bg-white/25 w-1.5 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
