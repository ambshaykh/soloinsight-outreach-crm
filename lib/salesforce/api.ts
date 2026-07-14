

const API_VERSION = "v59.0";

/** Runs a SOQL query against a connected org, following pagination automatically. */
export async function soqlQuery<T = any>(
  instanceUrl: string,
  accessToken: string,
  soql: string
): Promise<T[]> {
  let url = `${instanceUrl}/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`;
  const records: T[] = [];

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Salesforce SOQL query failed (${res.status}): ${text}`);
    }
    const data = await res.json();
    records.push(...(data.records ?? []));
    url = data.done ? "" : `${instanceUrl}${data.nextRecordsUrl}`;
  }

  return records;
}

export type CampaignSummary = {
  Id: string;
  Name: string;
  Status: string | null;
  StartDate: string | null;
  NumberOfLeads: number | null;
  NumberOfContacts: number | null;
  NumberOfResponses: number | null;
};

/**
 * Pulls campaign-level rollups using ONLY fields that are standard on every
 * Salesforce org regardless of edition (NumberOfLeads/NumberOfContacts are
 * native CampaignMember rollups; NumberOfResponses tracks CampaignMember's
 * HasResponded flag). This intentionally does NOT include emails-sent,
 * bounce, or unsubscribe counts — vanilla Salesforce Campaigns don't track
 * those out of the box. Which object actually holds that data (classic Mass
 * Email activity history vs. Lightning "List Email" send tracking vs. a
 * custom object someone built) depends on how each org sends campaign email,
 * and has to be confirmed per-org before we query it — see the Salesforce
 * portal's "Schema check" note.
 */
export async function fetchCampaignSummaries(
  instanceUrl: string,
  accessToken: string
): Promise<CampaignSummary[]> {
  const soql = `
    select Id, Name, Status, StartDate, NumberOfLeads, NumberOfContacts, NumberOfResponses
    from Campaign
    order by StartDate desc nulls last
    limit 200
  `.replace(/\s+/g, " ").trim();

  return soqlQuery<CampaignSummary>(instanceUrl, accessToken, soql);
}

/** Basic identity/limits check used right after connecting, to confirm the token actually works. */
export async function verifyConnection(instanceUrl: string, accessToken: string): Promise<void> {
  const res = await fetch(`${instanceUrl}/services/data/${API_VERSION}/limits`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Salesforce connection check failed (${res.status}): ${text}`);
  }
}
