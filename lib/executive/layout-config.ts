export type WidgetId = "pipeline" | "pipeline_forecast" | "channel_mix" | "team_activity" | "salesforce_summary" | "top_priority";
export type WidgetSize = "small" | "medium" | "large";
export type LayoutItem = { id: WidgetId; size: WidgetSize };

export const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: "pipeline", size: "medium" },
  { id: "pipeline_forecast", size: "medium" },
  { id: "channel_mix", size: "small" },
  { id: "team_activity", size: "large" },
  { id: "top_priority", size: "medium" },
  { id: "salesforce_summary", size: "large" },
];
