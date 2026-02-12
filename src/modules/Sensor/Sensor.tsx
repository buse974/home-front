import type { WidgetComponentProps } from "../../types";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

export function Sensor({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((d) => d.name).join(", ");

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
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
            {displayName}
          </h3>
          <p className="text-xs text-white/40">
            {devices[0].type}
            {devices.length > 1 ? ` • ${devices.length} devices` : ""}
          </p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            isOn
              ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
              : "bg-white/20"
          }`}
        />
      </div>

      <div className="flex-1 grid place-items-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-white/40 mb-1">
            State
          </p>
          <p
            className={`text-4xl font-bold ${
              isOn ? "text-emerald-400" : "text-white/50"
            }`}
          >
            {isOn ? "ON" : "OFF"}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-amber-300/80">
          Live update warning: {error}
        </p>
      )}
    </div>
  );
}
