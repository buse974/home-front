import { useState } from "react";
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

export function Section({
  dashboardWidget,
  childWidgets,
  onChildCommand,
  editMode,
}: SectionComponentProps) {
  const config = dashboardWidget.config || {};
  const color = (config.sectionColor as string) || "white";
  const bg = SECTION_COLORS[color] || SECTION_COLORS.white;
  const title = (config.title as string | null | undefined) || undefined;
  const padding = (config.padding as number) ?? 12;
  const [collapsed, setCollapsed] = useState(!!config.collapsed);

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
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden ${
            editMode ? "pointer-events-none" : ""
          }`}
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
      )}
    </div>
  );
}
