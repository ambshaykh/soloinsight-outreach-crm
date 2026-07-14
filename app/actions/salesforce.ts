"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { encryptSecret } from "@/lib/crypto/secrets";
import { buildAuthorizeUrl } from "@/lib/salesforce/oauth";
import { syncSalesforceOrg, getFreshAccessToken } from "@/lib/salesforce/sync";
import { discoverEmailTrackingSchema, type SchemaDiscoveryObject } from "@/lib/salesforce/schema-discovery";

async function requireManageConnections() {
  const profile = await requireProfile();
  if (!(await hasPermission("salesforce.manage_connections"))) {
    throw new Error("You don't have permission to manage Salesforce connections.");
  }
  return profile;
}

export async function listSalesforceOrgStatuses() {
  await requireProfile();
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_salesforce_org_status");
  if (error) {
    console.error("listSalesforceOrgStatuses failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function listSalesforceCampaignStats() {
  await requireProfile();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salesforce_campaign_stats")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) {
    console.error("listSalesforceCampaignStats failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function addSalesforceOrg(formData: FormData) {
  const profile = await requireManageConnections();

  const label = String(formData.get("label") ?? "").trim();
  const orgEdition = String(formData.get("org_edition") ?? "unknown");
  const consumerKey = String(formData.get("consumer_key") ?? "").trim();
  const consumerSecret = String(formData.get("consumer_secret") ?? "").trim();

  if (!label || !consumerKey || !consumerSecret) {
    return { error: "Label, Consumer Key, and Consumer Secret are all required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("salesforce_orgs")
    .insert({
      label,
      org_edition: orgEdition,
      consumer_key: consumerKey,
      consumer_secret_encrypted: encryptSecret(consumerSecret),
      status: "disconnected",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const supabase = createClient();
  await supabase.rpc("log_audit_event", {
    p_action: "salesforce_org.added",
    p_entity_type: "salesforce_org",
    p_entity_id: data.id,
    p_metadata: { label, org_edition: orgEdition },
  });

  revalidatePath("/salesforce");
  return { error: null, orgId: data.id as string };
}

/** Returns the Salesforce authorize URL to redirect the browser to for this org. */
export async function getSalesforceConnectUrl(orgId: string): Promise<{ url?: string; error?: string }> {
  await requireManageConnections();

  const admin = createAdminClient();
  const { data: org, error } = await admin
    .from("salesforce_orgs")
    .select("consumer_key")
    .eq("id", orgId)
    .single();

  if (error || !org?.consumer_key) return { error: "Org not found, or it's missing a Consumer Key." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/salesforce/callback`;
  const url = buildAuthorizeUrl({ consumerKey: org.consumer_key, redirectUri, state: orgId });
  return { url };
}

export async function disconnectSalesforceOrg(orgId: string) {
  await requireManageConnections();
  const admin = createAdminClient();
  const { error } = await admin
    .from("salesforce_orgs")
    .update({
      status: "disconnected",
      refresh_token_encrypted: null,
      access_token_encrypted: null,
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) return { error: error.message };

  const supabase = createClient();
  await supabase.rpc("log_audit_event", {
    p_action: "salesforce_org.disconnected", p_entity_type: "salesforce_org", p_entity_id: orgId, p_metadata: {},
  });

  revalidatePath("/salesforce");
  return { error: null };
}

export async function deleteSalesforceOrg(orgId: string) {
  await requireManageConnections();
  const admin = createAdminClient();
  const { error } = await admin.from("salesforce_orgs").delete().eq("id", orgId);
  if (error) return { error: error.message };

  const supabase = createClient();
  await supabase.rpc("log_audit_event", {
    p_action: "salesforce_org.deleted", p_entity_type: "salesforce_org", p_entity_id: orgId, p_metadata: {},
  });

  revalidatePath("/salesforce");
  return { error: null };
}

export async function syncSalesforceOrgNow(orgId: string) {
  await requireManageConnections();
  const result = await syncSalesforceOrg(orgId);

  const supabase = createClient();
  await supabase.rpc("log_audit_event", {
    p_action: result.ok ? "salesforce_org.synced" : "salesforce_org.sync_failed",
    p_entity_type: "salesforce_org",
    p_entity_id: orgId,
    p_metadata: result.ok ? { campaigns_synced: result.campaignsSynced } : { error: result.error },
  });

  revalidatePath("/salesforce");
  return result;
}

export async function discoverSalesforceEmailSchema(
  orgId: string
): Promise<{ error: string | null; result?: SchemaDiscoveryObject[] }> {
  await requireManageConnections();

  const token = await getFreshAccessToken(orgId);
  if ("error" in token) return { error: token.error };

  try {
    const result = await discoverEmailTrackingSchema(token.instanceUrl, token.accessToken);

    const supabase = createClient();
    await supabase.rpc("log_audit_event", {
      p_action: "salesforce_org.schema_discovery",
      p_entity_type: "salesforce_org",
      p_entity_id: orgId,
      p_metadata: { objects_found: result.map((r) => r.objectName) },
    });

    return { error: null, result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Schema discovery failed." };
  }
}
