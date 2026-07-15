export type ReportKey = "pipeline_export" | "team_activity_export" | "salesforce_campaign_export" | "contacts_export";

export const REPORT_CATALOG: { key: ReportKey; label: string; description: string; domain: string; source: string }[] = [
  {
    key: "pipeline_export", label: "Pipeline export", domain: "Accounts",
    description: "Every account with status, priority, ICP score, owner, and follow-up dates.",
    source: "Accounts workspace",
  },
  {
    key: "team_activity_export", label: "Team activity summary", domain: "Team",
    description: "Per-rep emails, calls, LinkedIn touches, meetings, and totals over the last 60 days.",
    source: "Analytics",
  },
  {
    key: "salesforce_campaign_export", label: "Salesforce campaign stats", domain: "Salesforce",
    description: "Synced campaign rollups across every connected org: leads uploaded and responses.",
    source: "Salesforce portal",
  },
  {
    key: "contacts_export", label: "Contacts export", domain: "Contacts",
    description: "Every contact with status, priority, account, and last-touch dates.",
    source: "Contacts workspace",
  },
];
