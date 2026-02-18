import { useState, useRef } from "react";
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

const SECTION_COLORS_SOLID: Record<string, string> = {
  blue: "rgba(59, 130, 246, 0.35)",
  emerald: "rgba(52, 211, 153, 0.35)",
  violet: "rgba(139, 92, 246, 0.35)",
  rose: "rgba(244, 63, 94, 0.35)",
  amber: "rgba(245, 158, 11, 0.35)",
  cyan: "rgba(6, 182, 212, 0.35)",
  white: "rgba(255, 255, 255, 0.15)",
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
  onRemoveChild?: (childId: string) => void;
  padding: number;
}) {
  const dragItemRef = useRef<string | null>(null);
  const droppedInsideRef = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (childId: string) => {
    dragItemRef.current = childId;
  };

  const handleDragOver = (e: React.DragEvent, childId: string) => {
    e.preventDefault();
    if (dragItemRef.current && dragItemRef.current !== childId) {
      setDragOverId(childId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    droppedInsideRef.current = true;
    setDragOverId(null);
    const sourceId = dragItemRef.current;
    dragItemRef.current = null;
    if (!sourceId || sourceId === targetId || !onReorderChildren) return;

    const ids = childWidgets.map((c) => c.id);
    const sourceIdx = ids.indexOf(sourceId);
    const targetIdx = ids.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newIds = [...ids];
    newIds.splice(sourceIdx, 1);
    newIds.splice(targetIdx, 0, sourceId);
    onReorderChildren(newIds);
  };

  const handleDragEnd = (e: React.DragEvent, childId: string) => {
    const sourceId = dragItemRef.current || childId;
    const droppedInside = droppedInsideRef.current;
    droppedInsideRef.current = false;
    dragItemRef.current = null;
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
      onRemoveChild(sourceId);
    }
  };

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
        {childWidgets.map((child) => {
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
  const bgSolid = SECTION_COLORS_SOLID[color] || SECTION_COLORS_SOLID.white;
  const title = (config.title as string | null | undefined) || undefined;
  const padding = (config.padding as number) ?? 12;
  const foldable = !!config.foldable;
  const [collapsed, setCollapsed] = useState(!!config.collapsed);
  const [expanded, setExpanded] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);

  // Mode dossier : compact (2x1) avec overlay au clic
  if (foldable && !editMode) {
    return (
      <>
        <div
          className="section-zone h-full w-full rounded-2xl flex items-center justify-between px-3 gap-2 cursor-pointer select-none hover:brightness-125 transition-all duration-300"
          style={{ backgroundColor: bgSolid }}
          onClick={() => setExpanded(true)}
        >
          <span className="text-sm font-medium text-white/90 truncate">
            {title || "Section"}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {childWidgets.length > 0 && (
              <span className="text-xs text-white/50">
                {childWidgets.length}
              </span>
            )}
            <svg
              className="w-4 h-4 text-white/60"
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

        {expanded &&
          createPortal(
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
              onClick={() => setExpanded(false)}
            >
              <div
                className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-white/15 bg-black/60 backdrop-blur-xl"
                style={{ backgroundColor: bgSolid }}
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
            document.body,
          )}
      </>
    );
  }

  // Mode normal (inline)
  return (
    <div
      className="section-zone h-full w-full rounded-2xl flex flex-col overflow-hidden transition-all duration-500"
      style={{ backgroundColor: bg }}
    >
      {/* Barre titre */}
      {title && (
        <div
          className={`flex items-center justify-between px-3 py-2 select-none shrink-0 ${
            !editMode ? "cursor-pointer hover:bg-white/5 transition-colors" : ""
          }`}
          onClick={!editMode ? () => setCollapsed((c) => !c) : undefined}
        >
          <span className="text-sm font-medium text-white/80 truncate">
            {title}
          </span>
          {!editMode && (
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
