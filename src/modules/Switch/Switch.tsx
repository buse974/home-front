import { useState, useEffect, type KeyboardEvent } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

/**
 * Widget Switch Premium - Design moderne avec animations
 * Supporte plusieurs devices (tous contrôlés ensemble)
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
  const widgetWidth = dashboardWidget.position?.w ?? 2;
  const widgetHeight = dashboardWidget.position?.h ?? 2;
  const isCompact = widgetHeight <= 1 || widgetWidth <= 1;

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
    <div className="group relative h-full flex flex-col">
      {/* Glow effect when ON */}
      {isOn && (
        <div className="absolute -inset-2 bg-[radial-gradient(circle_at_50%_45%,rgba(34,197,94,0.55),rgba(34,197,94,0.18)_45%,rgba(16,185,129,0.10)_70%,transparent_100%)] rounded-3xl blur-xl transition-opacity duration-500 pointer-events-none"></div>
      )}

      <div
        role="button"
        tabIndex={isActionDisabled ? -1 : 0}
        aria-disabled={isActionDisabled}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className={`relative h-full flex flex-col p-6 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
          isOn
            ? "bg-gradient-to-br from-emerald-400/22 via-emerald-500/14 to-cyan-500/18 border-emerald-300/45 shadow-[0_0_38px_rgba(34,197,94,0.38),inset_0_0_40px_rgba(16,185,129,0.14)]"
            : "bg-white/5 border-white/10"
        } ${
          isActionDisabled
            ? "opacity-80 cursor-not-allowed"
            : `cursor-pointer hover:scale-[1.02] ${
                isOn ? "hover:border-emerald-200/65" : "hover:border-white/20"
              }`
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between ${isCompact ? "mb-2" : "mb-6"}`}
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
              {displayName}
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-xs text-white/60 font-medium">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {devices[0].type}
              </span>
              {devices.length > 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 rounded-lg text-xs text-purple-300 font-medium">
                  {devices.length} devices
                </span>
              )}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {isCompact && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide ${
                  isOn
                    ? "bg-emerald-400/30 text-emerald-50 border border-emerald-200/40 shadow-[0_0_18px_rgba(34,197,94,0.45)]"
                    : "bg-white/10 text-white/75 border border-white/20"
                }`}
              >
                {loading ? "..." : isOn ? "ON" : "OFF"}
              </span>
            )}
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isOn
                  ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"
                  : "bg-white/20"
              }`}
            ></div>
          </div>
        </div>

        {!isCompact && (
          /* Toggle Button */
          <div
            className={`
              relative w-full flex-1 min-h-0 transition-all duration-300 flex items-center justify-center
              ${isActionDisabled ? "opacity-30" : ""}
              ${!loading && !isActionDisabled ? "hover:scale-[1.02] active:scale-[0.98]" : ""}
            `}
          >
            <div
              className={`
                relative w-full max-w-[330px] h-20 rounded-2xl border overflow-hidden
                transition-all duration-300
                ${
                  isOn
                    ? "bg-gradient-to-r from-fuchsia-500/80 via-violet-500/75 to-cyan-500/80 border-cyan-200/40 shadow-[0_0_35px_rgba(56,189,248,0.55),0_0_70px_rgba(217,70,239,0.35)]"
                    : "bg-white/8 border-white/15 shadow-[inset_0_0_18px_rgba(255,255,255,0.06)]"
                }
              `}
            >
              {isOn && (
                <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/25 via-cyan-400/25 to-blue-500/25 blur-2xl pointer-events-none" />
              )}
              {isOn && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}

              <div className="relative h-full px-4 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                    isOn
                      ? "bg-white/20 border-white/35 text-white"
                      : "bg-black/25 border-white/20 text-white/70"
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  ) : isOn ? (
                    <svg
                      className="w-7 h-7 animate-in zoom-in duration-300"
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
                      className="w-7 h-7 animate-in zoom-in duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                    Power
                  </p>
                  <p
                    className={`text-2xl font-black leading-none mt-1 ${
                      isOn ? "text-white" : "text-white/75"
                    }`}
                  >
                    {loading ? "Switching..." : isOn ? "ON" : "OFF"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capability warning */}
        {!hasToggleCapability && (
          <p className="mt-3 text-xs text-red-400/80 flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
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
            Toggle not available
          </p>
        )}
      </div>
    </div>
  );
}
