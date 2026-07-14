import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { refreshAccessToken } from "@/lib/salesforce/oauth";
import { fetchCampaignSummaries, verifyConnection } from "@/lib/salesforce/api";

/**
 * Core sync routine for a single connected org: refreshes the access token,
 * pulls campaign rollups, and upserts them. Used by both the manual
 * "Sync now" server action and the scheduled Netlify function, so there's
 * exactly one place that talks to Salesforce's API for syncing.
 */
export async function syncSalesforceOrg(orgId: string): Promise<{ ok: boolean; error?: string; campaignsSynced?: number }> {
  const admin = createAdminClient();
  const { data: org, error: fetchError } = await admin
    .from("salesforce_orgs")
    .select("*")
    .eq("id", orgId)
    .single();

  if (fetchError || !org) return { ok: false, error: "Org not found." };
  if (!org.consumer_key || !org.consumer_secret_encrypted || !org.refresh_token_encrypted) {
    return { ok: false, error: "This org isn't connected yet — click Connect first." };
  }

  try {
    const consumerSecret = decryptSecret(org.consumer_secret_encrypted);
    const refreshToken = decryptSecret(org.refresh_token_encrypted);

    const refreshed = await refreshAccessToken({
      consumerKey: org.consumer_key,
      consumerSecret,
      refreshToken,
    });

    await verifyConnection(refreshed.instance_url, refreshed.access_token);
    const campaigns = await fetchCampaignSummaries(refreshed.instance_url, refreshed.access_token);

    if (campaigns.length > 0) {
      const rows = campaigns.map((c) => ({
        org_id: orgId,
        sf_campaign_id: c.Id,
        campaign_name: c.Name,
        campaign_status: c.Status,
        start_date: c.StartDate,
        leads_uploaded: (c.NumberOfLeads ?? 0) + (c.NumberOfContacts ?? 0),
        responded_count: c.NumberOfResponses ?? 0,
        synced_at: new Date().toISOString(),
      }));
      const { error: upsertError } = await admin
        .from("salesforce_campaign_stats")
        .upsert(rows, { onConflict: "org_id,sf_campaign_id" });
      if (upsertError) throw new Error(`Storing campaign stats failed: ${upsertError.message}`);
    }

    await admin
      .from("salesforce_orgs")
      .update({
        instance_url: refreshed.instance_url,
        access_token_encrypted: encryptSecret(refreshed.access_token),
        status: "connected",
        last_synced_at: new Date().toISOString(),
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId);

    return { ok: true, campaignsSynced: campaigns.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown sync error.";
    await admin
      .from("salesforce_orgs")
      .update({ status: "error", last_sync_error: message, updated_at: new Date().toISOString() })
      .eq("id", orgId);
    return { ok: false, error: message };
  }
}

/** Runs syncSalesforceOrg for every currently-connected org. Used by the scheduled function. */
export async function syncAllConnectedOrgs(): Promise<{ orgId: string; result: Awaited<ReturnType<typeof syncSalesforceOrg>> }[]> {
  const admin = createAdminClient();
  const { data: orgs, error } = await admin.from("salesforce_orgs").select("id").eq("status", "connected");
  if (error || !orgs) return [];

  const results = [];
  for (const org of orgs) {
    results.push({ orgId: org.id, result: await syncSalesforceOrg(org.id) });
  }
  return results;
}
