import { useEffect, useRef, useState } from "react";
import type { WidgetComponentProps } from "../../types";
import { api } from "../../services/api";
import { useWidgetRealtimeState } from "../hooks/useWidgetRealtimeState";

type LightMode = "color" | "white";

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

export function LightControl({ dashboardWidget }: WidgetComponentProps) {
  const devices = dashboardWidget.GenericDevices || [];
  const displayName =
    dashboardWidget.name || devices.map((device) => device.name).join(", ");

  const hasColorCapability = devices.some((device) => device.capabilities?.color);
  const hasTemperatureCapability = devices.some(
    (device) => device.capabilities?.temperature,
  );
  const hasDimCapability = devices.some((device) => device.capabilities?.dim);

  const [mode, setMode] = useState<LightMode>("color");
  const [hue, setHue] = useState(145);
  const [whiteTone, setWhiteTone] = useState(50);
  const [brightness, setBrightness] = useState(85);
  const [isSending, setIsSending] = useState(false);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const colorTimerRef = useRef<number | null>(null);
  const whiteTimerRef = useRef<number | null>(null);
  const brightnessTimerRef = useRef<number | null>(null);

  const { anyOn: isOn, refresh } = useWidgetRealtimeState(
    dashboardWidget.id,
    devices.length > 0,
  );

  useEffect(() => {
    if (!hasColorCapability && hasTemperatureCapability) {
      setMode("white");
    }
  }, [hasColorCapability, hasTemperatureCapability]);

  useEffect(
    () => () => {
      if (colorTimerRef.current) window.clearTimeout(colorTimerRef.current);
      if (whiteTimerRef.current) window.clearTimeout(whiteTimerRef.current);
      if (brightnessTimerRef.current) window.clearTimeout(brightnessTimerRef.current);
    },
    [],
  );

  const applyColor = async (nextHue: number) => {
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

  const applyBrightness = async (nextBrightness: number) => {
    setIsSending(true);
    try {
      await api.executeWidgetCommand(dashboardWidget.id, "dim", {
        value: nextBrightness,
      });
      await refresh();
    } catch (error) {
      console.error("Failed to set brightness:", error);
    } finally {
      setIsSending(false);
    }
  };

  const scheduleColor = (nextHue: number) => {
    if (colorTimerRef.current) window.clearTimeout(colorTimerRef.current);
    colorTimerRef.current = window.setTimeout(() => {
      void applyColor(nextHue);
    }, 180);
  };

  const scheduleWhite = (nextTone: number) => {
    if (whiteTimerRef.current) window.clearTimeout(whiteTimerRef.current);
    whiteTimerRef.current = window.setTimeout(() => {
      void applyWhiteTone(nextTone);
    }, 180);
  };

  const scheduleBrightness = (nextBrightness: number) => {
    if (brightnessTimerRef.current) window.clearTimeout(brightnessTimerRef.current);
    brightnessTimerRef.current = window.setTimeout(() => {
      void applyBrightness(nextBrightness);
    }, 180);
  };

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

      if (mode === "color") {
        setHue(nextHue);
        scheduleColor(nextHue);
      } else {
        const normalized = Math.abs(((nextHue % 360) - 180) / 180);
        const tone = Math.round((1 - normalized) * 100);
        setWhiteTone(tone);
        scheduleWhite(tone);
      }
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
  }, [mode]);

  if (devices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  const canUseColorMode = hasColorCapability;
  const canUseWhiteMode = hasTemperatureCapability;
  const previewColor =
    mode === "color"
      ? hslToHex(hue, 90, 58)
      : `hsl(${38 - (whiteTone / 100) * 20} 100% ${75 - (whiteTone / 100) * 12}%)`;

  const wheelAngle =
    mode === "color"
      ? hue
      : 180 - (whiteTone / 100) * 180;
  const knobAngle = ((wheelAngle - 90) * Math.PI) / 180;
  const knobX = 50 + Math.cos(knobAngle) * 38;
  const knobY = 50 + Math.sin(knobAngle) * 38;

  return (
    <div className="relative h-full flex flex-col p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div
        className="absolute -inset-8 pointer-events-none blur-3xl opacity-35"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${previewColor}, transparent 65%)`,
        }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">{displayName}</h3>
          <p className="text-xs text-white/45">Color / White + Brightness</p>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isOn ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-white/20"
          }`}
        />
      </div>

      <div className="relative z-10 flex items-center gap-2 mb-3">
        <button
          onClick={() => canUseColorMode && setMode("color")}
          disabled={!canUseColorMode}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            mode === "color"
              ? "bg-fuchsia-500/25 text-fuchsia-100 border-fuchsia-300/40"
              : "bg-white/5 text-white/70 border-white/10"
          } ${!canUseColorMode ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          Color
        </button>
        <button
          onClick={() => canUseWhiteMode && setMode("white")}
          disabled={!canUseWhiteMode}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            mode === "white"
              ? "bg-amber-500/25 text-amber-100 border-amber-300/40"
              : "bg-white/5 text-white/70 border-white/10"
          } ${!canUseWhiteMode ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          White
        </button>
        <span className="ml-auto text-xs text-white/70">{isSending ? "..." : mode}</span>
      </div>

      <div className="relative z-10 grid place-items-center mb-4">
        <div
          ref={wheelRef}
          className="relative w-[150px] h-[150px] rounded-full cursor-pointer touch-none select-none"
          style={{
            background:
              mode === "color"
                ? "conic-gradient(from -90deg, #ff3f3f, #ffd93f, #52ff3f, #3fffd6, #3f7bff, #b13fff, #ff3f8f, #ff3f3f)"
                : "conic-gradient(from -90deg, #7ec8ff, #d6ecff, #f6f6f6, #ffe1b1, #ffbe73, #7ec8ff)",
          }}
          onPointerDown={(event) => {
            isDraggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = event.currentTarget.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angleDeg =
              (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
              Math.PI;
            const nextHue = (Math.round(angleDeg + 450) + 360) % 360;

            if (mode === "color") {
              setHue(nextHue);
              scheduleColor(nextHue);
            } else {
              const normalized = Math.abs(((nextHue % 360) - 180) / 180);
              const tone = Math.round((1 - normalized) * 100);
              setWhiteTone(tone);
              scheduleWhite(tone);
            }
          }}
        >
          <div className="absolute inset-[18px] rounded-full bg-[#251b4f]/85 border border-white/15 backdrop-blur-sm grid place-items-center">
            <div
              className="w-11 h-11 rounded-full border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              style={{ backgroundColor: previewColor }}
            />
          </div>
          <div
            className="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${knobX}%`,
              top: `${knobY}%`,
              backgroundColor: previewColor,
            }}
          />
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/65 mb-2">
          <span>Brightness</span>
          <span className="font-semibold normal-case tracking-normal text-white/90">{brightness}%</span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={brightness}
          onChange={(event) => {
            const nextBrightness = Number(event.target.value);
            setBrightness(nextBrightness);
            if (hasDimCapability) scheduleBrightness(nextBrightness);
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background:
              "linear-gradient(90deg, #1d2a4f 0%, #3f7bff 35%, #7ec8ff 70%, #ffffff 100%)",
          }}
        />
      </div>
    </div>
  );
}
