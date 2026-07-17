"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { GripVertical, TrendingUp, Users2, Star, Cloud, LineChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveExecutiveDashboardLayout } from "@/app/actions/executive";
import { type LayoutItem, type WidgetId, type WidgetSize } from "@/lib/executive/layout-config";
import { PipelineWidget } from "@/components/executive/widgets/pipeline-widget";
import { PipelineForecastWidget } from "@/components/executive/widgets/pipeline-forecast-widget";
import { TeamActivityWidget } from "@/components/executive/widgets/team-activity-widget";
import { TopPriorityWidget } from "@/components/executive/widgets/top-priority-widget";
import { SalesforceSummaryWidget } from "@/components/executive/widgets/salesforce-summary-widget";

const WIDGET_META: Record<WidgetId, { title: string; icon: typeof TrendingUp }> = {
  pipeline: { title: "Pipeline by status", icon: TrendingUp },
  pipeline_forecast: { title: "Pipeline forecast", icon: LineChart },
  team_activity: { title: "Team activity (60 days)", icon: Users2 },
  top_priority: { title: "Top priority", icon: Star },
  salesforce_summary: { title: "Salesforce summary", icon: Cloud },
};

const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: "sm:col-span-1",
  medium: "sm:col-span-2",
  large: "sm:col-span-3",
};

type DashboardData = {
  pipeline: { status: string; count: number }[];
  pipelineByWeek: { week: string; new: number; engaged: number; closed: number }[];
  teamActivity: any[];
  topPriority: { accounts: any[]; contacts: any[] };
  salesforceSummary: { totalLeads: number; campaignsSynced: number; totalResponses: number };
  kpis?: Record<string, any>;
  activityTrend?: { value: number }[];
  topReps?: any[];
};

export function DashboardGrid({
  initialLayout,
  data,
  canEdit,
}: {
  initialLayout: LayoutItem[];
  data: DashboardData;
  canEdit: boolean;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);
  const [, startTransition] = useTransition();

  function persist(next: LayoutItem[]) {
    setLayout(next);
    startTransition(async () => {
      const res = await saveExecutiveDashboardLayout(next);
      if (res.error) toast.error(res.error);
    });
  }

  function handleDrop(targetId: WidgetId) {
    if (!draggingId || draggingId === targetId) {
      setDragOverId(null);
      return;
    }
    const fromIndex = layout.findIndex((w) => w.id === draggingId);
    const toIndex = layout.findIndex((w) => w.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...layout];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist(next);
    setDraggingId(null);
    setDragOverId(null);
  }

  function handleResize(id: WidgetId, size: WidgetSize) {
    persist(layout.map((w) => (w.id === id ? { ...w, size } : w)));
  }

  function renderWidgetBody(id: WidgetId) {
    switch (id) {
      case "pipeline": return <PipelineWidget data={data.pipeline} />;
      case "pipeline_forecast": return <PipelineForecastWidget data={data.pipelineByWeek} />;
      case "team_activity": return <TeamActivityWidget data={data.teamActivity} />;
      case "top_priority": return <TopPriorityWidget data={data.topPriority} />;
      case "salesforce_summary": return <SalesforceSummaryWidget data={data.salesforceSummary} />;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {layout.map((item) => {
        const meta = WIDGET_META[item.id];
        const Icon = meta.icon;
        return (
          <Card
            key={item.id}
            onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOverId(item.id); } }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => canEdit && handleDrop(item.id)}
            className={cn(
              SIZE_CLASSES[item.size],
              "transition-all duration-150",
              dragOverId === item.id && "ring-2 ring-primary/30",
              draggingId === item.id && "opacity-40"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {canEdit && (
                  <span
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}
                <Icon className="h-4 w-4 text-primary" />
                {meta.title}
              </CardTitle>
              {canEdit && (
                <select
                  value={item.size}
                  onChange={(e) => handleResize(item.id, e.target.value as WidgetSize)}
                  className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-[11px]"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              )}
            </CardHeader>
            <CardContent>{renderWidgetBody(item.id)}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
