import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { getWidgetComponent } from "../modules/WidgetRegistry";
import { Responsive, WidthProvider, type Layouts } from "react-grid-layout";
import { ParticlesBackground } from "../components/ParticlesBackground";
import { WeatherEffects } from "../components/WeatherEffects";
import { useWeather } from "../contexts/WeatherContext";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type {
  Dashboard as DashboardType,
  DashboardWidget as DashboardWidgetType,
  GenericDevice,
  Widget,
} from "../types";
import { Section } from "../modules/Section/Section";

const ResponsiveGridLayout = WidthProvider(Responsive);
const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const GRID_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 120;
const GRID_MARGIN = 10;
type GridBreakpoint = keyof typeof GRID_COLS;
type DashboardTone = "violet" | "ocean" | "emerald" | "sunset" | "particles";
const DASHBOARD_TONES: Record<
  DashboardTone,
  { gradient: string; swatch: string; label: string; particleHue?: number }
> = {
  violet: {
    gradient: "from-slate-900 via-purple-900 to-slate-900",
    swatch: "from-violet-500 to-fuchsia-500",
    label: "Violet",
  },
  ocean: {
    gradient: "from-slate-900 via-blue-900 to-cyan-900",
    swatch: "from-blue-500 to-cyan-500",
    label: "Ocean",
  },
  emerald: {
    gradient: "from-slate-900 via-emerald-900 to-teal-900",
    swatch: "from-emerald-500 to-teal-500",
    label: "Emerald",
  },
  sunset: {
    gradient: "from-slate-900 via-rose-900 to-amber-900",
    swatch: "from-rose-500 to-amber-500",
    label: "Sunset",
  },
  particles: {
    gradient: "from-[#0a1628] via-[#162238] to-[#0a1628]",
    swatch: "from-cyan-400 to-teal-400",
    label: "Particles",
    particleHue: 180, // Cyan particles
  },
};

