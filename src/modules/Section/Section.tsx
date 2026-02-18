import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { SectionComponentProps, DashboardWidget } from "../../types";
import { getWidgetComponent } from "../WidgetRegistry";

const SECTION_COLORS: Record<string, string> = {
  blue: "rgba(59, 130, 246, 0.18)",
  emerald: "rgba(52, 211, 153, 0.18)",
  violet: "rgba(139, 92, 246, 0.18)",
  rose: "rgba(244, 63, 94, 0.18)",
  amber: "rgba(245, 158, 11, 0.18)",
  cyan: "rgba(6, 182, 212, 0.18)",
  white: "rgba(255, 255, 255, 0.10)",
};

const SECTION_GRADIENT: Record<string, [string, string]> = {
  blue: ["rgba(59,130,246,0.50)", "rgba(99,102,241,0.30)"],
  emerald: ["rgba(52,211,153,0.50)", "rgba(16,185,129,0.30)"],
  violet: ["rgba(139,92,246,0.50)", "rgba(168,85,247,0.30)"],
  rose: ["rgba(244,63,94,0.50)", "rgba(236,72,153,0.30)"],
  amber: ["rgba(245,158,11,0.50)", "rgba(251,191,36,0.30)"],
  cyan: ["rgba(6,182,212,0.50)", "rgba(34,211,238,0.30)"],
  white: ["rgba(255,255,255,0.20)", "rgba(200,200,220,0.12)"],
};

const WIDGET_ICONS: Record<string, string> = {
  Switch: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  SwitchToggle: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  ActionButton: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
  SwitchNeon: "M13 10V3L4 14h7v7l9-11h-7z",
  Sensor: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  StateMessage: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  RawState: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  TextTicker: "M4 6h16M4 12h16M4 18h7",
  Clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  Weather: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
  PhotoFrame: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ColorSlider: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  WhiteSlider: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  LightControl: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
};

