import "server-only";

// Salesforce OAuth 2.0 Web Server Flow (authorization code grant).
// Docs: https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm

export type SalesforceTokenResponse = {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id: string;
  issued_at: string;
  signature: string;
  token_type: string;
};

const DEFAULT_LOGIN_URL = "https://login.salesforce.com";

export function buildAuthorizeUrl(params: {
  consumerKey: string;
  redirectUri: string;
  state: string;
  loginUrl?: string;
}): string {
  const loginUrl = params.loginUrl ?? DEFAULT_LOGIN_URL;
  const url = new URL(`${loginUrl}/services/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.consumerKey);
  url.searchParams.set("redirect_uri", params.redirectUri);
  // "api" = query/data access, "refresh_token" = long-lived offline access for the
  // scheduled sync job, "offline_access" is the newer alias some orgs require too.
  url.searchParams.set("scope", "api refresh_token offline_access");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeCodeForToken(params: {
  consumerKey: string;
  consumerSecret: string;
  redirectUri: string;
  code: string;
  loginUrl?: string;
}): Promise<SalesforceTokenResponse> {
  const loginUrl = params.loginUrl ?? DEFAULT_LOGIN_URL;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: params.consumerKey,
    client_secret: params.consumerSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
  });

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce token exchange failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function refreshAccessToken(params: {
  consumerKey: string;
  consumerSecret: string;
  refreshToken: string;
  loginUrl?: string;
}): Promise<SalesforceTokenResponse> {
  const loginUrl = params.loginUrl ?? DEFAULT_LOGIN_URL;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: params.consumerKey,
    client_secret: params.consumerSecret,
    refresh_token: params.refreshToken,
  });

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce token refresh failed (${res.status}): ${text}`);
  }

  return res.json();
}
