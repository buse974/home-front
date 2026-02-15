import { useEffect, useState, type KeyboardEvent } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

/**
 * Widget Switch - Design minimaliste avec effet glass
 * Bouton centré, responsive, élégant comme le widget Clock
 */
export function Switch({ dashboardWidget }: WidgetComponentProps) {
  const [loading, setLoading] = useState(false);

  const devices = dashboardWidget.GenericDevices || [];

  // Nom d'affichage : custom ou concaténation
  const displayName =
    dashboardWidget.name || devices.map((d) => d.name).join(", ");

  // Vérifier si au moins un device a la capability toggle
  const hasToggleCapability = devices.some((d) => d.capabilities?.toggle);

  // Log capability error with full device details
  useEffect(() => {
    if (devices.length > 0 && !hasToggleCapability) {
      console.error("❌ Widget capability error:", {
        widgetId: dashboardWidget.id,
        widgetName: displayName,
        widgetComponent: dashboardWidget.Widget?.component,
        reason: "No device has toggle capability",
        devices: devices.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          capabilities: d.capabilities || null,
        })),
      });
    }
  }, [
    devices,
    hasToggleCapability,
    dashboardWidget.id,
    displayName,
    dashboardWidget.Widget?.component,
  ]);

  const { anyOn: isOn, refresh } = useWidgetRealtimeState(
    dashboardWidget.id,
    devices.length > 0,
  );

  const handleToggle = async () => {
    if (!hasToggleCapability) {
      console.error("Toggle capability not available");
      return;
    }

    setLoading(true);
    try {
      await api.executeWidgetCommand(dashboardWidget.id, "toggle", {
        desiredState: !isOn,
      });
      await refresh();
    } catch (error) {
      console.error("Failed to toggle:", error);
    } finally {
      setLoading(false);
    }
  };

  const isActionDisabled = loading || !hasToggleCapability;

  // Detect widget size for responsive layout
  const widgetWidth = dashboardWidget.position?.w ?? 2;
  const widgetHeight = dashboardWidget.position?.h ?? 2;
  const isCompact = widgetHeight <= 1 || widgetWidth <= 2;

  const handleCardClick = () => {
    if (isActionDisabled) return;
    handleToggle();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  if (devices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={isActionDisabled ? -1 : 0}
      aria-disabled={isActionDisabled}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ${
        isActionDisabled
          ? "opacity-80 cursor-not-allowed"
          : "cursor-pointer hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]"
      }`}
    >
      {/* Glass effect background layers (inspired by Clock) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-slate-900/20 to-slate-950/45 pointer-events-none" />

      {/* Subtle glow orbs */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Active glow effect */}
      {isOn && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div
          className={`flex items-start justify-between ${isCompact ? "mb-0" : "mb-4"}`}
        >
          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-white line-clamp-2 ${isCompact ? "text-base mb-1" : "text-lg mb-1.5"}`}
            >
              {displayName}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/40 capitalize">
                {devices[0].type}
              </span>
              {devices.length > 1 && !isCompact && (
                <>
                  <span className="text-xs text-white/20">•</span>
                  <span className="text-xs text-cyan-300/70 font-medium">
                    {devices.length} devices
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status indicator - always visible */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
              isOn
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/30"
                : "bg-white/5 text-white/40 border border-white/10"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isOn
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-white/30"
              }`}
            />
            {loading ? "..." : isOn ? "ON" : "OFF"}
          </div>
        </div>

        {/* Compact mode: small centered icon */}
        {isCompact && (
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`
                w-12 h-12 rounded-full
                flex items-center justify-center
                transition-all duration-500
                ${
                  isOn
                    ? "bg-emerald-500/15 border border-emerald-400/25"
                    : "bg-white/5 border border-white/10"
                }
              `}
            >
              {loading ? (
                <div
                  className={`w-5 h-5 border-2 rounded-full animate-spin ${
                    isOn
                      ? "border-emerald-400/30 border-t-emerald-400"
                      : "border-white/20 border-t-white/60"
                  }`}
                />
              ) : isOn ? (
                <svg
                  className="w-6 h-6 text-emerald-400/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white/25"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Centered switch button - only in large mode */}
        {!isCompact && (
          <div className="flex-1 flex items-center justify-center py-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              disabled={isActionDisabled}
              className={`
              group relative
              w-full max-w-[280px] aspect-square
              rounded-full
              transition-all duration-500
              ${isActionDisabled ? "opacity-40 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
              ${
                isOn
                  ? "bg-gradient-to-br from-emerald-400/20 via-emerald-500/15 to-teal-500/20"
                  : "bg-gradient-to-br from-white/8 via-white/3 to-black/20"
              }
              border
              ${isOn ? "border-emerald-400/40" : "border-white/15"}
              shadow-[0_20px_60px_rgba(0,0,0,0.4)]
            `}
            >
              {/* Inner glass layers */}
              <div
                className={`
              absolute inset-[4%] rounded-full border transition-all duration-500
              ${isOn ? "border-emerald-400/30 bg-emerald-950/40" : "border-white/10 bg-slate-950/60"}
            `}
              />

              <div
                className={`
              absolute inset-[10%] rounded-full border transition-all duration-500
              ${isOn ? "border-emerald-400/20" : "border-white/8"}
            `}
              />

              <div
                className={`
              absolute inset-[16%] rounded-full transition-all duration-500
              ${
                isOn
                  ? "bg-gradient-to-b from-emerald-400/10 to-transparent border border-emerald-300/30 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                  : "bg-gradient-to-b from-white/5 to-transparent border border-white/10"
              }
            `}
              />

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {loading ? (
                  <div
                    className={`w-12 h-12 border-3 rounded-full animate-spin ${
                      isOn
                        ? "border-emerald-400/30 border-t-emerald-400"
                        : "border-white/20 border-t-white/60"
                    }`}
                  />
                ) : (
                  <>
                    {/* Icon */}
                    <div
                      className={`
                      mb-3 w-16 h-16 rounded-full flex items-center justify-center
                      transition-all duration-500
                      ${
                        isOn
                          ? "bg-emerald-500/25 text-emerald-300"
                          : "bg-white/5 text-white/40"
                      }
                    `}
                    >
                      {isOn ? (
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">
                        Power
                      </div>
                      <div
                        className={`text-3xl font-black tracking-tight transition-all duration-500 ${
                          isOn
                            ? "text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-teal-300"
                            : "text-white/60"
                        }`}
                      >
                        {isOn ? "ON" : "OFF"}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Shimmer effect when active */}
              {isOn && !loading && (
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              )}
            </button>
          </div>
        )}

        {/* Footer info */}
        {!isCompact && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">
                {isActionDisabled ? "Unavailable" : "Tap to toggle"}
              </span>
              {hasToggleCapability ? (
                <span className="text-emerald-400/60">Ready</span>
              ) : (
                <span className="text-red-400/60 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Error
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
