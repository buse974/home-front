import { useEffect, useMemo, useRef, useState } from "react";
import type { WidgetComponentProps } from "../../types";

type ClockMode = "analog" | "digital";

export function Clock({ dashboardWidget }: WidgetComponentProps) {
  const [now, setNow] = useState(() => new Date());
  const [bounds, setBounds] = useState({ width: 240, height: 240 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mode: ClockMode =
    dashboardWidget.config?.clockMode === "digital" ? "digital" : "analog";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateBounds = () => {
      setBounds({
        width: node.clientWidth || 240,
        height: node.clientHeight || 240,
      });
    };

    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  const analogSize = useMemo(() => {
    const available = Math.min(bounds.width - 24, bounds.height - 92);
    return Math.max(120, Math.min(available, 320));
  }, [bounds.height, bounds.width]);

  const digitalSize = useMemo(() => {
    const available = Math.min(bounds.width * 0.21, bounds.height * 0.23);
    return Math.max(28, Math.min(available, 72));
  }, [bounds.height, bounds.width]);

  return (
    <div
      ref={containerRef}
      className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-slate-900/20 to-slate-950/45" />
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex-1 min-h-0 grid place-items-center">
        {mode === "analog" ? (
          <div
            className="relative rounded-full border border-white/20 bg-gradient-to-br from-white/12 via-white/3 to-black/50 shadow-[0_20px_55px_rgba(0,0,0,0.55)] clock-float"
            style={{ width: analogSize, height: analogSize }}
          >
            <div className="absolute inset-[3.5%] rounded-full border border-white/20 bg-slate-950/75" />
            <div className="absolute inset-[8.5%] rounded-full border border-white/10" />
            <div className="absolute inset-[14%] rounded-full border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent" />
            <div className="absolute inset-[18%] rounded-full border border-cyan-300/35 shadow-[0_0_16px_rgba(103,232,249,0.22)]" />
            <div className="absolute inset-[24%] rounded-full border border-violet-300/20" />

            <div
              className="absolute left-1/2 top-1/2 w-[2.5%] h-[26%] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-white"
              style={{
                transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 w-[1.4%] h-[36%] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-cyan-200"
              style={{
                transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 w-[0.9%] h-[41%] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-amber-300"
              style={{
                transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
              }}
            />

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[8%] h-[8%] rounded-full bg-slate-100 border-2 border-white/70" />
          </div>
        ) : (
          <div className="w-full max-w-[92%] rounded-3xl bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 p-6 text-center shadow-[0_16px_50px_rgba(0,0,0,0.55)]">
            <p
              className="font-black text-white leading-none tracking-[0.06em]"
              style={{ fontSize: `${digitalSize}px` }}
            >
              {time}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/45">
              Digital
            </p>
          </div>
        )}
      </div>

      <div className="relative z-10 text-center mt-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/55">
          {dashboardWidget.name || "Horloge"}
        </p>
        <p className="mt-1 text-xs text-white/55">{date}</p>
      </div>

      <style>{`
        .clock-float {
          animation: clock-float 7.2s ease-in-out infinite;
        }
        @keyframes clock-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
