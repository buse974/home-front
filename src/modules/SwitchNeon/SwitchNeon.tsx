import { useState, useEffect, type KeyboardEvent } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

/**
 * Widget SwitchNeon - Design futuriste avec effet néon
 * Animations fluides et style cyberpunk
 */
export function SwitchNeon({ dashboardWidget }: WidgetComponentProps) {
  const [loading, setLoading] = useState(false);

  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((d) => d.name).join(", ");
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
      <div className="p-6 bg-black/80 backdrop-blur-xl rounded-3xl border border-red-500/30">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  const circleSize = "clamp(170px, 42%, 240px)";

  return (
    <div
      role="button"
      tabIndex={isActionDisabled ? -1 : 0}
      aria-disabled={isActionDisabled}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`relative h-full flex flex-col p-6 bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden group transition-all duration-300 ${
        isActionDisabled
          ? "opacity-80 cursor-not-allowed"
          : "cursor-pointer hover:border-cyan-400/40"
      }`}
    >
      {/* Animated background glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isOn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Scan line effect */}
      {isOn && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-full animate-scan"></div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
            {displayName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">
              {devices[0].type}
            </span>
            {devices.length > 1 && (
              <>
                <span className="text-xs text-white/20">•</span>
                <span className="text-xs text-cyan-400 font-bold">
                  {devices.length}x
                </span>
              </>
            )}
          </div>
        </div>

        {/* Neon Switch Circle */}
        <div className="flex-1 min-h-0 grid place-items-center">
          <div
            style={{ width: circleSize, height: circleSize }}
            className={`
              relative grid place-items-center rounded-full transition-all duration-500
              ${isActionDisabled ? "opacity-30" : ""}
              ${!loading && !isActionDisabled ? "hover:scale-105 active:scale-95" : ""}
              ${
                isOn
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_60px_rgba(6,182,212,0.55)]"
                  : "bg-gradient-to-br from-gray-700 to-gray-900 shadow-[0_0_22px_rgba(255,255,255,0.12)]"
              }
            `}
          >
            <div
              className={`
                w-[78%] h-[78%] rounded-full grid place-items-center border
                ${isOn ? "border-cyan-200/70 bg-cyan-500/20" : "border-white/20 bg-black/35"}
              `}
            >
              {loading ? (
                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isOn ? (
                <svg
                  className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-16 h-16 text-white/45"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            {isOn && !loading && (
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-300 animate-spin-slow opacity-70"></div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
