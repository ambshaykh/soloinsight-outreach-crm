"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { AccountStatus, ContactStatus, PriorityLevel } from "@/lib/types/database";

/* ---------------------------------------------------------------------- */
/* CSV helpers — hand-rolled, RFC4180-compliant (quoted fields, embedded  */
/* commas/newlines, escaped quotes) so no extra npm dependency is needed. */
/* ---------------------------------------------------------------------- */

function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return columns ? columns.join(",") : "";
  const headers = columns ?? Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

/** Parses CSV text into rows of string cells, respecting quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Turns parsed CSV rows into an array of lowercase-keyed objects using the header row. */
function csvToObjects(csvText: string): { rows: Record<string, string>[]; error?: string } {
  const parsed = parseCsv(csvText.trim());
  if (parsed.length < 2) return { rows: [], error: "CSV has no data rows." };
  const headers = parsed[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = parsed.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (