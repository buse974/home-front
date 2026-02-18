import { useState, useEffect, type KeyboardEvent } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

/**
 * Widget SwitchToggle - Design moderne avec cercle progressif
 * Inspiré des interfaces Smart House haut de gamme
 */
export function SwitchToggle({ dashboardWidget }: WidgetComponentProps) {
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

  // Calcul du pourcentage pour le cercle (100% = ON, 0% = OFF avec transition)
  const circlePercentage = isOn ? 100 : 0;
  const circumference = 2 * Math.PI * 58; // rayon = 58
  const strokeDashoffset =
    circumference - (circlePercentage / 100) * circumference;

  return (
    <div
      role="button"
      tabIndex={isActionDisabled ? -1 : 0}
      aria-disabled={isActionDisabled}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 transition-all duration-300 group overflow-hidden ${
        isActionDisabled
          ? "opacity-80 cursor-not-allowed"
          : "cursor-pointer hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
      }`}
    >
      {/* Background glow effect */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isOn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-pink-500/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full"></div>
      </div>

      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
              {displayName}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 capitalize">
                {devices[0].type}
              </span>
              {devices.length > 1 && (
                <>
                  <span className="text-xs text-white/20">•</span>
                  <span className="text-xs text-cyan-300 font-medium">
                    {devices.length} devices
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex flex-col items-end gap-1">
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                isOn
                  ? "bg-pink-500/20 text-pink-300 shadow-sm shadow-pink-500/20"
                  : "bg-white/5 text-white/40"
              }`}
            >
              {isOn ? "ON" : "OFF"}
            </div>
          </div>
        </div>

        {/* Circular progress indicator - Main Feature */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative w-40 h-40">
            {/* Background circle with dots */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background dotted circle */}
              <circle
                cx="80"
                cy="80"
                r="58"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
                strokeDasharray="4 8"
              />

              {/* Animated progress circle */}
              <circle
                cx="80"
                cy="80"
                r="58"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: isOn
                    ? "drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))"
                    : "none",
                }}
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <div className="w-12 h-12 border-3 border-white/20 border-t-pink-500 rounded-full animate-spin"></div>
              ) : (
                <>
                  <div
                    className={`text-5xl font-black transition-all duration-300 ${
                      isOn
                        ? "text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-purple-400"
                        : "text-white/30"
                    }`}
                  >
                    {circlePercentage}
                  </div>
                  <div
                    className={`text-xs font-semibold mt-1 transition-colors ${
                      isOn ? "text-white/60" : "text-white/30"
                    }`}
                  >
                    POWER
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Switch - Modern Style */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-sm text-white/50 mb-1">Power Control</span>
            <span
              className={`text-base font-bold transition-colors ${
                isOn ? "text-pink-400" : "text-white/30"
              }`}
            >
              {isOn ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Enhanced toggle button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            disabled={isActionDisabled}
            className={`
              relative w-16 h-8 rounded-full transition-all duration-300 flex-shrink-0
              ${isActionDisabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
              ${
                isOn
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/40"
                  : "bg-white/10"
              }
            `}
          >
            {/* Toggle circle */}
            <div
              className={`
                absolute top-0.5 w-7 h-7 rounded-full shadow-lg transition-all duration-300
                flex items-center justify-center
                ${isOn ? "right-0.5 bg-white" : "left-0.5 bg-white/70"}
              `}
            >
              {isOn ? (
                <svg
                  className="w-4 h-4 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              )}
            </div>
          </button>
        </div>

        {/* Error state */}
        {!hasToggleCapability && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs text-red-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Toggle capability unavailable</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
