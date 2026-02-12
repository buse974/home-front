import type { WidgetComponentProps } from "../../types";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

export function RawState({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((d) => d.name).join(", ");

  const { deviceStates, error } = useWidgetRealtimeState(
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

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
        {displayName}
      </h3>
      <p className="text-xs text-white/40 mb-4">
        Raw provider state ({deviceStates.length} device
        {deviceStates.length > 1 ? "s" : ""})
      </p>

      <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-black/40 border border-white/10 p-3">
        <pre className="text-xs text-cyan-200 whitespace-pre-wrap break-words">
          {JSON.stringify(deviceStates, null, 2)}
        </pre>
      </div>

      {error && (
        <p className="mt-3 text-xs text-amber-300/80">
          Live update warning: {error}
        </p>
      )}
    </div>
  );
}