function ChildrenGrid({
  childWidgets,
  onChildCommand,
  padding,
}: {
  childWidgets: DashboardWidget[];
  onChildCommand: SectionComponentProps["onChildCommand"];
  padding: number;
}) {
  return (
    <div
      className="h-full overflow-y-auto overflow-x-hidden section-children-dnd"
      style={{ padding }}
      data-no-dashboard-swipe=""
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-2 auto-rows-[120px]">
        {childWidgets.map((child) => {
          const ChildComponent = getWidgetComponent(
            child.Widget?.component || "",
          );
          if (!ChildComponent) return null;

          const colSpan = Math.min(child.position?.w || 1, 2);
          const rowSpan = child.position?.h || 1;

          return (
            <div
              key={child.id}
              className="min-h-0"
              style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
              }}
            >
              <ChildComponent
                dashboardWidget={child}
                onCommand={(capability, params, deviceId) =>
                  onChildCommand(child.id, capability, params, deviceId)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditChildrenGrid({
  childWidgets,
  onReorderChildren,
  onRemoveChild,
  padding,
}: {
  childWidgets: DashboardWidget[];
  onReorderChildren?: (newChildIds: string[]) => void;
  onRemoveChild?: (
    childId: string,
    dropPoint?: { clientX: number; clientY: number },
  ) => void;
  padding: number;
}) {
  const dragItemRef = useRef<string | null>(null);
  const droppedInsideRef = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reorderIds = (
    ids: string[],
    sourceId: string,
    targetId: string,
  ): string[] => {
    const sourceIdx = ids.indexOf(sourceId);
    const targetIdx = ids.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) {
      return ids;
    }
    const next = [...ids];
    next.splice(sourceIdx, 1);
    next.splice(targetIdx, 0, sourceId);
    return next;
  };

  const handleDragStart = (childId: string) => {
    dragItemRef.current = childId;
    droppedInsideRef.current = false;
    setDragSourceId(childId);
  };

  const handleDragOver = (e: React.DragEvent, childId: string) => {
    e.preventDefault();
    const sourceId = dragItemRef.current;
    if (!sourceId || sourceId === childId) return;
    setDragOverId(childId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    droppedInsideRef.current = true;
    setDragOverId(null);
    const sourceId = dragItemRef.current;
    dragItemRef.current = null;
    setDragSourceId(null);
    if (!sourceId || !onReorderChildren) return;

    const currentIds = childWidgets.map((c) => c.id);
    const reordered = reorderIds(currentIds, sourceId, targetId);
    if (reordered.join("|") !== currentIds.join("|")) onReorderChildren(reordered);
  };

  const handleDragEnd = (e: React.DragEvent, childId: string) => {
    const sourceId = dragItemRef.current || childId;
    const droppedInside = droppedInsideRef.current;
    droppedInsideRef.current = false;
    dragItemRef.current = null;
    setDragSourceId(null);
    setDragOverId(null);

    if (droppedInside || !onRemoveChild) return;

    // Drop released outside this section children grid -> eject to dashboard.
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const droppedInThisSection = !!(
      target &&
      gridContainerRef.current &&
      gridContainerRef.current.contains(target)
    );

    if (!droppedInThisSection) {
      onRemoveChild(sourceId, { clientX: e.clientX, clientY: e.clientY });
      return;
    }
  };

  const childrenById = new Map(childWidgets.map((child) => [child.id, child]));
  const sourceChild =
    dragSourceId != null ? childrenById.get(dragSourceId) || null : null;

  const renderOrderIds = (() => {
    const ids = childWidgets.map((c) => c.id);
    if (!dragSourceId || !dragOverId || dragSourceId === dragOverId) return ids;
    const sourceIdx = ids.indexOf(dragSourceId);
    const targetIdx = ids.indexOf(dragOverId);
    if (sourceIdx === -1 || targetIdx === -1) return ids;
    const withoutSource = ids.filter((id) => id !== dragSourceId);
    const insertAt = withoutSource.indexOf(dragOverId);
    if (insertAt === -1) return ids;
    withoutSource.splice(insertAt, 0, "__section_drag_placeholder__");
    return withoutSource;
  })();

  return (
    <div
      ref={gridContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden section-children-dnd"
      style={{ padding }}
      data-no-dashboard-swipe=""
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-2 auto-rows-[120px]">
        {renderOrderIds.map((id) => {
          if (id === "__section_drag_placeholder__" && sourceChild) {
            const placeholderColSpan = Math.min(sourceChild.position?.w || 1, 2);
            const placeholderRowSpan = sourceChild.position?.h || 1;
            return (
              <div
                key="__section_drag_placeholder__"
                className="min-h-0 rounded-lg border-2 border-dashed border-cyan-300/70 bg-cyan-400/10"
                style={{
                  gridColumn: `span ${placeholderColSpan}`,
                  gridRow: `span ${placeholderRowSpan}`,
                }}
              />
            );
          }

          const child = childrenById.get(id);
          if (!child) return null;

          const ChildComponent = getWidgetComponent(
            child.Widget?.component || "",
          );
          if (!ChildComponent) return null;

          const colSpan = Math.min(child.position?.w || 1, 2);
          const rowSpan = child.position?.h || 1;
          const isDragOver = dragOverId === child.id;

          return (
            <div
              key={child.id}
              className={`min-h-0 relative group rounded-lg transition-all section-child-dropzone ${
                isDragOver ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-transparent" : ""
              }`}
              style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
              }}
              draggable
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onDragStart={() => handleDragStart(child.id)}
              onDragOver={(e) => handleDragOver(e, child.id)}
              onDrop={(e) => handleDrop(e, child.id)}
              onDragEnd={(e) => handleDragEnd(e, child.id)}
            >
              <div className="h-full w-full pointer-events-none">
                <ChildComponent
                  dashboardWidget={child}
                  onCommand={async () => {}}
                />
              </div>
              {/* Drag handle + eject button overlay */}
              <div className="absolute inset-0 rounded-lg bg-white/5 border border-dashed border-white/20 cursor-grab active:cursor-grabbing">
                {/* Eject button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemoveChild?.(child.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Sortir de la section"
                >
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
                {/* Widget name */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-white/70 truncate max-w-[80%]">
                  {child.name || child.Widget?.libelle || "Widget"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddChildPicker({
  freeWidgets,
  onAddChild,
  onClose,
}: {
  freeWidgets: DashboardWidget[];
  onAddChild: (widgetId: string) => void;
  onClose: () => void;
}) {
  if (freeWidgets.length === 0) {
    return (
      <div className="p-3 text-center text-white/40 text-xs">
        Aucun widget libre disponible
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
      {freeWidgets.map((w) => (
        <button
          key={w.id}
          onClick={() => {
            onAddChild(w.id);
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors truncate"
        >
          {w.name || w.GenericDevices?.map((d) => d.name).join(", ") || w.Widget?.libelle || "Widget"}
        </button>
      ))}
    </div>
  );
}

export function Section({
  dashboardWidget,
  childWidgets,
  onChildCommand,
  editMode,
  freeWidgets,
  onReorderChildren,
  onRemoveChild,
  onAddChild,
}: SectionComponentProps) {
  const config = dashboardWidget.config || {};
  const color = (config.sectionColor as string) || "white";
  const bg = SECTION_COLORS[color] || SECTION_COLORS.white;
  const title = (config.title as string | null | undefined) || undefined;
  const padding = (config.padding as number) ?? 12;
  const foldable = !!config.foldable;
  const [collapsed, setCollapsed] = useState(!!config.collapsed);
  const [expanded, setExpanded] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);
  const portalTarget = document.fullscreenElement || document.body;

  useEffect(() => {
    if (!foldable && collapsed) {
      setCollapsed(false);
    }
  }, [foldable, collapsed]);

  const parseExternalWidgetId = (e: React.DragEvent): string | null => {
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw || !raw.startsWith("dashboard-widget:")) return null;
    return raw.replace("dashboard-widget:", "");
  };

  const canAcceptExternalWidget = (widgetId: string): boolean => {
    return !!(onAddChild && freeWidgets?.some((w) => w.id === widgetId));
  };

  // Mode dossier : compact (2x1) avec overlay au clic
  const gradient = SECTION_GRADIENT[color] || SECTION_GRADIENT.white;

  if (foldable && !editMode) {
    const previewWidgets = childWidgets.slice(0, 5);
    const extraCount = childWidgets.length - previewWidgets.length;

    return (
      <>
        <div
          className="section-zone group/folder h-full w-full rounded-2xl cursor-pointer select-none overflow-hidden relative"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          }}
          onClick={() => setExpanded(true)}
        >
          {/* Animated shimmer overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover/folder:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)`,
              backgroundSize: "200% 100%",
              animation: "section-shimmer 1.5s ease-in-out infinite",
            }}
          />

          {/* Glass border */}
          <div className="absolute inset-0 rounded-2xl border border-white/15 group-hover/folder:border-white/30 transition-colors duration-300" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-3">
            {/* Top: title */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/90 truncate">
                {title || "Section"}
              </span>
            </div>

            {/* Bottom: widget mini-previews */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {previewWidgets.map((child) => {
                  const comp = child.Widget?.component || "";
                  const iconPath = WIDGET_ICONS[comp];
                  return (
                    <div
                      key={child.id}
                      className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0"
                    >
                      {iconPath ? (
                        <svg
                          className="w-3.5 h-3.5 text-white/70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={iconPath} />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                      )}
                    </div>
                  );
                })}
                {extraCount > 0 && (
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-white/50">
                      +{extraCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Expand indicator */}
              <div className="w-7 h-7 rounded-lg bg-white/10 group-hover/folder:bg-white/20 flex items-center justify-center transition-all duration-300 group-hover/folder:scale-110">
                <svg
                  className="w-3.5 h-3.5 text-white/60 group-hover/folder:text-white/90 transition-colors duration-300"
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
          </div>
        </div>

        {expanded &&
          createPortal(
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
              onClick={() => setExpanded(false)}
            >
              <div
                className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-white/10 bg-[rgba(15,15,20,0.85)] backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10">
                  <span className="text-base font-semibold text-white/90">
                    {title || "Section"}
                  </span>
                  <button
                    onClick={() => setExpanded(false)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-white/70"
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
                {childWidgets.length > 0 ? (
                  <ChildrenGrid
                    childWidgets={childWidgets}
                    onChildCommand={onChildCommand}
                    padding={padding}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-white/40 text-sm">Aucun widget</p>
                  </div>
                )}
              </div>
            </div>,
            portalTarget,
          )}
      </>
    );
  }

  // Mode normal (inline)
  return (
    <div
      data-section-drop-id={dashboardWidget.id}
      className={`section-zone h-full w-full rounded-2xl flex flex-col overflow-hidden transition-all duration-500 ${
        editMode && isExternalDragOver ? "ring-2 ring-cyan-300/80 ring-offset-2 ring-offset-transparent" : ""
      }`}
      style={{ backgroundColor: bg }}
      onDragOver={(e) => {
        if (!editMode || !onAddChild) return;
        const widgetId = parseExternalWidgetId(e);
        if (!widgetId || !canAcceptExternalWidget(widgetId)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsExternalDragOver(true);
      }}
      onDragLeave={() => {
        if (isExternalDragOver) setIsExternalDragOver(false);
      }}
      onDrop={(e) => {
        if (!editMode || !onAddChild) return;
        e.preventDefault();
        const widgetId = parseExternalWidgetId(e);
        setIsExternalDragOver(false);
        if (!widgetId || !canAcceptExternalWidget(widgetId)) return;
        onAddChild(widgetId);
      }}
    >
      {/* Barre titre */}
      {title && (
        <div
          className={`flex items-center justify-between px-3 py-2 select-none shrink-0 ${
            !editMode && foldable
              ? "cursor-pointer hover:bg-white/5 transition-colors"
              : ""
          }`}
          onClick={
            !editMode && foldable ? () => setCollapsed((c) => !c) : undefined
          }
        >
          <span className="text-sm font-medium text-white/80 truncate">
            {title}
          </span>
          {!editMode && foldable && (
            <svg
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      )}

      {/* Contenu */}
      {!collapsed && (
        <div className="flex-1 min-h-0">
          {editMode ? (
            <>
              {childWidgets.length > 0 && (
                <EditChildrenGrid
                  childWidgets={childWidgets}
                  onReorderChildren={onReorderChildren}
                  onRemoveChild={onRemoveChild}
                  padding={padding}
                />
              )}
              {/* Bouton ajouter un widget */}
              <div className="relative px-2 pb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowAddPicker((v) => !v);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="widget-style-button w-full py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 border border-dashed border-white/20 hover:border-white/40 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
                {showAddPicker && onAddChild && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl bg-slate-900/95 border border-white/15 shadow-xl z-[150]">
                    <AddChildPicker
                      freeWidgets={freeWidgets || []}
                      onAddChild={onAddChild}
                      onClose={() => setShowAddPicker(false)}
                    />
                  </div>
                )}
                {isExternalDragOver && (
                  <div className="mt-2 rounded-lg border border-cyan-300/60 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-100 text-center">
                    Relache ici pour ajouter a la section
                  </div>
                )}
              </div>
            </>
          ) : (
            childWidgets.length > 0 && (
              <ChildrenGrid
                childWidgets={childWidgets}
                onChildCommand={onChildCommand}
                padding={padding}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