export function Dashboard() {
  const { weatherState } = useWeather();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideTitleInFullscreen, setHideTitleInFullscreen] = useState(() => {
    return localStorage.getItem("hideTitleInFullscreen") === "1";
  });
  const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
  const [deletingWidget, setDeletingWidget] = useState(false);
  const [dashboardNameDraft, setDashboardNameDraft] = useState("");
  const [savingDashboardName, setSavingDashboardName] = useState(false);
  const [dashboardTone, setDashboardTone] = useState<DashboardTone>("violet");
  const [widgetNameDrafts, setWidgetNameDrafts] = useState<
    Record<string, string>
  >({});
  const [editingWeatherWidget, setEditingWeatherWidget] = useState<
    string | null
  >(null);
  const [weatherEditConfig, setWeatherEditConfig] = useState<{
    address?: string;
    debugWeatherCode?: number | null;
    extendToBackground?: boolean;
  }>({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const ignoreTouchSwipe = useRef(false);
  const lastDashboardNavAt = useRef(0);
  const lastTapAt = useRef(0);
  const dashboardContainerRef = useRef<HTMLDivElement | null>(null);
  const layoutSnapshotRef = useRef<Layouts | null>(null);
  const shouldHideTitle = isFullscreen && hideTitleInFullscreen;
  const currentDashboardIndex = dashboard
    ? dashboards.findIndex((d) => d.id === dashboard.id)
    : -1;

  useEffect(() => {
    loadDashboard();
  }, [searchParams]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active =
        document.fullscreenElement === dashboardContainerRef.current;
      setIsFullscreen(active);
      if (active) {
        setEditMode(false);
        setShowAddModal(false);
      }
    };

    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.fullscreenElement !== dashboardContainerRef.current) return;
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Failed to exit fullscreen with Escape:", error);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "hideTitleInFullscreen",
      hideTitleInFullscreen ? "1" : "0",
    );
  }, [hideTitleInFullscreen]);

  const loadDashboard = async () => {
    try {
      const { dashboards } = await api.getDashboards();
      if (dashboards.length === 0) {
        console.warn("No dashboard found");
        setLoading(false);
        return;
      }
      setDashboards(dashboards);

      const requestedDashboardId = searchParams.get("id");
      const requestedDashboard = requestedDashboardId
        ? dashboards.find((d) => d.id === requestedDashboardId)
        : null;
      const defaultDashboard =
        requestedDashboard ||
        dashboards.find((d) => d.isDefault) ||
        dashboards[0];
      const { dashboard: fullDashboard } = await api.getDashboard(
        defaultDashboard.id,
      );
      setDashboard(fullDashboard);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToDashboardBySwipe = (direction: "next" | "prev") => {
    if (!dashboard || dashboards.length <= 1) return;

    const currentIndex = dashboards.findIndex((d) => d.id === dashboard.id);
    if (currentIndex === -1) return;

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % dashboards.length
        : (currentIndex - 1 + dashboards.length) % dashboards.length;

    const nextDashboard = dashboards[nextIndex];
    if (!nextDashboard) return;
    setSearchParams({ id: nextDashboard.id });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (editMode || showAddModal || widgetToDelete) return;
    const target = event.target as HTMLElement | null;
    ignoreTouchSwipe.current = Boolean(
      target?.closest(
        ".react-grid-item,button,input,select,textarea,[role='button'],[data-no-dashboard-swipe]",
      ),
    );
    if (ignoreTouchSwipe.current) return;
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = async (event: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (isFullscreen && now - lastTapAt.current < 280) {
      lastTapAt.current = 0;
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Failed to exit fullscreen with double tap:", error);
      }
      return;
    }
    lastTapAt.current = now;

    // En plein écran, pas de swipe de navigation (seulement double tap pour sortir)
    if (isFullscreen) return;

    if (editMode || showAddModal || widgetToDelete) return;
    if (ignoreTouchSwipe.current) {
      ignoreTouchSwipe.current = false;
      touchStart.current = null;
      return;
    }
    if (!touchStart.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (Math.abs(deltaX) < 60) return;

    if (deltaX < 0) {
      goToDashboardBySwipe("next");
    } else {
      goToDashboardBySwipe("prev");
    }
  };

  const handleDoubleClick = async () => {
    if (!isFullscreen) return;
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.error("Failed to exit fullscreen with double click:", error);
    }
  };

  const handleWheelNavigation = (event: React.WheelEvent<HTMLDivElement>) => {
    if (isFullscreen) return;
    if (editMode || showAddModal || widgetToDelete) return;
    if (!dashboard || dashboards.length <= 1) return;

    const now = Date.now();
    if (now - lastDashboardNavAt.current < 500) return;

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    let direction: "next" | "prev" | null = null;

    // Trackpad horizontal gesture
    if (absX > 40 && absX >= absY) {
      direction = event.deltaX > 0 ? "next" : "prev";
    }

    // Shift + wheel fallback
    if (!direction && event.shiftKey && absY > 40) {
      direction = event.deltaY > 0 ? "next" : "prev";
    }

    if (!direction) return;

    event.preventDefault();
    lastDashboardNavAt.current = now;
    goToDashboardBySwipe(direction);
  };

  const toggleFullscreen = async () => {
    try {
      if (!dashboardContainerRef.current) return;

      if (document.fullscreenElement === dashboardContainerRef.current) {
        await document.exitFullscreen();
      } else {
        await dashboardContainerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  };

  const handleExecuteCommand = async (
    deviceId: string,
    capability: string,
    params?: any,
  ) => {
    try {
      await api.executeCapability(deviceId, capability, params);
    } catch (error) {
      console.error("Failed to execute command:", error);
      throw error;
    }
  };

  const handleWidgetAdded = () => {
    loadDashboard();
    setShowAddModal(false);
  };

  useEffect(() => {
    if (!dashboard) return;
    setDashboardNameDraft(dashboard.name);

    const drafts: Record<string, string> = {};
    (dashboard.DashboardWidgets || []).forEach((dw) => {
      drafts[dw.id] =
        dw.name?.trim() ||
        dw.GenericDevices?.map((d) => d.name).join(", ") ||
        dw.Widget?.libelle ||
        "Widget";
    });
    setWidgetNameDrafts(drafts);
  }, [dashboard]);

  useEffect(() => {
    if (!dashboard?.id) return;
    const storageKey = `dashboard-tone:${dashboard.id}`;
    const storedTone = localStorage.getItem(storageKey) as DashboardTone | null;
    if (storedTone && storedTone in DASHBOARD_TONES) {
      setDashboardTone(storedTone);
      return;
    }
    setDashboardTone("violet");
  }, [dashboard?.id]);

  useEffect(() => {
    if (!dashboard?.id) return;
    localStorage.setItem(`dashboard-tone:${dashboard.id}`, dashboardTone);
  }, [dashboard?.id, dashboardTone]);

  const handleSaveDashboardName = async () => {
    if (!dashboard) return;
    const nextName = dashboardNameDraft.trim();
    if (!nextName || nextName === dashboard.name) return;

    setSavingDashboardName(true);
    try {
      const { dashboard: updated } = await api.updateDashboard(dashboard.id, {
        name: nextName,
      });
      setDashboard((prev) => (prev ? { ...prev, name: updated.name } : prev));
    } catch (error) {
      console.error("Failed to rename dashboard:", error);
      alert("Failed to rename dashboard");
    } finally {
      setSavingDashboardName(false);
    }
  };

  const handleSaveWidgetName = async (widgetId: string) => {
    if (!dashboard) return;
    const dashboardWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === widgetId,
    );
    if (!dashboardWidget) return;

    const nextName = (widgetNameDrafts[widgetId] || "").trim();
    const currentName = (dashboardWidget.name || "").trim();
    const currentDisplayName =
      currentName ||
      dashboardWidget.GenericDevices?.map((d) => d.name).join(", ") ||
      dashboardWidget.Widget?.libelle ||
      "Widget";
    if (nextName === currentName || nextName === currentDisplayName) return;

    try {
      const { dashboardWidget: updated } = await api.updateWidget(widgetId, {
        name: nextName || null,
      });
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
            w.id === widgetId ? { ...w, name: updated.name ?? null } : w,
          ),
        };
      });
    } catch (error) {
      console.error("Failed to rename widget:", error);
      alert("Failed to rename widget");
    }
  };

  const handleToggleWidgetBackground = async (widgetId: string) => {
    if (!dashboard) return;

    const targetWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === widgetId,
    );
    if (!targetWidget) return;

    const currentConfig = targetWidget.config || {};
    const nextTransparentBackground = !currentConfig.transparentBackground;
    const nextConfig = {
      ...currentConfig,
      transparentBackground: nextTransparentBackground,
    };

    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
          w.id === widgetId ? { ...w, config: nextConfig } : w,
        ),
      };
    });

    try {
      await api.updateWidget(widgetId, { config: nextConfig });
    } catch (error) {
      console.error("Failed to update widget background option:", error);
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
            w.id === widgetId ? { ...w, config: currentConfig } : w,
          ),
        };
      });
      alert("Failed to update widget background option");
    }
  };

  const SECTION_COLORS = [
    "white",
    "blue",
    "emerald",
    "violet",
    "rose",
    "amber",
    "cyan",
  ];

  const handleCycleSectionColor = async (widgetId: string) => {
    if (!dashboard) return;
    const targetWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === widgetId,
    );
    if (!targetWidget) return;

    const currentConfig = targetWidget.config || {};
    const currentColor = (currentConfig.sectionColor as string) || "white";
    const currentIndex = SECTION_COLORS.indexOf(currentColor);
    const nextColor =
      SECTION_COLORS[(currentIndex + 1) % SECTION_COLORS.length];
    const nextConfig = { ...currentConfig, sectionColor: nextColor };

    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
          w.id === widgetId ? { ...w, config: nextConfig } : w,
        ),
      };
    });

    try {
      await api.updateWidget(widgetId, { config: nextConfig });
    } catch (error) {
      console.error("Failed to update section color:", error);
    }
  };

  const handleToggleSectionTitle = async (widgetId: string) => {
    if (!dashboard) return;
    const targetWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === widgetId,
    );
    if (!targetWidget) return;

    const currentConfig = targetWidget.config || {};
    const hasTitle = !!currentConfig.title;
    const nextConfig = hasTitle
      ? { ...currentConfig, title: null }
      : { ...currentConfig, title: "Section" };

    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
          w.id === widgetId ? { ...w, config: nextConfig } : w,
        ),
      };
    });

    try {
      await api.updateWidget(widgetId, { config: nextConfig });
    } catch (error) {
      console.error("Failed to toggle section title:", error);
    }
  };

  const handleToggleSectionFoldable = async (widgetId: string) => {
    if (!dashboard) return;
    const targetWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === widgetId,
    );
    if (!targetWidget) return;

    const currentConfig = targetWidget.config || {};
    const nextFoldable = !currentConfig.foldable;
    const nextConfig = { ...currentConfig, foldable: nextFoldable };

    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
          w.id === widgetId ? { ...w, config: nextConfig } : w,
        ),
      };
    });

    try {
      await api.updateWidget(widgetId, { config: nextConfig });
    } catch (error) {
      console.error("Failed to toggle section foldable:", error);
    }
  };

  const handleSaveWeatherConfig = async () => {
    if (!dashboard || !editingWeatherWidget) return;

    const targetWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === editingWeatherWidget,
    );
    if (!targetWidget) return;

    const nextConfig = {
      ...(targetWidget.config || {}),
      ...weatherEditConfig,
    };

    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
          w.id === editingWeatherWidget ? { ...w, config: nextConfig } : w,
        ),
      };
    });

    try {
      await api.updateWidget(editingWeatherWidget, { config: nextConfig });
      setEditingWeatherWidget(null);
      setWeatherEditConfig({});
    } catch (error) {
      console.error("Failed to update weather config:", error);
      alert("Failed to update weather configuration");
    }
  };

  const handleToggleClockMode = async (widgetId: string) => {
    if (!dashboard) return;

    const targetWidget = dashboard.DashboardWidgets?.find(
      (w) => w.id === widgetId,
    );
    if (!targetWidget) return;

    const currentConfig = targetWidget.config || {};
    const currentMode =
      currentConfig.clockMode === "digital" ? "digital" : "analog";
    const nextMode = currentMode === "analog" ? "digital" : "analog";
    const nextConfig = {
      ...currentConfig,
      clockMode: nextMode,
    };

    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
          w.id === widgetId ? { ...w, config: nextConfig } : w,
        ),
      };
    });

    try {
      await api.updateWidget(widgetId, { config: nextConfig });
    } catch (error) {
      console.error("Failed to update clock mode:", error);
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          DashboardWidgets: (prev.DashboardWidgets || []).map((w) =>
            w.id === widgetId ? { ...w, config: currentConfig } : w,
          ),
        };
      });
      alert("Failed to update clock mode");
    }
  };

  const handleDeleteWidget = async () => {
    if (!widgetToDelete) return;
    setDeletingWidget(true);
    try {
      await api.deleteWidget(widgetToDelete);
      loadDashboard();
      setWidgetToDelete(null);
    } catch (error) {
      console.error("Failed to delete widget:", error);
      alert("Failed to delete widget");
    } finally {
      setDeletingWidget(false);
    }
  };

  // Merge partial layouts (from one grid) into the full layouts
  const mergeLayouts = (partialLayouts: Layouts): Layouts => {
    const current = dashboard?.layouts || {};
    const merged: any = {};
    const allBreakpoints = new Set([
      ...Object.keys(current),
      ...Object.keys(partialLayouts),
    ]);
    for (const bp of allBreakpoints) {
      const currentItems = (current as any)[bp] || [];
      const partialItems = (partialLayouts as any)[bp] || [];
      const partialIds = new Set(partialItems.map((i: any) => i.i));
      merged[bp] = [
        ...currentItems.filter((i: any) => !partialIds.has(i.i)),
        ...partialItems,
      ];
    }
    return merged as Layouts;
  };

  const handleLayoutChange = async (newLayouts: Layouts) => {
    if (!editMode || !dashboard) return;
    // Don't save during drag - we'll save on drop
    if (layoutSnapshotRef.current) return;
    const merged = mergeLayouts(newLayouts);
    setDashboard((prev) => (prev ? { ...prev, layouts: merged } : prev));
    try {
      await api.updateDashboardLayouts(dashboard.id, merged);
    } catch (error) {
      console.error("Failed to update layouts:", error);
    }
  };

  // Save positions at drag start
  const handleDragStart = () => {
    if (!dashboard) return;
    const current = dashboard.layouts || {};
    // Deep clone the layouts
    layoutSnapshotRef.current = JSON.parse(JSON.stringify(current));
  };

  // Restore positions at drag stop, only keep the dragged widget's new position
  const handleDragStop = (
    _layout: any[],
    _oldItem: any,
    newItem: any,
  ) => {
    const snapshot = layoutSnapshotRef.current;
    layoutSnapshotRef.current = null;
    if (!snapshot || !dashboard) return;

    // Restore snapshot but update the dragged widget's position
    const restored: any = {};
    for (const [bp, bpLayout] of Object.entries(snapshot)) {
      if (!Array.isArray(bpLayout)) {
        restored[bp] = bpLayout;
        continue;
      }
      restored[bp] = (bpLayout as any[]).map((item: any) => {
        if (item.i === newItem.i) {
          return { ...item, x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h };
        }
        return item;
      });
    }

    setDashboard((prev) => (prev ? { ...prev, layouts: restored } : prev));
    api.updateDashboardLayouts(dashboard.id, restored).catch((error) => {
      console.error("Failed to update layouts after drag:", error);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div
              className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"
              style={{ animationDirection: "reverse", animationDuration: "1s" }}
            ></div>
          </div>
          <p className="text-xl text-white/80 mt-6 font-light">
            Loading your smart home...
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <p className="text-xl text-white/80 font-light">No dashboard found</p>
        </div>
      </div>
    );
  }

  const baseLayouts: Layouts = dashboard.layouts || {
    lg: (dashboard.DashboardWidgets || []).map((dw) => ({
      i: dw.id,
      x: dw.position?.x || 0,
      y: dw.position?.y || 0,
      w: dw.position?.w || 3,
      h: dw.position?.h || 2,
    })),
  };

  const centeredLayouts: Layouts = Object.fromEntries(
    Object.entries(baseLayouts).map(([breakpoint, layout]) => {
      const cols = GRID_COLS[breakpoint as GridBreakpoint];
      if (!cols || !layout?.length) {
        return [breakpoint, layout];
      }

      const maxRight = layout.reduce(
        (max, item) => Math.max(max, (item.x || 0) + (item.w || 1)),
        0,
      );
      const usedCols = Math.min(cols, Math.max(0, maxRight));
      const shift = Math.max(0, Math.floor((cols - usedCols) / 2));

      if (shift === 0) {
        return [breakpoint, layout];
      }

      return [
        breakpoint,
        layout.map((item) => ({
          ...item,
          x: (item.x || 0) + shift,
        })),
      ];
    }),
  ) as Layouts;

  const layoutsForRender = editMode ? baseLayouts : centeredLayouts;
  const dashboardGradientClass = DASHBOARD_TONES[dashboardTone].gradient;
  const showParticles = dashboardTone === "particles";

  const allWidgets = dashboard.DashboardWidgets || [];

  // Collect all child widget IDs from all sections
  const childWidgetIdSet = new Set<string>();
  allWidgets.forEach((dw) => {
    if (dw.Widget?.component === "Section") {
      const children = (dw.config?.childWidgetIds as string[]) || [];
      children.forEach((id) => childWidgetIdSet.add(id));
    }
  });

  // Children are always rendered inside Section.tsx, never in the main grid
  const gridWidgets = allWidgets.filter((dw) => !childWidgetIdSet.has(dw.id));

  const filterLayouts = (layouts: Layouts, keepIds: Set<string>): Layouts =>
    Object.fromEntries(
      Object.entries(layouts).map(([bp, layout]) => [
        bp,
        Array.isArray(layout)
          ? layout.filter((item) => keepIds.has(item.i))
          : layout,
      ]),
    ) as Layouts;

  const gridLayoutsForRender = filterLayouts(
    layoutsForRender,
    new Set(gridWidgets.map((w) => w.id)),
  );

  // Helper: get child DashboardWidget objects for a section
  const getChildWidgets = (sectionDw: DashboardWidgetType): DashboardWidgetType[] => {
    const childIds: string[] = (sectionDw.config?.childWidgetIds as string[]) || [];
    return childIds
      .map((id) => allWidgets.find((w) => w.id === id))
      .filter((w): w is DashboardWidgetType => w != null);
  };

  const particleHue = DASHBOARD_TONES[dashboardTone].particleHue;

  return (
    <div
      ref={dashboardContainerRef}
      className={`min-h-screen bg-gradient-to-br ${dashboardGradientClass} relative overflow-hidden`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheelNavigation}
    >
      {/* Particles Background (only when particles theme is selected) */}
      {showParticles && particleHue !== undefined && (
        <ParticlesBackground
          count={window.innerWidth < 768 ? 30 : 50}
          baseHue={particleHue}
          hueRange={60}
          speed={0.8}
        />
      )}

      {/* Weather Effects Background (when weather widget has extendToBackground enabled) */}
      {weatherState?.enabled && (
        <WeatherEffects
          weatherCode={weatherState.weatherCode}
          isDay={weatherState.isDay}
        />
      )}
      {/* CSS pour faire en sorte que les widgets prennent toute la hauteur */}
      <style>{`
        .react-grid-item {
          display: flex !important;
          flex-direction: column !important;
        }
        .react-grid-item > div {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .react-grid-item > .react-resizable-handle {
          z-index: 200 !important;
          pointer-events: auto !important;
        }
        .widget-no-background > div:first-child {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div
        className={`relative z-10 min-h-screen flex flex-col ${
          shouldHideTitle ? "py-0" : "py-6 md:py-8 lg:py-10"
        }`}
      >
        <div className="w-full max-w-[1760px] mx-auto px-5 md:px-7 lg:px-8 flex-1 flex flex-col">
          {/* Header */}
          <header className={`${shouldHideTitle ? "hidden" : "mb-2 md:mb-3"}`}>
            <div className="min-h-[clamp(6rem,13vh,9rem)] md:min-h-[clamp(7rem,15vh,10rem)] px-2 md:px-3 flex items-center justify-between">
              {!shouldHideTitle && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {editMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={dashboardNameDraft}
                          onChange={(e) =>
                            setDashboardNameDraft(e.target.value)
                          }
                          onBlur={handleSaveDashboardName}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          className="rename-dashboard-input text-3xl md:text-4xl font-bold px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                          placeholder="Nom du dashboard"
                        />
                        {savingDashboardName && (
                          <span className="text-xs text-white/60">
                            Saving...
                          </span>
                        )}
                      </div>
                    ) : (
                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        {dashboard.name}
                      </h1>
                    )}
                  </div>
                  {!isFullscreen && (
                    <p className="text-white/60 font-light">
                      Control your connected devices
                    </p>
                  )}
                  {!isFullscreen &&
                    dashboards.length > 1 &&
                    currentDashboardIndex >= 0 && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/75">
                        <span>
                          Dashboard {currentDashboardIndex + 1}/
                          {dashboards.length}
                        </span>
                        <span className="text-white/40">•</span>
                        <span>Swipe gauche/droite</span>
                      </div>
                    )}
                </div>
              )}
              <div className="flex items-center gap-3">
                {editMode && !isFullscreen && (
                  <div className="h-12 px-3 rounded-xl bg-white/10 border border-white/15 inline-flex items-center gap-2">
                    <span className="text-xs text-white/65 hidden md:inline">
                      Nuance
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(Object.keys(DASHBOARD_TONES) as DashboardTone[]).map(
                        (tone) => (
                          <button
                            key={tone}
                            onClick={() => setDashboardTone(tone)}
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${DASHBOARD_TONES[tone].swatch} border-2 transition-transform hover:scale-110 ${
                              dashboardTone === tone
                                ? "border-white shadow-[0_0_12px_rgba(255,255,255,0.45)]"
                                : "border-white/30"
                            }`}
                            title={`Nuance ${DASHBOARD_TONES[tone].label}`}
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}
                {!isFullscreen && (
                  <button
                    onClick={() => setHideTitleInFullscreen((prev) => !prev)}
                    className={`h-12 px-4 inline-flex items-center justify-center rounded-xl text-xs font-medium border transition-colors ${
                      hideTitleInFullscreen
                        ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                        : "bg-white/10 border-white/15 text-white/70 hover:text-white hover:bg-white/15"
                    }`}
                    title="Masquer le titre en plein écran"
                  >
                    Titre FS: {hideTitleInFullscreen ? "Off" : "On"}
                  </button>
                )}
                {!isFullscreen && dashboards.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToDashboardBySwipe("prev")}
                      className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/10 hover:border-white/20"
                      title="Dashboard précédent"
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => goToDashboardBySwipe("next")}
                      className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/10 hover:border-white/20"
                      title="Dashboard suivant"
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                {!isFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20"
                    title="Plein écran"
                  >
                    <svg
                      className="w-6 h-6 text-white/90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4"
                      />
                    </svg>
                  </button>
                )}
                {!isFullscreen && (
                  <>
                    <Link
                      to="/admin"
                      className="group relative w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20"
                    >
                      <svg
                        className="w-6 h-6 text-white/80 group-hover:text-white transition-colors group-hover:rotate-90 duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`group relative h-12 px-6 rounded-xl font-medium inline-flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                        editMode
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/50"
                          : "bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/80 border border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="relative flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>{editMode ? "Save Layout" : "Edit Layout"}</span>
                      </div>
                    </button>
                    {editMode && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="group relative h-12 px-6 inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-medium text-white shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Add Widget</span>
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Widgets Grid */}
          <main
            className={`flex-1 flex ${
              shouldHideTitle ? "items-center" : "items-start"
            }`}
          >
            {!dashboard.DashboardWidgets ||
            dashboard.DashboardWidgets.length === 0 ? (
              <div className="w-full flex-1 flex items-center justify-center px-4">
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 backdrop-blur-sm rounded-2xl mb-6 border border-white/10">
                    <svg
                      className="w-10 h-10 text-white/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl text-white/80 mb-3 font-light">
                    No widgets yet
                  </h3>
                  <p className="text-white/50 mb-6">
                    {editMode
                      ? "Start by adding your first device"
                      : "Enable edit mode to add widgets"}
                  </p>
                  {editMode && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-300 border border-white/10 hover:border-white/20"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add your first widget
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative w-full px-2 md:px-3">
                <ResponsiveGridLayout
                  className="layout"
                  layouts={gridLayoutsForRender}
                  breakpoints={GRID_BREAKPOINTS}
                  cols={GRID_COLS}
                  rowHeight={ROW_HEIGHT}
                  margin={[GRID_MARGIN, GRID_MARGIN]}
                  isDraggable={editMode}
                  isResizable={editMode}
                  draggableCancel=".delete-button,.rename-widget-input,.rename-dashboard-input,.widget-style-button,.section-title-input"
                  onLayoutChange={(_, layouts: Layouts) =>
                    handleLayoutChange(layouts)
                  }
                  onDragStart={handleDragStart}
                  onDragStop={handleDragStop}
                  allowOverlap={false}
                  compactType={null}
                  resizeHandles={["se"]}
                >
                  {gridWidgets.map((dashboardWidget) => {
                    const isSection =
                      dashboardWidget.Widget?.component === "Section";
                    const WidgetComponent = isSection
                      ? null
                      : getWidgetComponent(
                          dashboardWidget.Widget?.component || "",
                        );

                    if (!isSection && !WidgetComponent) {
                      return (
                        <div
                          key={dashboardWidget.id}
                          className="p-6 bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20"
                        >
                          <p className="text-red-400">
                            Unknown widget:{" "}
                            {dashboardWidget.Widget?.component}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={dashboardWidget.id}
                        className="relative h-full w-full"
                        style={
                          isSection
                            ? { zIndex: 0 }
                            : { zIndex: 1 }
                        }
                      >
                        <div
                          className={`h-full w-full ${
                            editMode && !isSection
                              ? "pointer-events-none"
                              : ""
                          } ${
                            !isSection &&
                            dashboardWidget.config?.transparentBackground
                              ? "widget-no-background"
                              : ""
                          }`}
                        >
                          {isSection ? (
                            <Section
                              dashboardWidget={dashboardWidget}
                              childWidgets={getChildWidgets(dashboardWidget)}
                              onCommand={async () => {}}
                              onChildCommand={async (
                                dwId,
                                capability,
                                params,
                                deviceId,
                              ) => {
                                const child = allWidgets.find(
                                  (w) => w.id === dwId,
                                );
                                await handleExecuteCommand(
                                  deviceId ||
                                    child?.GenericDevices?.[0]?.id ||
                                    "",
                                  capability,
                                  params,
                                );
                              }}
                              editMode={editMode}
                            />
                          ) : (
                            WidgetComponent && (
                              <WidgetComponent
                                dashboardWidget={dashboardWidget}
                                onCommand={(capability, params, deviceId) =>
                                  handleExecuteCommand(
                                    deviceId ||
                                      dashboardWidget.GenericDevices?.[0]
                                        ?.id ||
                                      "",
                                    capability,
                                    params,
                                  )
                                }
                              />
                            )
                          )}
                        </div>

                        {/* Edit mode toolbar */}
                        {editMode && (
                          <div className="absolute top-2 left-2 z-[101] flex items-center gap-2">
                            <input
                              value={
                                widgetNameDrafts[dashboardWidget.id] || ""
                              }
                              onChange={(e) =>
                                setWidgetNameDrafts((prev) => ({
                                  ...prev,
                                  [dashboardWidget.id]: e.target.value,
                                }))
                              }
                              onBlur={() =>
                                handleSaveWidgetName(dashboardWidget.id)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                }
                              }}
                              className="rename-widget-input w-44 px-2.5 py-1.5 rounded-md bg-slate-900/80 border border-white/25 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Nom du widget"
                            />
                            {isSection && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  void handleCycleSectionColor(
                                    dashboardWidget.id,
                                  );
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="widget-style-button px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-slate-900/80 border-white/25 text-white/80 hover:text-white"
                                title="Changer la couleur de la section"
                              >
                                Couleur
                              </button>
                            )}
                            {isSection && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  void handleToggleSectionTitle(
                                    dashboardWidget.id,
                                  );
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className={`widget-style-button px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                  dashboardWidget.config?.title
                                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                                    : "bg-slate-900/80 border-white/25 text-white/80 hover:text-white"
                                }`}
                                title="Toggle titre de la section"
                              >
                                Titre
                              </button>
                            )}
                            {isSection && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  void handleToggleSectionFoldable(
                                    dashboardWidget.id,
                                  );
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className={`widget-style-button px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                  dashboardWidget.config?.foldable
                                    ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                                    : "bg-slate-900/80 border-white/25 text-white/80 hover:text-white"
                                }`}
                                title="Mode dossier (pliable en overlay)"
                              >
                                Pliable
                              </button>
                            )}
                            {!isSection && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  void handleToggleWidgetBackground(
                                    dashboardWidget.id,
                                  );
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className={`widget-style-button px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                  dashboardWidget.config
                                    ?.transparentBackground
                                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                                    : "bg-slate-900/80 border-white/25 text-white/80 hover:text-white"
                                }`}
                                title="Activer/desactiver le fond du widget"
                              >
                                Fond
                              </button>
                            )}
                            {dashboardWidget.Widget?.component ===
                              "Clock" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  void handleToggleClockMode(
                                    dashboardWidget.id,
                                  );
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="widget-style-button px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-slate-900/80 border-white/25 text-white/80 hover:text-white"
                                title="Basculer analog/digital"
                              >
                                Mode
                              </button>
                            )}
                            {dashboardWidget.Widget?.component ===
                              "Weather" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setEditingWeatherWidget(
                                    dashboardWidget.id,
                                  );
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                className="widget-style-button px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-slate-900/80 border-white/25 text-white/80 hover:text-white"
                                title="Configurer la météo"
                              >
                                Config
                              </button>
                            )}
                          </div>
                        )}

                        {/* Delete button */}
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setWidgetToDelete(dashboardWidget.id);
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            className="delete-button absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-lg z-[100]"
                            title="Supprimer le widget"
                          >
                            <svg
                              className="w-4 h-4 text-white pointer-events-none"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}

                        {/* Edit mode overlay */}
                        {editMode && (
                          <div
                            className={`absolute inset-0 cursor-move rounded-2xl pointer-events-none ${
                              isSection
                                ? "bg-white/5 border-2 border-dashed border-white/30"
                                : "bg-purple-500/10 border-2 border-purple-500/50"
                            }`}
                          >
                            <div
                              className={`absolute bottom-0 right-0 w-8 h-8 rounded-tl-lg rounded-br-xl pointer-events-none flex items-center justify-center z-[102] ${
                                isSection ? "bg-white/40" : "bg-purple-500"
                              }`}
                            >
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ResponsiveGridLayout>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal Add Widget */}
      {showAddModal && (
        <AddWidgetModal
          dashboardId={dashboard.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleWidgetAdded}
        />
      )}

      {/* Modal Delete Widget */}
      {widgetToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deletingWidget && setWidgetToDelete(null)}
            aria-label="Fermer la confirmation"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">
              Supprimer ce widget ?
            </h3>
            <p className="mt-3 text-white/70">
              Les devices non utilisés seront automatiquement supprimés.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setWidgetToDelete(null)}
                disabled={deletingWidget}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteWidget}
                disabled={deletingWidget}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingWidget ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weather Config Modal */}
      {editingWeatherWidget && dashboard && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingWeatherWidget(null)}
            aria-label="Fermer la configuration"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6">
              ⚙️ Configuration Météo
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Adresse / Ville
                </label>
                <input
                  type="text"
                  value={
                    weatherEditConfig.address ??
                    dashboard.DashboardWidgets?.find(
                      (w) => w.id === editingWeatherWidget,
                    )?.config?.address ??
                    ""
                  }
                  onChange={(e) =>
                    setWeatherEditConfig({
                      ...weatherEditConfig,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Paris, Lyon, Marseille"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Mode Météo
                </label>
                <select
                  value={
                    weatherEditConfig.debugWeatherCode ??
                    dashboard.DashboardWidgets?.find(
                      (w) => w.id === editingWeatherWidget,
                    )?.config?.debugWeatherCode ??
                    ""
                  }
                  onChange={(e) =>
                    setWeatherEditConfig({
                      ...weatherEditConfig,
                      debugWeatherCode: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">🔴 Météo en direct (Live)</option>
                  <option value="0">☀️ Très beau (code 0)</option>
                  <option value="1">🌤️ Beau temps (code 1)</option>
                  <option value="2">⛅ Peu nuageux (code 2)</option>
                  <option value="3">☁️ Couvert (code 3)</option>
                  <option value="45">🌫️ Brouillard (code 45)</option>
                  <option value="51">🌧️ Bruine légère (code 51)</option>
                  <option value="61">🌧️ Pluie (code 61)</option>
                  <option value="65">🌧️ Forte pluie (code 65)</option>
                  <option value="71">❄️ Neige légère (code 71)</option>
                  <option value="75">❄️ Forte neige (code 75)</option>
                  <option value="95">⛈️ Orage (code 95)</option>
                </select>
                <p className="text-xs text-white/50 mt-2">
                  Force une condition météo pour tester les animations
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={
                      weatherEditConfig.extendToBackground ??
                      dashboard.DashboardWidgets?.find(
                        (w) => w.id === editingWeatherWidget,
                      )?.config?.extendToBackground ??
                      false
                    }
                    onChange={(e) =>
                      setWeatherEditConfig({
                        ...weatherEditConfig,
                        extendToBackground: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-500 checked:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                      Étendre les effets météo au fond d'écran
                    </span>
                    <p className="text-xs text-white/50 mt-1">
                      Les animations météo (pluie, neige, nuages, éclairs)
                      s'afficheront en arrière-plan de tout le dashboard
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingWeatherWidget(null)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveWeatherConfig}
                className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version */}
      <span className="fixed bottom-1 right-2 text-[10px] text-white/20 pointer-events-none select-none">
        v0.6
      </span>
    </div>
  );
}

/**
 * Modal pour ajouter un widget avec design moderne
 */
interface AddWidgetModalProps {
  dashboardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddWidgetModal({
  dashboardId,
  onClose,
  onSuccess,
}: AddWidgetModalProps) {
  const [step, setStep] = useState<"widget" | "device" | "config">("widget");
  const [availableDevices, setAvailableDevices] = useState<
    (GenericDevice & { providerId: string })[]
  >([]);
  const [selectedDevices, setSelectedDevices] = useState<
    (GenericDevice & { providerId: string })[]
  >([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [widgetConfig, setWidgetConfig] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [weatherSuggestions, setWeatherSuggestions] = useState<string[]>([]);
  const [weatherAutocompleteLoading, setWeatherAutocompleteLoading] =
    useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  useEffect(() => {
    loadWidgets();
  }, []);

  useEffect(() => {
    if (selectedWidget?.name !== "Weather" || step !== "config") {
      setWeatherSuggestions([]);
      setWeatherAutocompleteLoading(false);
      return;
    }

    const rawQuery =
      typeof widgetConfig.address === "string"
        ? widgetConfig.address.trim()
        : "";

    if (rawQuery.length < 2) {
      setWeatherSuggestions([]);
      setWeatherAutocompleteLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setWeatherAutocompleteLoading(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(rawQuery)}&count=5&language=fr&format=json`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          setWeatherSuggestions([]);
          return;
        }

        const data = await res.json();
        const results: any[] = Array.isArray(data?.results) ? data.results : [];
        const suggestionLabels = results
          .map((item: any) =>
            [item.name, item.admin1, item.country].filter(Boolean).join(", "),
          )
          .filter((value: string) => value.length > 0);
        const nextSuggestions = Array.from(
          new Set<string>(suggestionLabels),
        ).slice(0, 5);

        setWeatherSuggestions(nextSuggestions);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setWeatherSuggestions([]);
      } finally {
        setWeatherAutocompleteLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [selectedWidget?.name, step, widgetConfig.address]);

  const widgetNeedsConfig = (widget: Widget | null) =>
    widget?.name === "ActionButton" ||
    widget?.name === "StateMessage" ||
    widget?.name === "TextTicker" ||
    widget?.name === "Clock" ||
    widget?.name === "Weather" ||
    widget?.name === "PhotoFrame";

  const widgetNeedsDevice = (widget: Widget | null) =>
    widget
      ? widget.name === "TextTicker" ||
        widget.name === "Clock" ||
        widget.name === "Weather" ||
        widget.name === "PhotoFrame"
        ? false
        : widget.requiresDevice !== false
      : false;

  const getDefaultConfig = (widget: Widget) => {
    if (widget.name === "ActionButton") {
      return {
        action: "off",
        label: "Turn OFF",
        color: "red",
      };
    }

    if (widget.name === "StateMessage") {
      return {
        trueMessage: "Allume",
        falseMessage: "Eteint",
        trueColor: "green",
        falseColor: "red",
      };
    }

    if (widget.name === "TextTicker") {
      return {
        message: "Bienvenue dans votre dashboard",
        speed: 16,
      };
    }

    if (widget.name === "Weather") {
      return {
        address: "Paris",
      };
    }

    if (widget.name === "Clock") {
      return {
        clockMode: "analog",
      };
    }

    if (widget.name === "PhotoFrame") {
      return {
        photos: [],
        intervalSeconds: 6,
      };
    }

    return {};
  };

  const loadAllDevices = async () => {
    setLoading(true);
    try {
      // Charger tous les providers
      const { providers: providersList } = await api.getProviders();

      // Charger les devices de TOUS les providers en parallèle
      const devicesPromises = providersList.map(async (provider) => {
        try {
          const { devices } = await api.getAvailableDevices(provider.id);
          // Ajouter le providerId à chaque device
          return devices.map((device) => ({
            ...device,
            providerId: provider.id,
          }));
        } catch (error) {
          console.error(
            `Failed to load devices for provider ${provider.name}:`,
            error,
          );
          return [];
        }
      });

      const devicesArrays = await Promise.all(devicesPromises);
      const allDevices = devicesArrays.flat();

      setAvailableDevices(allDevices);
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWidgets = async () => {
    setLoading(true);
    try {
      const { widgets: widgetsList } = await api.getWidgetsCatalogue();
      setWidgets(widgetsList);
    } catch (error) {
      console.error("Failed to load widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetSelection = async (widget: Widget) => {
    setSelectedWidget(widget);
    setSelectedDevices([]);
    setWidgetConfig(getDefaultConfig(widget));
    setPhotoUrlInput("");

    if (widgetNeedsDevice(widget)) {
      await loadAllDevices();
      setStep("device");
      return;
    }

    if (widgetNeedsConfig(widget)) {
      setStep("config");
      return;
    }

    setStep("widget");
  };

  const handleAddWidget = async () => {
    if (!selectedWidget) return;

    setLoading(true);
    try {
      let genericDeviceIds: string[] = [];

      if (widgetNeedsDevice(selectedWidget)) {
        if (selectedDevices.length === 0) {
          alert("Please select at least one device");
          return;
        }

        // Créer tous les GenericDevices
        const devicePromises = selectedDevices.map((device) =>
          api.createDevice({
            provider_id: device.providerId,
            name: device.name,
            type: device.type,
            capabilities: device.capabilities,
            command_mapping: device.command_mapping,
          }),
        );

        const createdDevices = await Promise.all(devicePromises);
        genericDeviceIds = createdDevices.map((result) => result.device.id);
      }

      await api.addWidget(dashboardId, {
        widgetId: selectedWidget.id,
        genericDeviceIds,
        config: widgetConfig,
        position: { x: 0, y: 0, w: 2, h: 1 },
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to add widget:", error);
      alert("Failed to add widget");
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceSelection = (
    device: GenericDevice & { providerId: string },
  ) => {
    setSelectedDevices((prev) => {
      const isSelected = prev.some((d) => d.id === device.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== device.id);
      } else {
        return [...prev, device];
      }
    });
  };

  const handleBackStep = () => {
    if (
      step === "config" &&
      selectedWidget &&
      widgetNeedsDevice(selectedWidget)
    ) {
      setStep("device");
      return;
    }
    setStep("widget");
  };

  const handleDeviceNext = async () => {
    if (!selectedWidget || selectedDevices.length === 0) return;

    if (widgetNeedsConfig(selectedWidget)) {
      setStep("config");
      return;
    }

    await handleAddWidget();
  };

  const handleAddPhotoUrl = () => {
    const value = photoUrlInput.trim();
    if (!value) return;
    setWidgetConfig((prev: any) => ({
      ...prev,
      photos: [...(Array.isArray(prev.photos) ? prev.photos : []), value],
    }));
    setPhotoUrlInput("");
  };

  const handleRemovePhoto = (index: number) => {
    setWidgetConfig((prev: any) => ({
      ...prev,
      photos: (Array.isArray(prev.photos) ? prev.photos : []).filter(
        (_: string, i: number) => i !== index,
      ),
    }));
  };

  const handleUploadPhotos = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
      });

    try {
      const uploaded = await Promise.all(files.map((f) => readAsDataUrl(f)));
      setWidgetConfig((prev: any) => ({
        ...prev,
        photos: [
          ...(Array.isArray(prev.photos) ? prev.photos : []),
          ...uploaded,
        ],
      }));
    } catch (error) {
      console.error("Failed to load photos:", error);
      alert("Impossible de charger certaines photos");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-2xl font-bold text-white">Add Widget</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8 gap-3">
            <StepIndicator
              active={step === "widget"}
              completed={!!selectedWidget}
              number="1"
            >
              Widget
            </StepIndicator>
            {selectedWidget && widgetNeedsDevice(selectedWidget) && (
              <>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                <StepIndicator
                  active={step === "device"}
                  completed={selectedDevices.length > 0}
                  number="2"
                >
                  Device{selectedDevices.length > 1 ? "s" : ""}
                </StepIndicator>
              </>
            )}
            {selectedWidget && widgetNeedsConfig(selectedWidget) && (
              <>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                <StepIndicator
                  active={step === "config"}
                  completed={false}
                  number={widgetNeedsDevice(selectedWidget) ? "3" : "2"}
                >
                  Config
                </StepIndicator>
              </>
            )}
          </div>

          {/* Step: Device */}
          {step === "device" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">
                Select Device(s)
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-white/60 mt-4">Loading devices...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableDevices.map((device) => {
                      const isSelected = selectedDevices.some(
                        (d) => d.id === device.id,
                      );
                      return (
                        <button
                          key={device.id}
                          onClick={() => toggleDeviceSelection(device)}
                          className={`w-full p-4 text-left rounded-xl border transition-all group flex items-center gap-3 ${
                            isSelected
                              ? "bg-purple-500/20 border-purple-500"
                              : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-500/50"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "border-purple-500 bg-purple-500"
                                : "border-white/30"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                              {device.name}
                            </p>
                            <p className="text-sm text-white/60 mt-1">
                              {device.type} •{" "}
                              {Object.keys(device.capabilities)
                                .filter((k) => device.capabilities[k])
                                .join(", ")}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: Widget */}
          {step === "widget" && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                Select Widget Type
              </h3>

              {/* Category tabs */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {["all", "switch", "action", "sensor", "media"].map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                        selectedCategory === category
                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                      }`}
                    >
                      {category === "all"
                        ? "All"
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ),
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-white/60 mt-4">Loading widgets...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {widgets
                    .filter(
                      (w) =>
                        selectedCategory === "all" ||
                        w.category === selectedCategory,
                    )
                    .map((widget) => {
                      const isSelected = selectedWidget?.id === widget.id;

                      // Visual preview styles by widget type
                      const widgetVisuals: Record<
                        string,
                        { gradient: string; icon: string }
                      > = {
                        Switch: {
                          gradient: "from-blue-500/20 to-indigo-500/20",
                          icon: "🔘",
                        },
                        SwitchToggle: {
                          gradient: "from-emerald-500/20 to-teal-500/20",
                          icon: "🎚️",
                        },
                        ActionButton: {
                          gradient: "from-red-500/20 to-rose-500/20",
                          icon: "⚡",
                        },
                        SwitchNeon: {
                          gradient: "from-cyan-500/20 to-blue-500/20",
                          icon: "⚡",
                        },
                        Sensor: {
                          gradient: "from-emerald-500/20 to-lime-500/20",
                          icon: "📡",
                        },
                        StateMessage: {
                          gradient: "from-amber-500/20 to-orange-500/20",
                          icon: "💬",
                        },
                        RawState: {
                          gradient: "from-slate-500/20 to-cyan-500/20",
                          icon: "🧾",
                        },
                        TextTicker: {
                          gradient: "from-fuchsia-500/20 to-violet-500/20",
                          icon: "📢",
                        },
                        Clock: {
                          gradient: "from-cyan-500/20 to-blue-500/20",
                          icon: "🕒",
                        },
                        Weather: {
                          gradient: "from-sky-500/20 to-cyan-500/20",
                          icon: "🌤️",
                        },
                        PhotoFrame: {
                          gradient: "from-pink-500/20 to-rose-500/20",
                          icon: "🖼️",
                        },
                        ColorSlider: {
                          gradient: "from-fuchsia-500/20 to-cyan-500/20",
                          icon: "🎨",
                        },
                        WhiteSlider: {
                          gradient: "from-amber-500/20 to-sky-500/20",
                          icon: "🤍",
                        },
                        LightControl: {
                          gradient:
                            "from-fuchsia-500/20 via-amber-500/15 to-cyan-500/20",
                          icon: "🎛️",
                        },
                      };

                      const visual = widgetVisuals[widget.name] || {
                        gradient: "from-purple-500/20 to-pink-500/20",
                        icon: widget.icon,
                      };

                      return (
                        <button
                          key={widget.id}
                          onClick={() => void handleWidgetSelection(widget)}
                          className={`
                          relative p-6 rounded-2xl border-2 transition-all duration-300
                          overflow-hidden group
                          ${
                            isSelected
                              ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]"
                              : "bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10 hover:scale-[1.01]"
                          }
                        `}
                        >
                          {/* Background gradient */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${visual.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                          ></div>

                          {/* Content */}
                          <div className="relative">
                            {/* Icon */}
                            <div className="text-5xl mb-4 transition-transform group-hover:scale-110 duration-300">
                              {visual.icon}
                            </div>

                            {/* Title */}
                            <h4 className="font-bold text-white text-lg mb-2">
                              {widget.libelle}
                            </h4>

                            {/* Description */}
                            {widget.description && (
                              <p className="text-sm text-white/60 leading-relaxed">
                                {widget.description}
                              </p>
                            )}

                            {/* Selected indicator */}
                            {isSelected && (
                              <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Step: Config (for configurable widgets) */}
          {step === "config" && selectedWidget && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                Configure {selectedWidget.libelle}
              </h3>
              {selectedWidget.name === "ActionButton" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Action
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "off", label: "Turn OFF", icon: "❌" },
                        { value: "on", label: "Turn ON", icon: "✅" },
                        { value: "toggle", label: "Toggle", icon: "🔄" },
                      ].map((actionOption) => (
                        <button
                          key={actionOption.value}
                          onClick={() =>
                            setWidgetConfig({
                              ...widgetConfig,
                              action: actionOption.value,
                            })
                          }
                          className={`p-4 rounded-xl border-2 transition-all ${
                            widgetConfig.action === actionOption.value
                              ? "bg-purple-500/20 border-purple-500"
                              : "bg-white/5 border-white/10 hover:border-purple-500/50"
                          }`}
                        >
                          <div className="text-2xl mb-1">
                            {actionOption.icon}
                          </div>
                          <div className="text-sm font-medium text-white">
                            {actionOption.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={widgetConfig.label || ""}
                      onChange={(e) =>
                        setWidgetConfig({
                          ...widgetConfig,
                          label: e.target.value,
                        })
                      }
                      placeholder="e.g., Turn OFF All Lights"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Color
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        {
                          value: "red",
                          label: "Red",
                          gradient: "from-red-500 to-rose-500",
                        },
                        {
                          value: "green",
                          label: "Green",
                          gradient: "from-emerald-500 to-teal-500",
                        },
                        {
                          value: "blue",
                          label: "Blue",
                          gradient: "from-blue-500 to-cyan-500",
                        },
                        {
                          value: "purple",
                          label: "Purple",
                          gradient: "from-purple-500 to-pink-500",
                        },
                      ].map((colorOption) => (
                        <button
                          key={colorOption.value}
                          onClick={() =>
                            setWidgetConfig({
                              ...widgetConfig,
                              color: colorOption.value,
                            })
                          }
                          className={`p-4 rounded-xl border-2 transition-all ${
                            widgetConfig.color === colorOption.value
                              ? "border-white shadow-lg"
                              : "border-white/10 hover:border-white/50"
                          }`}
                        >
                          <div
                            className={`h-10 rounded-lg bg-gradient-to-r ${colorOption.gradient} mb-2`}
                          ></div>
                          <div className="text-xs font-medium text-white">
                            {colorOption.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-white/60 mb-3">Preview</p>
                    <div
                      className={`
                      py-4 px-6 rounded-xl bg-gradient-to-r
                      ${widgetConfig.color === "red" ? "from-red-500 to-rose-500" : ""}
                      ${widgetConfig.color === "green" ? "from-emerald-500 to-teal-500" : ""}
                      ${widgetConfig.color === "blue" ? "from-blue-500 to-cyan-500" : ""}
                      ${widgetConfig.color === "purple" ? "from-purple-500 to-pink-500" : ""}
                      text-white font-bold text-center
                    `}
                    >
                      {widgetConfig.label || "Action"}
                    </div>
                  </div>
                </div>
              )}

              {selectedWidget.name === "StateMessage" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Message pour 1
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.trueMessage || ""}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            trueMessage: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Message pour 0
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.falseMessage || ""}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            falseMessage: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Couleur pour 1
                      </label>
                      <select
                        value={widgetConfig.trueColor || "green"}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            trueColor: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="green">Green</option>
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Couleur pour 0
                      </label>
                      <select
                        value={widgetConfig.falseColor || "red"}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            falseColor: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="red">Red</option>
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="purple">Purple</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedWidget.name === "TextTicker" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Message
                    </label>
                    <textarea
                      value={widgetConfig.message || ""}
                      onChange={(e) =>
                        setWidgetConfig({
                          ...widgetConfig,
                          message: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Votre message"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Vitesse de defilement (secondes)
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={40}
                      step={1}
                      value={widgetConfig.speed || 16}
                      onChange={(e) =>
                        setWidgetConfig({
                          ...widgetConfig,
                          speed: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      {widgetConfig.speed || 16}s
                    </p>
                  </div>
                </div>
              )}

              {selectedWidget.name === "Weather" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Adresse / Ville
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={widgetConfig.address || ""}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Ex: Paris, Lyon, Marseille"
                        autoComplete="off"
                      />

                      {(weatherAutocompleteLoading ||
                        weatherSuggestions.length > 0) && (
                        <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                          {weatherAutocompleteLoading && (
                            <p className="px-3 py-2 text-xs text-white/60">
                              Recherche...
                            </p>
                          )}
                          {!weatherAutocompleteLoading &&
                            weatherSuggestions.length > 0 && (
                              <div className="max-h-52 overflow-y-auto">
                                {weatherSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() =>
                                      setWidgetConfig({
                                        ...widgetConfig,
                                        address: suggestion,
                                      })
                                    }
                                    className="w-full text-left px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      Le widget utilise cette adresse pour afficher la meteo en
                      direct.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Mode Météo
                    </label>
                    <select
                      value={widgetConfig.debugWeatherCode ?? ""}
                      onChange={(e) =>
                        setWidgetConfig({
                          ...widgetConfig,
                          debugWeatherCode: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">🔴 Météo en direct (Live)</option>
                      <option value="0">☀️ Très beau (code 0)</option>
                      <option value="1">🌤️ Beau temps (code 1)</option>
                      <option value="2">⛅ Peu nuageux (code 2)</option>
                      <option value="3">☁️ Couvert (code 3)</option>
                      <option value="45">🌫️ Brouillard (code 45)</option>
                      <option value="51">🌧️ Bruine légère (code 51)</option>
                      <option value="61">🌧️ Pluie (code 61)</option>
                      <option value="65">🌧️ Forte pluie (code 65)</option>
                      <option value="71">❄️ Neige légère (code 71)</option>
                      <option value="75">❄️ Forte neige (code 75)</option>
                      <option value="95">⛈️ Orage (code 95)</option>
                    </select>
                    <p className="text-xs text-white/50 mt-2">
                      Force une condition météo pour tester les animations (ou
                      laissez "Live" pour la vraie météo)
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={widgetConfig.extendToBackground === true}
                        onChange={(e) =>
                          setWidgetConfig({
                            ...widgetConfig,
                            extendToBackground: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-purple-500 checked:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
                      />
                      <div>
                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                          Étendre les effets météo au fond d'écran
                        </span>
                        <p className="text-xs text-white/50 mt-1">
                          Les animations météo (pluie, neige, nuages, éclairs)
                          s'afficheront en arrière-plan de tout le dashboard
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {selectedWidget.name === "Clock" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Mode d'affichage
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value: "analog",
                          label: "Ronde (Analogique)",
                          icon: "🕒",
                        },
                        {
                          value: "digital",
                          label: "Digital",
                          icon: "💻",
                        },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() =>
                            setWidgetConfig({
                              ...widgetConfig,
                              clockMode: mode.value,
                            })
                          }
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            (widgetConfig.clockMode || "analog") === mode.value
                              ? "bg-purple-500/20 border-purple-500"
                              : "bg-white/5 border-white/10 hover:border-purple-500/50"
                          }`}
                        >
                          <div className="text-2xl mb-2">{mode.icon}</div>
                          <div className="text-sm font-medium text-white">
                            {mode.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedWidget.name === "PhotoFrame" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Ajouter une URL photo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <button
                        onClick={handleAddPhotoUrl}
                        className="px-4 py-3 rounded-xl bg-purple-500/80 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Importer des photos
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => void handleUploadPhotos(e)}
                      className="w-full text-sm text-white/80 file:mr-3 file:px-4 file:py-2.5 file:rounded-lg file:border-0 file:bg-white/15 file:text-white hover:file:bg-white/25"
                    />
                    <p className="text-xs text-white/50 mt-2">
                      Les photos importées sont stockées dans la config du
                      widget côté API (base de données).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Vitesse de défilement (secondes)
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={20}
                      step={1}
                      value={widgetConfig.intervalSeconds || 6}
                      onChange={(e) =>
                        setWidgetConfig({
                          ...widgetConfig,
                          intervalSeconds: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      {widgetConfig.intervalSeconds || 6}s
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Photos (
                      {Array.isArray(widgetConfig.photos)
                        ? widgetConfig.photos.length
                        : 0}
                      )
                    </label>
                    {Array.isArray(widgetConfig.photos) &&
                    widgetConfig.photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {widgetConfig.photos.map((src: string, i: number) => (
                          <div
                            key={`${i}-${src.slice(0, 20)}`}
                            className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 h-24"
                          >
                            <img
                              src={src}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRemovePhoto(i)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/65 text-white text-xs hover:bg-black/85"
                              title="Supprimer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/55">
                        Aucune photo ajoutée.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {step !== "widget" && (
            <button
              onClick={handleBackStep}
              className="px-6 py-2.5 text-white/60 hover:text-white transition-colors"
            >
              Back
            </button>
          )}

          {/* Show Next/Add button on device step */}
          {step === "device" && selectedWidget && (
            <button
              onClick={() => void handleDeviceNext()}
              disabled={loading || selectedDevices.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 transition-all"
            >
              {loading
                ? "Adding..."
                : widgetNeedsConfig(selectedWidget)
                  ? "Next"
                  : "Add Widget"}
            </button>
          )}

          {/* Show Add Widget button on config step */}
          {step === "config" && (
            <button
              onClick={handleAddWidget}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 transition-all"
            >
              {loading ? "Adding..." : "Add Widget"}
            </button>
          )}

          {/* Show Add Widget button on widget step for widgets that don't need config */}
          {step === "widget" &&
            selectedWidget &&
            !widgetNeedsConfig(selectedWidget) &&
            !widgetNeedsDevice(selectedWidget) && (
              <button
                onClick={handleAddWidget}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 transition-all"
              >
                {loading ? "Adding..." : "Add Widget"}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

/**
 * Step indicator moderne
 */
function StepIndicator({
  active,
  completed,
  number,
  children,
}: {
  active: boolean;
  completed: boolean;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
          active
            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50"
            : completed
              ? "bg-green-500 text-white"
              : "bg-white/10 text-white/40"
        }`}
      >
        {completed && !active ? (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors ${
          active ? "text-white" : completed ? "text-green-400" : "text-white/40"
        }`}
      >
        {children}
      </span>
    </div>
  );
}
