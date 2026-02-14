import { useEffect, useState } from "react";
import type { WidgetComponentProps } from "../../types";

export function Clock({ dashboardWidget }: WidgetComponentProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
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

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl" />

      <div className="relative z-10 flex-1 min-h-0 grid place-items-center">
        <div className="relative w-[210px] h-[210px] rounded-full border border-white/20 bg-gradient-to-br from-white/12 to-white/4 shadow-[0_16px_50px_rgba(6,12,30,0.45)]">
          <div className="absolute inset-[10px] rounded-full border border-white/10 bg-black/20" />

          <div
            className="absolute left-1/2 top-1/2 w-1 h-[56px] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-white/85"
            style={{
              transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 w-0.5 h-[76px] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-cyan-200"
            style={{
              transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 w-0.5 h-[84px] -translate-x-1/2 -translate-y-full origin-bottom rounded-full bg-rose-300"
            style={{
              transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
            }}
          />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.65)]" />
        </div>
      </div>

      <div className="relative z-10 text-center mt-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          {dashboardWidget.name || "Horloge"}
        </p>
        <p className="mt-1 text-xl font-bold text-cyan-100">{time}</p>
        <p className="mt-1 text-xs text-white/65">{date}</p>
      </div>
    </div>
  );
}
