import type { WidgetComponentProps } from "../../types";

export function TextTicker({ dashboardWidget }: WidgetComponentProps) {
  const config = dashboardWidget.config || {};
  const message =
    typeof config.message === "string" && config.message.trim()
      ? config.message.trim()
      : "Votre message ici";
  const speed =
    typeof config.speed === "number" && config.speed > 0
      ? config.speed
      : 16;
  const shouldScroll = message.length > 34;

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
        {dashboardWidget.name || "Message"}
      </h3>
      <p className="text-xs text-white/40 mb-4">Widget graphique texte</p>

      <div className="flex-1 min-h-0 rounded-xl bg-black/30 border border-white/10 overflow-hidden px-4 flex items-center">
        {shouldScroll ? (
          <div
            className="ticker-track flex items-center gap-12 whitespace-nowrap text-white text-3xl font-bold"
            style={{ animationDuration: `${speed}s` }}
          >
            <span>{message}</span>
            <span>{message}</span>
          </div>
        ) : (
          <p className="text-white text-3xl font-bold w-full text-center">
            {message}
          </p>
        )}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 1.5rem)); }
        }
        .ticker-track {
          min-width: max-content;
          animation-name: ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
