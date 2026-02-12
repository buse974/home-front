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

  const extractValue = (input: unknown): unknown => {
    if (input === null || input === undefined) return null;
    if (typeof input === "object") {
      const data = input as Record<string, unknown>;
      if (data.value !== undefined) return extractValue(data.value);
      if (data.state !== undefined) return extractValue(data.state);
      if (data.isOn !== undefined) return data.isOn ? 1 : 0;
      return null;
    }
    if (typeof input === "boolean") return input ? 1 : 0;
    return input;
  };

  const primaryValue = extractValue(
    deviceStates[0]?.state?.rawValue ??
      deviceStates[0]?.state?.value ??
      deviceStates[0]?.state?.state ??
      deviceStates[0]?.state?.isOn,
  );

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
        {displayName}
      </h3>
      <p className="text-xs text-white/40 mb-4">Raw value</p>

      <div className="flex-1 min-h-0 grid place-items-center rounded-xl bg-black/40 border border-white/10 p-3">
        <p className="text-6xl font-black text-cyan-300">
          {primaryValue === null ? "-" : String(primaryValue)}
        </p>
      </div>

      {error && (
        <p className="mt-3 text-xs text-amber-300/80">
          Live update warning: {error}
        </p>
      )}
    </div>
  );
}
