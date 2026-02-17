import type { WidgetComponentProps } from "../../types";

const SECTION_COLORS: Record<string, string> = {
  blue: "rgba(59, 130, 246, 0.18)",
  emerald: "rgba(52, 211, 153, 0.18)",
  violet: "rgba(139, 92, 246, 0.18)",
  rose: "rgba(244, 63, 94, 0.18)",
  amber: "rgba(245, 158, 11, 0.18)",
  cyan: "rgba(6, 182, 212, 0.18)",
  white: "rgba(255, 255, 255, 0.10)",
};

export function Section({ dashboardWidget }: WidgetComponentProps) {
  const config = dashboardWidget.config || {};
  const color = (config.sectionColor as string) || "white";
  const bg = SECTION_COLORS[color] || SECTION_COLORS.white;

  return (
    <div
      className="section-zone h-full w-full rounded-2xl transition-all duration-500"
      style={{
        backgroundColor: bg,
        margin: "-5px",
        width: "calc(100% + 10px)",
        height: "calc(100% + 10px)",
      }}
    />
  );
}
