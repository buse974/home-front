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

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl" />

      <div className="relative z-10 flex-1 min-h-0 grid place-items-center text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/55 mb-3">
            {dashboardWidget.name || "Horloge"}
          </p>
          <p className="text-5xl md:text-6xl font-black text-cyan-200 leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.35)]">
            {time}
          </p>
          <p className="mt-4 text-sm text-white/70">{date}</p>
        </div>
      </div>
    </div>
  );
}
