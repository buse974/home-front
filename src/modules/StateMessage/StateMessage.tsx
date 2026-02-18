import type { WidgetComponentProps } from "../../types";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

export function StateMessage({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const config = dashboardWidget.config || {};

  const trueMessage = config.trueMessage || "Allume";
  const falseMessage = config.falseMessage || "Eteint";
  const trueColor = config.trueColor || "green";
  const falseColor = config.falseColor || "red";

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
  const message = isOn ? trueMessage : falseMessage;
  const activeColor = isOn ? trueColor : falseColor;
  const colorClass =
    activeColor === "green"
      ? "text-emerald-400"
      : activeColor === "blue"
        ? "text-blue-400"
        : activeColor === "purple"
          ? "text-purple-400"
          : "text-red-400";

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
        {displayName}
      </h3>
      <p className="text-xs text-white/40 mb-4">
        {devices[0].type}
        {devices.length > 1 ? ` • ${devices.length} devices` : ""}
      </p>

      <div className="flex-1 grid place-items-center text-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40 mb-2">
            Message
          </p>
          <p className={`text-3xl font-bold ${colorClass}`}>{message}</p>
          <p className="text-sm text-white/50 mt-2">
            Etat brut: {isOn ? 1 : 0}
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
