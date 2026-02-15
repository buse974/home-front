import type { WidgetComponentProps } from "../../types";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

export function Sensor({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((d) => d.name).join(", ");

  const widgetHeight = dashboardWidget.position?.h ?? 2;
  const widgetWidth = dashboardWidget.position?.w ?? 2;
  const isCompact = widgetHeight <= 1 || widgetWidth <= 2;

  const { anyOn, error } = useWidgetRealtimeState(
    dashboardWidget.id,
    devices.length > 0,
  );

  if (devices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  const isOn = anyOn;

  return (
    <>
      <style>{`
        @keyframes sensor-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes sensor-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <div
        className={`relative h-full flex flex-col p-5 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-700 ${
          isOn ? "bg-emerald-950/60" : "bg-white/5"
        }`}
      >
        {/* === ON: rich green atmosphere === */}
        {isOn && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/25 via-emerald-900/15 to-teal-800/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-transparent to-emerald-400/8 pointer-events-none" />
            <div className="absolute -top-20 -left-20 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-teal-500/12 rounded-full blur-3xl pointer-events-none" />
            {/* Scan line */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/8 to-transparent"
                style={{ animation: "sensor-scan 4s ease-in-out infinite" }}
              />
            </div>
          </>
        )}

        {/* === OFF: dark muted === */}
        {!isOn && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-slate-900/25 to-slate-950/50 pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/3 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold line-clamp-2 transition-colors duration-500 ${
                isCompact ? "text-base" : "text-lg"
              } ${isOn ? "text-emerald-50" : "text-white"}`}
            >
              {displayName}
            </h3>
            {!isCompact && (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs capitalize transition-colors duration-500 ${
                    isOn ? "text-emerald-300/50" : "text-white/40"
                  }`}
                >
                  {devices[0].type}
                </span>
                {devices.length > 1 && (
                  <>
                    <span className="text-xs text-white/20">&#x2022;</span>
                    <span
                      className={`text-xs font-medium transition-colors duration-500 ${
                        isOn ? "text-emerald-300/60" : "text-white/30"
                      }`}
                    >
                      {devices.length} devices
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-500 ${
              isOn
                ? "bg-emerald-400/20 text-emerald-200 border border-emerald-300/30"
                : "bg-white/5 text-white/40 border border-white/10"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                isOn
                  ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.7)]"
                  : "bg-white/30"
              }`}
            />
            {isOn ? "ON" : "OFF"}
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-3">
          {/* Signal bars */}
          <div className="flex items-end gap-[5px] h-14">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-[6px] rounded-full transition-all duration-700 ${
                  isOn
                    ? "bg-gradient-to-t from-emerald-400 to-emerald-300"
                    : "bg-white/10"
                }`}
                style={{
                  height: `${28 + i * 12}%`,
                  opacity: isOn ? 1 - i * 0.1 : 0.4 + i * 0.08,
                  animation: isOn
                    ? `sensor-bar ${1.2 + i * 0.15}s ease-in-out infinite ${i * 0.12}s`
                    : "none",
                  filter: isOn
                    ? `drop-shadow(0 0 ${3 + i}px rgba(52,211,153,0.4))`
                    : "none",
                }}
              />
            ))}
          </div>

          {/* State text */}
          {!isCompact && (
            <div
              className={`text-3xl font-black tracking-tight transition-all duration-700 ${
                isOn
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-100 to-teal-200"
                  : "text-white/20"
              }`}
            >
              {isOn ? "ACTIF" : "INACTIF"}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCompact && (
          <div
            className={`relative z-10 mt-auto pt-3 border-t transition-colors duration-500 ${
              isOn ? "border-emerald-400/15" : "border-white/5"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`transition-colors duration-500 ${
                  isOn ? "text-emerald-300/40" : "text-white/30"
                }`}
              >
                Capteur d'etat
              </span>
              <span
                className={`font-medium transition-all duration-500 ${
                  isOn ? "text-emerald-300/70" : "text-white/25"
                }`}
              >
                {isOn ? "Signal actif" : "Aucun signal"}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="relative z-10 mt-2 text-xs text-amber-300/80">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
