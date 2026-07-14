import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { exchangeCodeForToken } from "@/lib/salesforce/oauth";
import { verifyConnection } from "@/lib/salesforce/api";

// Salesforce redirects here after the admin approves access on Salesforce's
// own login/consent screen. `state` carries our salesforce_orgs.id so we know
// which org row to attach the resulting tokens to.
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const code = request.nextUrl.searchParams.get("code");
  const orgId = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error_description") || request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${appUrl}/salesforce?connect_error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !orgId) {
    return NextResponse.redirect(`${appUrl}/salesforce?connect_error=${encodeURIComponent("Missing code or state from Salesforce.")}`);
  }

  const admin = createAdminClient();
  const { data: org, error: fetchError } = await admin
    .from("salesforce_orgs")
    .select("*")
    .eq("id", orgId)
    .single();

  if (fetchError || !org) {
    return NextResponse.redirect(`${appUrl}/salesforce?connect_error=${encodeURIComponent("Org not found.")}`);
  }

  try {
    const consumerSecret = decryptSecret(org.consumer_secret_encrypted!);
    const redirectUri = `${appUrl}/api/salesforce/callback`;

    const token = await exchangeCodeForToken({
      consumerKey: org.consumer_key!,
      consumerSecret,
      redirectUri,
      code,
    });

    await verifyConnection(token.instance_url, token.access_token);

    await admin
      .from("salesforce_orgs")
      .update({
        instance_url: token.instance_url,
        refresh_token_encrypted: token.refresh_token
          ? encryptSecret(token.refresh_token)
          : org.refresh_token_encrypted,
        access_token_encrypted: encryptSecret(token.access_token),
        status: "connected",
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId);

    return NextResponse.redirect(`${appUrl}/salesforce?connected=${orgId}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error connecting to Salesforce.";
    await admin
      .from("salesforce_orgs")
      .update({ status: "error", last_sync_error: message, updated_at: new Date().toISOString() })
      .eq("id", orgId);
    return NextResponse.redirect(`${appUrl}/salesforce?connect_error=${encodeURIComponent(message)}`);
  }
}
