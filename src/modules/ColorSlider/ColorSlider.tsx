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
  const hasTemperatureCapability = devices.some(
    (device) => device.capabilities?.temperature,
  );

  const [hue, setHue] = useState(145);
  const [isSending, setIsSending] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const { anyOn: isOn, refresh } = useWidgetRealtimeState(
    dashboardWidget.id,
    devices.length > 0,
  );

  const applyHue = async (nextHue: number) => {
    setIsSending(true);
    try {
      if (hasColorCapability) {
        const hex = hslToHex(nextHue, 90, 56);
        await api.executeWidgetCommand(dashboardWidget.id, "color", {
          value: hex,
          hex,
          color: hex,
          hue: nextHue,
        });
      } else if (hasTemperatureCapability) {
        // Fallback CT-only: map wheel hue to warm/cool white range.
        // 0/360 ~= warm, 180 ~= cool.
        const normalized = Math.abs(((nextHue % 360) - 180) / 180);
        const value = Math.round((1 - normalized) * 100);
        const kelvin = Math.round(2200 + (value / 100) * (6500 - 2200));
        await api.executeWidgetCommand(dashboardWidget.id, "temperature", {
          value,
          kelvin,
          source: "color-wheel-fallback",
        });
      } else {
        throw new Error("No color or temperature capability available");
      }

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

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const wheel = wheelRef.current;
      if (!wheel) return;

      const rect = wheel.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angleDeg =
        (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
        Math.PI;
      const nextHue = (Math.round(angleDeg + 450) + 360) % 360;
      setHue(nextHue);
      scheduleApply(nextHue);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  if (devices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  const previewColor = hslToHex(hue, 90, 58);
  const knobAngle = ((hue - 90) * Math.PI) / 180;
  const knobX = 50 + Math.cos(knobAngle) * 38;
  const knobY = 50 + Math.sin(knobAngle) * 38;

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div
        className="absolute -inset-10 pointer-events-none blur-3xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${previewColor}, transparent 65%)`,
          opacity: isOn ? 0.4 : 0,
        }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
            {displayName}
          </h3>
          <p className="text-xs text-white/45">
            {hasColorCapability ? "Neon color wheel" : "Warm/Cool wheel"}
          </p>
          {!hasColorCapability && hasTemperatureCapability && (
            <p className="text-[11px] text-amber-200/75 mt-1">
              RGB unavailable, using white temperature mode
            </p>
          )}
          {!hasColorCapability && !hasTemperatureCapability && (
            <p className="text-[11px] text-rose-200/80 mt-1">
              No compatible light capability detected
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

        <div className="grid place-items-center pt-1">
          <div
            ref={wheelRef}
            className="relative w-[170px] h-[170px] rounded-full cursor-pointer touch-none select-none transition-all duration-500"
            style={{
              background:
                "conic-gradient(from -90deg, #ff3f3f, #ffd93f, #52ff3f, #3fffd6, #3f7bff, #b13fff, #ff3f8f, #ff3f3f)",
              filter: isOn ? "none" : "grayscale(1) brightness(0.4)",
              opacity: isOn ? 1 : 0.6,
            }}
            onPointerDown={(event) => {
              isDraggingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              const rect = event.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const angleDeg =
                (Math.atan2(event.clientY - centerY, event.clientX - centerX) *
                  180) /
                Math.PI;
              const nextHue = (Math.round(angleDeg + 450) + 360) % 360;
              setHue(nextHue);
              scheduleApply(nextHue);
            }}
          >
            <div className="absolute inset-[18px] rounded-full bg-[#251b4f]/85 border border-white/15 backdrop-blur-sm grid place-items-center">
              <div
                className="w-14 h-14 rounded-full border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                style={{ backgroundColor: previewColor }}
              />
            </div>
            <div
              className="absolute w-6 h-6 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${knobX}%`,
                top: `${knobY}%`,
                backgroundColor: previewColor,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
