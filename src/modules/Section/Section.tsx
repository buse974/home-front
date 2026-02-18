import { useState } from "react";
import { createPortal } from "react-dom";
import type { SectionComponentProps } from "../../types";
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
  childWidgets: SectionComponentProps["childWidgets"];
  onChildCommand: SectionComponentProps["onChildCommand"];
  padding: number;
}) {
  return (
    <div
      className="h-full overflow-y-auto overflow-x-hidden"
      style={{ padding }}
      data-no-dashboard-swipe=""
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

export function Section({
  dashboardWidget,
  childWidgets,
  onChildCommand,
  editMode,
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

  // Mode dossier : compact (2x1) avec overlay au clic
  if (foldable && !editMode) {
    return (
      <>
        {/* Dossier compact dans la grille */}
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

        {/* Overlay déplié par-dessus tout (portal pour sortir du grid item) */}
        {expanded &&
          createPortal(
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
              onClick={() => setExpanded(false)}
            >
              {/* Panel - stop propagation pour ne pas fermer au clic dedans */}
              <div
                className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-white/15 bg-black/60 backdrop-blur-xl"
                style={{ backgroundColor: bgSolid }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
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
                {/* Children */}
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
      {/* Barre titre (cliquable pour collapse, sauf en edit mode) */}
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

      {/* Contenu avec les widgets enfants */}
      {!collapsed && childWidgets.length > 0 && (
        <div className={`flex-1 min-h-0 ${editMode ? "pointer-events-none" : ""}`}>
          <ChildrenGrid
            childWidgets={childWidgets}
            onChildCommand={onChildCommand}
            padding={padding}
          />
        </div>
      )}
    </div>
  );
}
