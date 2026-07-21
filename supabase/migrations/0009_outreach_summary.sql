-- Phase 11: company-wide Outreach Summary (Executive Dashboard) and
-- per-org Outreach Detail (Salesforce portal), matching the layout and
-- metric set of the "SI Growth Executive Dashboard" spreadsheet's
-- "Outreach Summary (2)" sheet.
--
-- Both tables are designed to be written to by a service-role client (an
-- n8n workflow using the Supabase node, or any script using the
-- service-role key) going forward — that's why neither has an INSERT/UPDATE
-- policy for `authenticated`. The service role always bypasses RLS, so no
-- special write policy is needed for it. Only SELECT is exposed to the app.

-- ---------------------------------------------------------------------------
-- OUTREACH_MONTHLY_SUMMARY — company-wide, one row per calendar month.
-- Mirrors the 18 numbered KPI rows + 4 qualitative context rows from the
-- spreadsheet's "Outreach Summary (2)" / master rollup sheet, just pivoted
-- so each month is a row instead of a column.
-- ---------------------------------------------------------------------------
create table if not exists public.outreach_monthly_summary (
  id uuid primary key default gen_random_uuid(),
  period_month date not null unique,       -- first-of-month, e.g. 2023-06-01
  period_label text not null,              -- display label, e.g. 'Jun-23'

  -- Numbered KPI rows 1–18 from the spreadsheet
  contact_target int,                      -- 1  Total Contact Target
  contacts_enriched int,                   -- 2  Total Contacts Enriched
  contacts_executed int,                   -- 3  Total Contacts Executed (Sent)
  contacts_delivered int,                  -- 4  Total Contacts Delivered (Email Open)
  campaigns_executed int,                  -- 5  Total Campaigns Executed
  campaign_days int,                       -- 6  Total Campaign Days
  businesses_reached int,                  -- 7  Total Businesses Reached
  daily_campaign_avg numeric,              -- 8  Total Daily Campaign (Average)
  success_rate numeric,                    -- 9  Campaign Success (Average Open Rate), stored as e.g. 91.00 = 91%
  bounce_rate numeric,                     -- 10 Campaign Bounce Rate (Average)
  optout_rate numeric,                     -- 11 Campaign Opt-out Rate (Average)
  leads_mql int,                           -- 12 Total Leads Generated (MQL)
  leads_sql int,                           -- 13 Leads Established (SQL/Meetings)
  leads_in_progress int,                   -- 14 Leads In-Progress (MQL/SQL)
  leads_success_lt50 int,                  -- 15 Total Leads With Success <50%
  leads_progress_pct numeric,              -- 16 Overall Leads Progress (Success)
  campaign_to_lead_ratio numeric,          -- 17 Campaign to Lead Conversion Ratio
  outreach_to_lead_ratio numeric,          -- 18 Business Outreach to Lead Ratio

  -- Dashed qualitative context rows from the spreadsheet
  primary_focus text,
  secondary_focus text,
  region_general text,
  region_particular text,

  -- Where this row's numbers came from — surfaced in the UI so partially-
  -- derived months are visibly flagged rather than looking as authoritative
  -- as a fully-reconciled month.
  data_source text not null default 'manual'
    check (data_source in ('manual', 'n8n', 'spreadsheet_backfill', 'derived_partial')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_monthly_summary_period_idx
  on public.outreach_monthly_summary(period_month);

alter table public.outreach_monthly_summary enable row level security;

create policy "outreach_monthly_summary_select"
  on public.outreach_monthly_summary for select
  to authenticated
  using (public.has_permission('executive_dashboard.view'));
-- No write policy for authenticated — only a service-role client (n8n, or
-- your own script) writes here going forward.

-- ---------------------------------------------------------------------------
-- SALESFORCE_OUTREACH_DAILY_STATS — per-org, per-day send-batch detail.
-- Matches the "SI Growth Campaign Roundup" per-org format: batches sent vs.
-- blocked (daily Salesforce mass-email limits), emails sent vs. uploaded,
-- and the resulting delivery rate — one row per org per campaign per day.
--
-- org_key/org_label/instance_url are stored directly on each row (not a
-- foreign key into salesforce_orgs) so this table works whether or not that
-- org has gone through the OAuth connect flow yet — salesforce_orgs holds
-- live credentials and is a hard-deny table; this table only holds
-- already-public campaign send numbers.
-- ---------------------------------------------------------------------------
create table if not exists public.salesforce_outreach_daily_stats (
  id uuid primary key default gen_random_uuid(),
  org_key text not null,                   -- e.g. 'cloudgatepiam'
  org_label text not null,                 -- e.g. 'soloinsight (cloudgatepiam)'
  instance_url text,                       -- e.g. 'soloinsight.my.salesforce.com'
  stat_date date not null,
  campaign_label text not null,
  batches_sent int,
  batches_blocked int,
  emails_sent int,
  emails_uploaded int,
  delivery_rate numeric,                   -- percentage, e.g. 99.90 = 99.9%
  notes text,
  data_source text not null default 'manual'
    check (data_source in ('manual', 'n8n', 'spreadsheet_backfill')),
  created_at timestamptz not null default now(),
  unique (org_key, stat_date, campaign_label)
);

create index if not exists sf_outreach_daily_stats_date_idx
  on public.salesforce_outreach_daily_stats(stat_date);
create index if not exists sf_outreach_daily_stats_org_idx
  on public.salesforce_outreach_daily_stats(org_key);

alter table public.salesforce_outreach_daily_stats enable row level security;

create policy "sf_outreach_daily_stats_select"
  on public.salesforce_outreach_daily_stats for select
  to authenticated
  using (public.has_permission('salesforce.view'));
-- No write policy for authenticated — only a service-role client (n8n, or
-- your own script) writes here going forward.

-- ---------------------------------------------------------------------------
-- Historical backfill — real numbers extracted directly from the
-- "SI Growth Executive Dashboard" spreadsheet, not fabricated. See
-- "Phase 11 - How to apply.md" for exactly what each block below covers,
-- what's intentionally left NULL, and why.
-- ---------------------------------------------------------------------------

-- Jun-23 through Dec-25 (31 months) — full 18-metric + 4-context-row set,
-- from the spreadsheet's own master "Total To-Date" rollup table.
insert into public.outreach_monthly_summary
  (period_month, period_label, contact_target, contacts_enriched, contacts_executed, contacts_delivered, campaigns_executed, campaign_days, businesses_reached, daily_campaign_avg, success_rate, bounce_rate, optout_rate, leads_mql, leads_sql, leads_in_progress, leads_success_lt50, leads_progress_pct, campaign_to_lead_ratio, outreach_to_lead_ratio, primary_focus, secondary_focus, region_general, region_particular, data_source)
values
  ('2023-06-01', 'Jun-23', 176000, 257485, 281071, 259649, 405, 25, 455, 16, 91, 9.57, 0.1, 26, 23, 3, 3, 88.46, 6.42, 5.72, 'Digital Credentials', 'Visitor Management', 'United States', 'NY, NJ, IL, OH, CA, TX, AZ, FL', 'spreadsheet_backfill'),
  ('2023-07-01', 'Jul-23', 168000, 216000, 233906, 198040, 356, 15, 382, 24, 89, 10.64, 0.07, 32, 30, 2, 2, 93.75, 8.99, 8.39, 'Digital Credentials', 'Visitor Management', 'United States, GCC', 'UAE, KSA, PA, VA, WV, DE, MI, CO, SC, GA, DC', 'spreadsheet_backfill'),
  ('2023-08-01', 'Aug-23', 160000, 188000, 229729, 205065, 296, 15, 332, 20, 94, 6.5, 0.05, 14, 14, 0, 0, 100.0, 4.73, 4.21, 'Digital Credentials', 'Visitor Management', 'United States, GCC', 'Peter 2023, CO, MI, GA, MO, SC, MD', 'spreadsheet_backfill'),
  ('2023-09-01', 'Sep-23', 168000, 190000, 324725, 287450, 419, 20, 336, 21, 90, 10, 0.09, 18, 18, 0, 0, 100.0, 4.3, 5.36, 'Digital Credentials', 'Visitor Management', 'United States', 'NC, MO, MD, WI, CO, GSX2023, LA, KY, GA, PA, VA/WV, Tim 2023, FL', 'spreadsheet_backfill'),
  ('2023-10-01', 'Oct-23', 168000, 136000, 312566, 268940, 425, 21, 240, 20, 87, 13, 0.14, 7, 7, 0, 0, 100.0, 1.65, 2.91, 'Digital Credentials', 'Visitor Management', 'United States', 'NC, KY, IN, CO, DC, MO, SC, VA/WV, MD, GA, Tim 2023, KI, IN', 'spreadsheet_backfill'),
  ('2023-11-01', 'Nov-23', 176000, 139000, 339312, 286270, 447, 21, 246, 21, 85.25, 14.85, 0.12, 13, 12, 1, 1, 92.31, 2.91, 5.29, 'Digital Credentials', 'Visitor Management', 'United States', 'NC, WI, GA, NC, MD, Peter 2023, DC, CO, FL, IN, KY, Tim 2023, DC, CT', 'spreadsheet_backfill'),
  ('2023-12-01', 'Dec-23', 112000, 104000, 207106, 183360, 283, 14, 184, 20, 91.84, 8.31, 0.17, 6, 6, 0, 0, 100.0, 2.12, 3.27, 'Digital Credentials', 'Visitor Management', 'United States', 'Tim 2023, DC, NC, IN, CT, MA, RI', 'spreadsheet_backfill'),
  ('2024-01-01', 'Jan-24', 176000, 173000, 167654, 156201, 263, 14, 306, 19, 96, 4, 0.22, 13, 12, 1, 1, 92.31, 4.94, 4.25, 'Digital Credentials', 'Visitor Management', 'United States', 'MA, IN, RI, CT, NY', 'spreadsheet_backfill'),
  ('2024-02-01', 'Feb-24', 160000, 152000, 295145, 280881, 468, 19, 269, 25, 95.19, 5.01, 0.21, 11, 11, 0, 0, 100.0, 2.35, 4.1, 'Digital Credentials', 'Visitor Management', 'United States', 'MA, NY, CT, ME, TN, Peter 2024', 'spreadsheet_backfill'),
  ('2024-03-01', 'Mar-24', 168000, 144000, 264644, 260838, 383, 18, 254, 21, 98.56, 1.67, 0.23, 21, 21, 0, 0, 100.0, 5.48, 8.25, 'Digital Credentials', 'Visitor Management', 'United States', 'MA, TN, Peter 2024', 'spreadsheet_backfill'),
  ('2024-04-01', 'Apr-24', 176000, 144000, 263586, 258655, 385, 18, 254, 21, 98.14, 2.06, 0.21, 13, 13, 0, 0, 100.0, 3.38, 5.11, 'Digital Credentials', 'Visitor Management', 'United States', 'MA, TN, Peter 2024, WI', 'spreadsheet_backfill'),
  ('2024-05-01', 'May-24', 160000, 160000, 314655, 310315, 474, 20, 283, 24, 98.6, 1.56, 0.17, 6, 6, 0, 0, 100.0, 1.27, 2.12, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-06-01', 'Jun-24', 136000, 120000, 144069, 139997, 213, 11, 212, 19, 97.2, 3.12, 0.33, 22, 19, 3, 3, 86.36, 10.33, 10.38, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-07-01', 'Jul-24', 176000, 184000, 307461, 300669, 542, 22, 325, 25, 97.78, 2.44, 0.23, 23, 23, 23, 0, 100.0, 4.24, 7.08, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-08-01', 'Aug-24', 168000, 168000, 312567, 309634, 523, 20, 297, 26, 99.07, 1.24, 0.31, 22, 22, 0, 0, 100.0, 4.21, 7.41, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-09-01', 'Sep-24', 152000, 160000, 312285, 307014, 561, 19, 283, 30, 98.32, 1.92, 0.24, 14, 14, 0, 0, 100.0, 2.5, 4.95, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-10-01', 'Oct-24', 176000, 152000, 332250, 328788, 646, 22, 269, 29, 98.94, 1.31, 0.26, 23, 23, 0, 0, 100.0, 3.56, 8.56, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-11-01', 'Nov-24', 160000, 96000, 147828, 146452, 303, 10, 170, 30, 99.03, 1.16, 0.18, 19, 11, 0, 0, 57.89, 6.27, 11.2, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2024-12-01', 'Dec-24', 176000, 169000, 205113, 170897, 302, 14, 299, 22, 99.32, 0.8, 0.12, 16, 7, 0, 0, 43.75, 5.3, 5.36, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-01-01', 'Jan-25', 176000, 224000, 205113, 204682, 397, 12, 396, 33, 99.79, 0.41, 0.21, 14, 10, 0, 0, 71.43, 3.53, 3.54, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-02-01', 'Feb-25', 160000, 216000, 264761, 264599, 467, 15, 382, 31, 99.94, 0.24, 0.18, 13, 6, 1, 0, 46.15, 2.78, 3.41, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-03-01', 'Mar-25', 152000, 232000, 364877, 364505, 657, 19, 410, 35, 99.9, 0.22, 0.1, 21, 14, 0, 0, 66.67, 3.2, 5.12, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-04-01', 'Apr-25', 160000, 208000, 390833, 390315, 713, 20, 367, 36, 99.87, 0.24, 0.1, 15, 15, 0, 0, 100.0, 2.1, 4.08, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-05-01', 'May-25', 152000, 56000, 365787, 365683, 509, 19, 99, 27, 99.97, 0.1, 0.07, 12, 12, 0, 0, 100.0, 2.36, 12.13, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-06-01', 'Jun-25', 112000, 200000, 268488, 268459, 398, 14, 353, 28, 99.99, 0.13, 0.11, 5, 5, 0, 0, 100.0, 1.26, 1.42, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-07-01', 'Jul-25', 168000, 224000, 384717, 268459, 578, 21, 396, 28, 99.99, 0.09, 0.08, 6, 6, 0, 0, 100.0, 1.04, 1.52, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-08-01', 'Aug-25', 144000, 232000, 269011, 268998, 407, 15, 410, 27, 100.0, 0.13, 0.12, 5, 5, 0, 0, 100.0, 1.23, 1.22, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-09-01', 'Sep-25', 144000, 232000, 309320, 309168, 371, 18, 410, 21, 99.95, 0.15, 0.11, 14, 14, 0, 0, 100.0, 3.77, 3.42, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-10-01', 'Oct-25', 144000, 208000, 286395, 286315, 279, 18, 367, 16, 99.97, 0.1, 0.07, 18, 18, 0, 0, 100.0, 6.45, 4.9, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-11-01', 'Nov-25', 144000, 160000, 360643, 360611, 449, 20, 283, 22, 99.99, 0.1, 0.09, 16, 16, 0, 0, 100.0, 3.56, 5.66, NULL, NULL, NULL, NULL, 'spreadsheet_backfill'),
  ('2025-12-01', 'Dec-25', 160000, 224000, 323887, 323879, 499, 17, 396, 29, 100.0, 0.06, 0.06, 18, 16, 0, 2, 88.89, 3.61, 4.55, NULL, NULL, NULL, NULL, 'spreadsheet_backfill')
on conflict (period_month) do nothing;

-- Jan-26 through Apr-26 — the master rollup sheet was never extended past
-- Dec-25, so these 4 months are derived directly from each month's own daily
-- log sheet instead. Only what's reliably computable from that log is
-- filled in; contact_target, businesses_reached, the SQL/lead-progress rows,
-- both ratio rows, and the 4 qualitative rows are left NULL rather than
-- guessed. May-26 has no corresponding sheet in the source at all (a real
-- gap, not an extraction miss) and is intentionally not inserted.
insert into public.outreach_monthly_summary
  (period_month, period_label, contact_target, contacts_enriched, contacts_executed, contacts_delivered, campaigns_executed, campaign_days, businesses_reached, daily_campaign_avg, success_rate, bounce_rate, optout_rate, leads_mql, leads_sql, leads_in_progress, leads_success_lt50, leads_progress_pct, campaign_to_lead_ratio, outreach_to_lead_ratio, primary_focus, secondary_focus, region_general, region_particular, data_source)
values
  ('2026-01-01', 'Jan-26', NULL, 168000, 341130, 341119, 529, 18, NULL, 29.4, 100.0, 0.04, 0.03, 16, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'derived_partial'),
  ('2026-02-01', 'Feb-26', NULL, 184000, 342724, 342630, 324, 19, NULL, 17.1, 99.98, 0.05, 0.04, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'derived_partial'),
  ('2026-03-01', 'Mar-26', NULL, 152000, 134514, 134319, 169, 4, NULL, 42.2, 99.88, 0.17, 0.05, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'derived_partial'),
  ('2026-04-01', 'Apr-26', NULL, 16000, 19309, 19305, 21, NULL, NULL, NULL, 99.98, 0.07, 0.05, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'derived_partial')
on conflict (period_month) do nothing;

-- From June 2026 onward, the source spreadsheet itself switched from this
-- company-wide daily-log format to a per-Salesforce-org format (matching
-- your 3 live orgs: cloudgatepiam, cloudpiam, mobilepiam) — so June 2026
-- onward is backfilled into salesforce_outreach_daily_stats below instead
-- of here, not because of a gap but because that's genuinely where your own
-- tracking moved.

-- June 22, 24, 29 & 30, 2026 — the only per-org data currently available
-- (from "SI_Growth_Campaign_Roundup_June2026"). Everything after this is
-- expected to come from your Salesforce sync and/or n8n workflow.
insert into public.salesforce_outreach_daily_stats
  (org_key, org_label, instance_url, stat_date, campaign_label, batches_sent, batches_blocked, emails_sent, emails_uploaded, delivery_rate, notes, data_source)
values
  ('cloudgatepiam', 'soloinsight (cloudgatepiam)', 'soloinsight.my.salesforce.com', '2026-06-22', 'CloudGate - Physical Identity & Visitor Access Management.', 3, NULL, 2825, 2829, 99.9, NULL, 'spreadsheet_backfill'),
  ('cloudpiam', 'soloinsightinc2 (cloudpiam)', 'soloinsightinc2.my.salesforce.com', '2026-06-22', 'CloudGate - Physical Identity & Visitor Access Management.', 3, NULL, 2914, 2930, 99.5, NULL, 'spreadsheet_backfill'),
  ('mobilepiam', 'oncloudgate (mobilepiam)', 'oncloudgate.my.salesforce.com', '2026-06-22', 'CloudGate - Physical Identity & Visitor Access Management.', 3, NULL, 3153, 3164, 99.7, NULL, 'spreadsheet_backfill'),
  ('cloudgatepiam', 'soloinsight (cloudgatepiam)', 'soloinsight.my.salesforce.com', '2026-06-24', 'CloudGate - Manage Physical Security Anytime, Anywhere.', 3, NULL, 2375, 2829, 84.0, NULL, 'spreadsheet_backfill'),
  ('cloudpiam', 'soloinsightinc2 (cloudpiam)', 'soloinsightinc2.my.salesforce.com', '2026-06-24', 'CloudGate - Manage Physical Security Anytime, Anywhere.', 3, NULL, 2643, 2928, 90.3, NULL, 'spreadsheet_backfill'),
  ('mobilepiam', 'oncloudgate (mobilepiam)', 'oncloudgate.my.salesforce.com', '2026-06-24', 'CloudGate - Manage Physical Security Anytime, Anywhere.', 3, NULL, 2924, 3164, 92.4, NULL, 'spreadsheet_backfill'),
  ('cloudgatepiam', 'soloinsight (cloudgatepiam)', 'soloinsight.my.salesforce.com', '2026-06-29', 'CloudGate - Physical Identity & Visitor Access Management.', 4, 1, 3092, NULL, NULL, '6 batch(es) blocked by daily limit across orgs; cloudgatepiam Jun 29 uploaded count unavailable (blocked batch count uncertain)', 'spreadsheet_backfill'),
  ('cloudpiam', 'soloinsightinc2 (cloudpiam)', 'soloinsightinc2.my.salesforce.com', '2026-06-29', 'CloudGate - Physical Identity & Visitor Access Management.', 4, 4, 4229, 4230, 100.0, NULL, 'spreadsheet_backfill'),
  ('mobilepiam', 'oncloudgate (mobilepiam)', 'oncloudgate.my.salesforce.com', '2026-06-29', 'CloudGate - Physical Identity & Visitor Access Management.', 3, 1, 3737, 3739, 99.9, NULL, 'spreadsheet_backfill'),
  ('cloudgatepiam', 'soloinsight (cloudgatepiam)', 'soloinsight.my.salesforce.com', '2026-06-30', 'CloudGate - Physical Identity & Visitor Access Management.', 4, 1, 4376, 4379, 99.9, '2 batch(es) blocked by daily limit across orgs', 'spreadsheet_backfill'),
  ('cloudpiam', 'soloinsightinc2 (cloudpiam)', 'soloinsightinc2.my.salesforce.com', '2026-06-30', 'CloudGate - Physical Identity & Visitor Access Management.', 4, NULL, 4260, 4261, 100.0, NULL, 'spreadsheet_backfill'),
  ('mobilepiam', 'oncloudgate (mobilepiam)', 'oncloudgate.my.salesforce.com', '2026-06-30', 'CloudGate - Physical Identity & Visitor Access Management.', 4, 1, 4093, 4093, 100.0, NULL, 'spreadsheet_backfill')
on conflict (org_key, stat_date, campaign_label) do nothing;
