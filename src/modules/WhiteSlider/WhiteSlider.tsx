import { useEffect, useRef, useState } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

export function WhiteSlider({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((device) => device.name).join(", ");
  const hasTemperatureCapability = devices.some(
    (device) => device.capabilities?.temperature,
  );

  const [whiteTone, setWhiteTone] = useState(50);
  const [isSending, setIsSending] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const { anyOn: isOn, refresh } = useWidgetRealtimeState(
    dashboardWidget.id,
    devices.length > 0,
  );

  const applyWhiteTone = async (nextTone: number) => {
    setIsSending(true);
    try {
      const kelvin = Math.round(2200 + (nextTone / 100) * (6500 - 2200));
      await api.executeWidgetCommand(dashboardWidget.id, "temperature", {
        value: nextTone,
        kelvin,
      });
      await refresh();
    } catch (error) {
      console.error("Failed to set white tone:", error);
    } finally {
      setIsSending(false);
    }
  };

  const scheduleApply = (nextTone: number) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void applyWhiteTone(nextTone);
    }, 180);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  if (devices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  const toneLabel =
    whiteTone < 35 ? "Warm white" : whiteTone > 65 ? "Cool white" : "Neutral";

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-35 bg-[radial-gradient(circle_at_25%_20%,rgba(255,209,150,0.45),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(191,225,255,0.35),transparent_45%)]" />

      <div className="relative flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
            {displayName}
          </h3>
          <p className="text-xs text-white/45">Warm to cool white</p>
          {!hasTemperatureCapability && (
            <p className="text-[11px] text-amber-200/75 mt-1">
              Capability not detected, trying anyway
            </p>
          )}
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isOn
              ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
              : "bg-white/20"
          }`}
        />
      </div>

      <div className="relative mt-auto">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/65 mb-2">
          <span>White tone</span>
          <span className="font-semibold normal-case tracking-normal text-white/90">
            {isSending ? "..." : toneLabel}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={whiteTone}
          onChange={(event) => {
            const nextTone = Number(event.target.value);
            setWhiteTone(nextTone);
            scheduleApply(nextTone);
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background:
              "linear-gradient(90deg, #ffb366 0%, #ffdca8 45%, #f6f6f6 55%, #d6ecff 100%)",
          }}
        />

        <div className="mt-1 flex items-center justify-between text-[10px] text-white/50 uppercase tracking-[0.18em]">
          <span>Warm</span>
          <span>Cool</span>
        </div>
      </div>
    </div>
  );
}
