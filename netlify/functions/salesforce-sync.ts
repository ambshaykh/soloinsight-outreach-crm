// Scheduled Netlify Function — runs on the cron declared in netlify.toml
// (every 30 minutes). Refreshes each connected Salesforce org's token and
// pulls the latest campaign rollups into salesforce_campaign_stats.
//
// Requires the same SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, and
// TOKEN_ENCRYPTION_KEY environment variables as the main app — make sure
// they're set with the "Functions" scope enabled in Netlify's env var UI,
// not just "Builds".
import { syncAllConnectedOrgs } from "../../lib/salesforce/sync";

export async function handler() {
  const results = await syncAllConnectedOrgs();
  const failed = results.filter((r) => !r.result.ok);

  console.log(`Salesforce sync: ${results.length} org(s) processed, ${failed.length} failed.`);
  if (failed.length > 0) {
    console.error(
      "Salesforce sync failures:",
      failed.map((f) => ({ orgId: f.orgId, error: f.result.error }))
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: results.length, failed: failed.length }),
  };
}
