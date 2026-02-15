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
        @keyframes sensor-ripple {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes sensor-ripple-delay {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes sensor-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <div className="relative h-full flex flex-col p-5 bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-500">
        {/* Glass background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-slate-900/20 to-slate-950/45 pointer-events-none" />

        {/* Glow orbs */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Active state ambient glow */}
        {isOn && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-teal-500/8 pointer-events-none transition-opacity duration-700" />
        )}

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-white line-clamp-2 ${isCompact ? "text-base mb-0.5" : "text-lg mb-1"}`}
            >
              {displayName}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 capitalize">
                {devices[0].type}
              </span>
              {devices.length > 1 && !isCompact && (
                <>
                  <span className="text-xs text-white/20">&#x2022;</span>
                  <span className="text-xs text-cyan-300/70 font-medium">
                    {devices.length} devices
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-500 ${
              isOn
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/30"
                : "bg-red-500/15 text-red-300/70 border border-red-400/20"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                isOn
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-red-400/60"
              }`}
            />
            {isOn ? "ON" : "OFF"}
          </div>
        </div>

        {/* Center indicator */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative grid place-items-center">
            {/* Ripple rings - only when ON */}
            {isOn && !isCompact && (
              <>
                <div
                  className="absolute w-20 h-20 rounded-full border border-emerald-400/30"
                  style={{ animation: "sensor-ripple 2.5s ease-out infinite" }}
                />
                <div
                  className="absolute w-20 h-20 rounded-full border border-emerald-400/20"
                  style={{
                    animation:
                      "sensor-ripple-delay 2.5s ease-out infinite 0.8s",
                  }}
                />
              </>
            )}

            {/* Outer ring */}
            <div
              className={`relative rounded-full transition-all duration-700 grid place-items-center ${
                isCompact ? "w-16 h-16" : "w-24 h-24"
              } ${
                isOn
                  ? "bg-gradient-to-br from-emerald-400/15 via-emerald-500/10 to-teal-500/15 border border-emerald-400/30 shadow-[0_0_40px_rgba(52,211,153,0.2)]"
                  : "bg-gradient-to-br from-white/5 via-white/3 to-black/10 border border-white/10"
              }`}
            >
              {/* Inner ring */}
              <div
                className={`rounded-full transition-all duration-700 grid place-items-center ${
                  isCompact ? "w-11 h-11" : "w-16 h-16"
                } ${
                  isOn
                    ? "bg-emerald-950/50 border border-emerald-400/25"
                    : "bg-slate-950/50 border border-white/8"
                }`}
              >
                {/* Icon */}
                {isOn ? (
                  <svg
                    className={`${isCompact ? "w-5 h-5" : "w-7 h-7"} text-emerald-400 transition-all duration-500`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(52,211,153,0.5))",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className={`${isCompact ? "w-5 h-5" : "w-7 h-7"} text-white/25 transition-all duration-500`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* State label below indicator - large mode only */}
            {!isCompact && (
              <div className="mt-4 text-center">
                <div
                  className={`text-2xl font-black tracking-tight transition-all duration-500 ${
                    isOn
                      ? "text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-teal-300"
                      : "text-white/30"
                  }`}
                >
                  {isOn ? "ACTIVE" : "INACTIVE"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact mode watermark */}
        {isCompact && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`text-[72px] font-black transition-all duration-500 ${
                isOn ? "text-emerald-400/8" : "text-white/3"
              }`}
              style={{
                animation: isOn ? "sensor-pulse 3s ease-in-out infinite" : "none",
              }}
            >
              {isOn ? "ON" : "OFF"}
            </div>
          </div>
        )}

        {/* Footer */}
        {!isCompact && (
          <div className="relative z-10 mt-auto pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">State sensor</span>
              <span
                className={`transition-all duration-500 ${
                  isOn ? "text-emerald-400/60" : "text-red-400/40"
                }`}
              >
                {isOn ? "Signal active" : "No signal"}
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
