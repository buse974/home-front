import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { WidgetDeviceState } from "../../types";

const DEFAULT_POLL_INTERVAL_MS = 3000;

function unwrapStateValue(value: unknown): unknown {
  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    if (data.isOn !== undefined) return unwrapStateValue(data.isOn);
    if (data.value !== undefined) return unwrapStateValue(data.value);
    if (data.state !== undefined) return unwrapStateValue(data.state);
  }
  return value;
}

function toBooleanState(state: WidgetDeviceState["state"]): boolean {
  if (typeof state?.isOn === "boolean") return state.isOn;

  const raw = unwrapStateValue(state?.rawValue ?? state?.value ?? state?.state);
  if (raw === null || raw === undefined) return false;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw > 0;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (
      normalized === "1" ||
      normalized === "on" ||
      normalized === "true" ||
      normalized === "open" ||
      normalized === "active"
    ) {
      return true;
    }
    if (
      normalized === "0" ||
      normalized === "off" ||
      normalized === "false" ||
      normalized === "closed" ||
      normalized === "inactive"
    ) {
      return false;
    }
    const asNumber = Number(normalized);
    if (!Number.isNaN(asNumber)) return asNumber > 0;
  }
  return false;
}

export function useWidgetRealtimeState(
  widgetId: string,
  enabled = true,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
) {
  const [deviceStates, setDeviceStates] = useState<WidgetDeviceState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await api.getWidgetState(widgetId);
      setDeviceStates(response.devices || []);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch widget state";
      setError(message);
    }
  }, [enabled, widgetId]);

  useEffect(() => {
    if (!enabled) return;

    void fetchState();
    const intervalId = window.setInterval(() => {
      void fetchState();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, pollIntervalMs, fetchState]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (!document.hidden) {
        void fetchState();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, fetchState]);

  const anyOn = useMemo(
    () => deviceStates.some((device) => toBooleanState(device.state)),
    [deviceStates],
  );

  return {
    deviceStates,
    anyOn,
    error,
    refresh: fetchState,
  };
}
