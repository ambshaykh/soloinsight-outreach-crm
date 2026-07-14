import { listSObjects, describeObjectFields } from "@/lib/salesforce/api";

// Objects that commonly hold campaign-email tracking data, depending on how
// an org actually sends campaign email: Lightning "List Email" (ListEmail /
// ListEmailIndividualRecipient), classic Mass Email activity (EmailMessage),
// or a custom object someone built themselves (anything with "email",
// "bounce", or "unsub" in its name/label).
const CANDIDATE_STANDARD_OBJECTS = ["ListEmail", "ListEmailIndividualRecipient", "EmailMessage"];
const NAME_PATTERN = /email|bounce|unsub/i;
const MAX_OBJECTS_TO_DESCRIBE = 12;

export type SchemaDiscoveryObject = {
  objectName: string;
  label: string;
  custom: boolean;
  fields: { name: string; label: string; type: string }[];
};

/**
 * Scans a connected org for objects that look relevant to email-send
 * tracking, and returns their fields so a human can eyeball what's actually
 * available before we write real SOQL against it. Read-only — never writes
 * anything back to Salesforce.
 */
export async function discoverEmailTrackingSchema(
  instanceUrl: string,
  accessToken: string
): Promise<SchemaDiscoveryObject[]> {
  const allObjects = await listSObjects(instanceUrl, accessToken);

  const matches = allObjects.filter(
    (o) => CANDIDATE_STANDARD_OBJECTS.includes(o.name) || (o.custom && NAME_PATTERN.test(`${o.label} ${o.name}`))
  );

  const toDescribe = matches.slice(0, MAX_OBJECTS_TO_DESCRIBE);
  const results: SchemaDiscoveryObject[] = [];

  for (const obj of toDescribe) {
    try {
      const fields = await describeObjectFields(instanceUrl, accessToken, obj.name);
      const relevantFields = fields.filter((f) => NAME_PATTERN.test(`${f.label} ${f.name}`));
      results.push({
        objectName: obj.name,
        label: obj.label,
        custom: obj.custom,
        // If nothing obviously matches by name, just show the first 20 fields so there's still something to look at.
        fields: relevantFields.length > 0 ? relevantFields : fields.slice(0, 20),
      });
    } catch {
      // Skip objects we can't describe (permission issues, etc.) rather than failing the whole scan.
    }
  }

  return results;
}
