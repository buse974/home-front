import { useEffect, useRef, useState } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const prime = h / 60;
  const x = chroma * (1 - Math.abs((prime % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (prime >= 0 && prime < 1) {
    red = chroma;
    green = x;
  } else if (prime >= 1 && prime < 2) {
    red = x;
    green = chroma;
  } else if (prime >= 2 && prime < 3) {
    green = chroma;
    blue = x;
  } else if (prime >= 3 && prime < 4) {
    green = x;
    blue = chroma;
  } else if (prime >= 4 && prime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  const match = lightness - chroma / 2;
  const toHex = (value: number) =>
    Math.round((value + match) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function ColorSlider({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((device) => device.name).join(", ");
  const hasColorCapability = devices.some(
    (device) => device.capabilities?.color,
  );

  const [hue, setHue] = useState(145);
  const [isSending, setIsSending] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const { anyOn: isOn, refresh } = useWidgetRealtimeState(
    dashboardWidget.id,
    devices.length > 0,
  );

  const applyHue = async (nextHue: number) => {
    setIsSending(true);
    try {
      const hex = hslToHex(nextHue, 90, 56);
      await api.executeWidgetCommand(dashboardWidget.id, "color", {
        value: hex,
        hex,
        color: hex,
        hue: nextHue,
      });
      await refresh();
    } catch (error) {
      console.error("Failed to set color:", error);
    } finally {
      setIsSending(false);
    }
  };

  const scheduleApply = (nextHue: number) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void applyHue(nextHue);
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

  const previewColor = hslToHex(hue, 90, 58);

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div
        className="absolute -inset-10 pointer-events-none blur-3xl opacity-40"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${previewColor}, transparent 65%)`,
        }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
            {displayName}
          </h3>
          <p className="text-xs text-white/45">Neon color slider</p>
          {!hasColorCapability && (
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
          <span>Color</span>
          <span
            style={{ color: previewColor }}
            className="font-semibold normal-case tracking-normal"
          >
            {isSending ? "..." : previewColor}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={hue}
          onChange={(event) => {
            const nextHue = Number(event.target.value);
            setHue(nextHue);
            scheduleApply(nextHue);
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background:
              "linear-gradient(90deg, #ff3f3f 0%, #ffd93f 17%, #52ff3f 33%, #3fffd6 50%, #3f7bff 67%, #b13fff 83%, #ff3f8f 100%)",
          }}
        />
      </div>
    </div>
  );
}
