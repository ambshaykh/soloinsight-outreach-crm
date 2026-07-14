export type WidgetId = "pipeline" | "team_activity" | "salesforce_summary" | "top_priority";
export type WidgetSize = "small" | "medium" | "large";
export type LayoutItem = { id: WidgetId; size: WidgetSize };

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: "pipeline", size: "medium" },
  { id: "team_activity", size: "medium" },
  { id: "top_priority", size: "medium" },
  { id: "salesforce_summary", size: "large" },
];
