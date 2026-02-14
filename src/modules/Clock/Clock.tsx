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
    const available = Math.min(bounds.width - 24, bounds.height - 90);
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
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl" />

      <div className="relative z-10 flex-1 min-h-0 grid place-items-center">
        {mode === "analog" ? (
          <div
            className="relative rounded-full border border-white/20 bg-gradient-to-br from-white/12 to-white/4 shadow-[0_16px_50px_rgba(6,12,30,0.45)]"
            style={{ width: analogSize, height: analogSize }}
          >
            <div className="absolute inset-[8%] rounded-full border border-white/10 bg-black/20" />

            <div
              className="absolute left-1/2 top-1/2 w-[2.6%] h-[27%] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-white/85"
              style={{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)` }}
            />
            <div
              className="absolute left-1/2 top-1/2 w-[1.6%] h-[36%] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-cyan-200"
              style={{
                transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 w-[1%] h-[41%] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-rose-300"
              style={{
                transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
              }}
            />

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[7%] h-[7%] rounded-full bg-white border-2 border-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.65)]" />
          </div>
        ) : (
          <div className="w-full max-w-[92%] rounded-2xl border border-white/20 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 p-5 text-center shadow-[0_14px_40px_rgba(6,12,30,0.45)]">
            <p
              className="font-black text-cyan-100 leading-none tracking-tight"
              style={{ fontSize: `${digitalSize}px` }}
            >
              {time}
            </p>
          </div>
        )}
      </div>

      <div className="relative z-10 text-center mt-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          {dashboardWidget.name || "Horloge"}
        </p>
        <p className="mt-1 text-xs text-white/65">{date}</p>
      </div>
    </div>
  );
}
