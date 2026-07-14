import crypto from "crypto";

// Symmetric encryption for anything we have to store at rest that isn't a
// password (Salesforce Consumer Secret, OAuth refresh/access tokens). Never
// used for user passwords — those are handled entirely by Supabase Auth.
//
// TOKEN_ENCRYPTION_KEY must be a 32-byte key, base64-encoded. Generate one
// with: openssl rand -base64 32 — and set it as a server-only env var
// (never NEXT_PUBLIC_*).

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "Missing TOKEN_ENCRYPTION_KEY environment variable. Generate one with `openssl rand -base64 32`."
    );
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64-encoded).");
  }
  return buf;
}

/** Encrypts a plaintext string. Returns a single base64 string safe to store in a text column. */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Reverses encryptSecret. Throws if the value was tampered with or the key is wrong. */
export function decryptSecret(encoded: string): string {
  const key = getKey();
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
