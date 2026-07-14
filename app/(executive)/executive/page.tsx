import { hasPermission } from "@/lib/auth/permissions";
import { getExecutiveDashboardLayout, getExecutiveDashboardData } from "@/app/actions/executive";
import { DashboardGrid } from "@/components/executive/dashboard-grid";

export default async function ExecutivePortalHome() {
  const canEdit = await hasPermission("executive_dashboard.edit_layout");
  const [layout, data] = await Promise.all([getExecutiveDashboardLayout(), getExecutiveDashboardData()]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F1419]">Executive Dashboard</h1>
        <p className="text-sm text-[#6B7280]">
          {canEdit
            ? "Drag the grip handle to reorder widgets, or use the size dropdown to resize them — your layout saves automatically."
            : "A leadership rollup of pipeline, team activity, and Salesforce campaign data."}
        </p>
      </div>
      <DashboardGrid initialLayout={layout} data={data} canEdit={canEdit} />
    </div>
  );
}
