import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { getWidgetComponent } from "../modules/WidgetRegistry";
import { Responsive, WidthProvider, type Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type {
  Dashboard as DashboardType,
  GenericDevice,
  Widget,
} from "../types";

const ResponsiveGridLayout = WidthProvider(Responsive);

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
  const [deletingWidget, setDeletingWidget] = useState(false);
  const [dashboardNameDraft, setDashboardNameDraft] = useState("");
  const [savingDashboardName, setSavingDashboardName] = useState(false);
  const [widgetNameDrafts, setWidgetNameDrafts] = useState<
    Record<string, string>
  >({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastDashboardNavAt = useRef(0);
  const currentDashboardIndex = dashboard
    ? dashboards.findIndex((d) => d.id === dashboard.id)
    : -1;

  useEffect(() => {
    loadDashboard();
  }, [searchParams]);

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
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (editMode || showAddModal || widgetToDelete) return;
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

  const handleWheelNavigation = (event: React.WheelEvent<HTMLDivElement>) => {
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

  const handleLayoutChange = async (layouts: any) => {
    if (!editMode || !dashboard) return;
    try {
      await api.updateDashboardLayouts(dashboard.id, layouts);
    } catch (error) {
      console.error("Failed to update dashboard layouts:", error);
    }
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

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheelNavigation}
    >
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
      `}</style>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen p-6 md:p-8 lg:p-12 flex flex-col">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <svg
                    className="w-6 h-6 text-white"
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
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={dashboardNameDraft}
                      onChange={(e) => setDashboardNameDraft(e.target.value)}
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
                      <span className="text-xs text-white/60">Saving...</span>
                    )}
                  </div>
                ) : (
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    {dashboard.name}
                  </h1>
                )}
              </div>
              <p className="text-white/60 ml-[52px] font-light">
                Control your connected devices
              </p>
              {dashboards.length > 1 && currentDashboardIndex >= 0 && (
                <div className="ml-[52px] mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/75">
                  <span>
                    Dashboard {currentDashboardIndex + 1}/{dashboards.length}
                  </span>
                  <span className="text-white/40">•</span>
                  <span>Swipe gauche/droite</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {dashboards.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToDashboardBySwipe("prev")}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/10 hover:border-white/20"
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
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/10 hover:border-white/20"
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
                className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
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
                  className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-medium text-white shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 overflow-hidden"
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
            </div>
          </div>
        </header>

        {/* Widgets Grid */}
        <main className="flex-1 flex items-center">
          {!dashboard.DashboardWidgets ||
          dashboard.DashboardWidgets.length === 0 ? (
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
          ) : (
            <div className="w-full">
              <ResponsiveGridLayout
                className="layout"
                layouts={
                  dashboard.layouts || {
                    lg: dashboard.DashboardWidgets.map((dw) => ({
                      i: dw.id,
                      x: dw.position?.x || 0,
                      y: dw.position?.y || 0,
                      w: dw.position?.w || 3,
                      h: dw.position?.h || 2,
                    })),
                  }
                }
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={120}
                isDraggable={editMode}
                isResizable={editMode}
                draggableCancel=".delete-button,.rename-widget-input,.rename-dashboard-input"
                onLayoutChange={(_, layouts: Layouts) =>
                  handleLayoutChange(layouts)
                }
                compactType={null}
                preventCollision={true}
                resizeHandles={["se"]}
              >
                {dashboard.DashboardWidgets.map((dashboardWidget) => {
                  const WidgetComponent = getWidgetComponent(
                    dashboardWidget.Widget?.component || "",
                  );

                  if (!WidgetComponent) {
                    return (
                      <div
                        key={dashboardWidget.id}
                        className="p-6 bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20"
                      >
                        <p className="text-red-400">
                          Unknown widget: {dashboardWidget.Widget?.component}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={dashboardWidget.id}
                      className="relative h-full w-full"
                    >
                      <div className="h-full w-full">
                        <WidgetComponent
                          dashboardWidget={dashboardWidget}
                          onCommand={(capability, params, deviceId) =>
                            handleExecuteCommand(
                              deviceId ||
                                dashboardWidget.GenericDevices?.[0]?.id ||
                                "",
                              capability,
                              params,
                            )
                          }
                        />
                      </div>

                      {editMode && (
                        <div className="absolute top-2 left-2 z-[101] flex items-center gap-2">
                          <input
                            value={widgetNameDrafts[dashboardWidget.id] || ""}
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
                        </div>
                      )}

                      {/* Bouton supprimer - HORS de l'overlay pour éviter les conflits */}
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

                      {/* Overlay en mode édition pour bloquer les clics */}
                      {editMode && (
                        <div className="absolute inset-0 cursor-move bg-purple-500/10 border-2 border-purple-500/50 rounded-2xl pointer-events-none">
                          {/* Poignée de redimensionnement */}
                          <div className="absolute bottom-0 right-0 w-6 h-6 bg-purple-500 rounded-tl-lg rounded-br-xl pointer-events-auto cursor-se-resize flex items-center justify-center">
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
  const [step, setStep] = useState<"device" | "widget" | "config">("device");
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

  useEffect(() => {
    loadAllDevices();
  }, []);

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
      setStep("widget");
    } catch (error) {
      console.error("Failed to load widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetSelection = (widget: Widget) => {
    setSelectedWidget(widget);

    // Si le widget nécessite une configuration, aller au step config
    if (widget.name === "ActionButton") {
      // Initialiser la config avec les valeurs par défaut
      setWidgetConfig({
        action: "off",
        label: "Turn OFF",
        color: "red",
      });
      setStep("config");
      return;
    }

    if (widget.name === "StateMessage") {
      setWidgetConfig({
        trueMessage: "Allume",
        falseMessage: "Eteint",
        trueColor: "green",
        falseColor: "red",
      });
      setStep("config");
      return;
    }

    if (widget.name === "TextTicker") {
      setWidgetConfig({
        message: "Bienvenue dans votre dashboard",
        speed: 16,
      });
      setStep("config");
      return;
    }

    // Sinon, le widget est prêt à être créé (config vide)
    setWidgetConfig({});
  };

  const handleAddWidget = async () => {
    if (selectedDevices.length === 0 || !selectedWidget) return;

    setLoading(true);
    try {
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
      const genericDeviceIds = createdDevices.map((result) => result.device.id);

      await api.addWidget(dashboardId, {
        widgetId: selectedWidget.id,
        genericDeviceIds: genericDeviceIds,
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
              active={step === "device"}
              completed={selectedDevices.length > 0}
              number="1"
            >
              Device{selectedDevices.length > 1 ? "s" : ""}
            </StepIndicator>
            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
            <StepIndicator
              active={step === "widget"}
              completed={!!selectedWidget}
              number="2"
            >
              Widget
            </StepIndicator>
            {(selectedWidget?.name === "ActionButton" ||
              selectedWidget?.name === "StateMessage" ||
              selectedWidget?.name === "TextTicker") && (
              <>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
                <StepIndicator
                  active={step === "config"}
                  completed={false}
                  number="3"
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
                  {selectedDevices.length > 0 && (
                    <button
                      onClick={loadWidgets}
                      className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/50 transition-all"
                    >
                      Next ({selectedDevices.length} device
                      {selectedDevices.length > 1 ? "s" : ""} selected)
                    </button>
                  )}
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
                      };

                      const visual = widgetVisuals[widget.name] || {
                        gradient: "from-purple-500/20 to-pink-500/20",
                        icon: widget.icon,
                      };

                      return (
                        <button
                          key={widget.id}
                          onClick={() => handleWidgetSelection(widget)}
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
            selectedWidget.name !== "ActionButton" &&
            selectedWidget.name !== "StateMessage" &&
            selectedWidget.name !== "TextTicker" && (
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
