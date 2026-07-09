# Soloinsight Outreach CRM

A multi-page SaaS CRM for **manual** email and call outreach management — built for a small
GTM / SDR / sales-ops team. Tracks accounts, contacts, manual outreach touchpoints, follow-ups,
pipeline status, and team activity. It does **not** send emails or place calls automatically —
every touch is logged by a human, on purpose.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Radix/shadcn-style
UI + Recharts + Supabase (Postgres, Auth, RLS, mandatory TOTP 2FA)**. Deployable to Vercel.

---

## 1. What's included

- Command Dashboard — team-wide outbound metrics, charts, and "what needs attention today" widgets.
- Accounts & Contacts workspace — filterable tables, detail pages, and 9 manual activity-logging types.
- Outreach Queue & Follow-Up Center — prioritized queues (overdue, hot, no-touch-7/14, etc.) plus a
  drag-and-drop Kanban view across the contact status pipeline.
- Activities & Analytics — full activity feed with filters, and an admin/manager-only analytics
  control-center (reply rate, touches/prospect, per-rep performance, pipeline movement).
- Settings — invite-only user management, role management, 2FA enforcement status, security audit
  log, CSV import/export.
- Auth — invite-only signup, **mandatory TOTP 2FA before any protected page**, password reset,
  session handling, role-based access enforced by **Postgres Row Level Security**, not just the UI.

Roles: `admin` (full access, invites users, manages roles/security), `manager` (team-wide visibility
and reassignment, no security settings), `sdr` (only records they own or created).

---

## 2. Project structure

```
app/                     Next.js App Router pages
  login/, 2fa/setup/, invite/[token]/, reset-password/   — public/auth pages
  (app)/                 protected route group (sidebar + topbar layout)
    dashboard/ accounts/ contacts/ outreach-queue/ follow-ups/ activities/ analytics/ settings/
  actions/               Server Actions (all writes — activities, accounts, contacts, tasks, users, invitations, auth, data)
components/
  ui/                    hand-built shadcn-style primitives (button, card, dialog, table, etc.)
  layout/                Sidebar, Topbar
  dashboard/ accounts/ contacts/ activities/ queue/ analytics/ settings/ shared/
lib/
  supabase/              browser / server / middleware / admin (service-role) Supabase clients
  auth/session.ts        getCurrentProfile / requireProfile / requireRole
  data/                  read queries (accounts, contacts, activities, tasks, dashboard, analytics, queue, profiles)
  types/database.ts      hand-written types mirroring the SQL schema
  constants.ts            status/priority labels + colors, kanban columns, enums
supabase/
  migrations/0001_schema.sql       tables, enums, triggers, handle_new_user
  migrations/0002_rls_policies.sql Row Level Security policies (incl. mandatory-2FA gate)
  seed/seed.sql                    5 users / 20 accounts / ~60 contacts / ~100 activities / ~30 tasks
middleware.ts            enforces auth + mandatory 2FA + redirects
```

---

## 3. Supabase setup

### 3.1 Create the project

1. Go to [supabase.com](https://supabase.com) → New Project. Note the **Project URL** and the
   **anon/public key** and **service_role key** from Project Settings → API.
2. In **Authentication → Providers**, keep Email enabled. Under **Authentication → Settings**,
   you can disable "Confirm email" for faster local testing (invited users are created
   pre-confirmed by the app either way).
3. Under **Authentication → MFA**, make sure **TOTP** is enabled (it is by default).

### 3.2 Run the migrations

Using the Supabase SQL Editor (or the CLI — see below), run, **in order**:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls_policies.sql
```

Then, if you want realistic demo data, run:

```
supabase/seed/seed.sql
```

This creates 5 users — `admin@soloinsight.com`, `manager@soloinsight.com`, `sdr1@soloinsight.com`,
`sdr2@soloinsight.com`, `sdr3@soloinsight.com` — all with password `Password123!` (change these
immediately in any shared environment), plus 20 accounts, ~60 contacts, ~100 activities, and ~30
follow-up tasks across Healthcare, Enterprise Security, Banking, Manufacturing, Education,
Corporate Real Estate, Government, and Technology.

**Using the Supabase CLI instead of the dashboard SQL editor:**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push --file supabase/migrations/0001_schema.sql
supabase db push --file supabase/migrations/0002_rls_policies.sql
supabase db push --file supabase/seed/seed.sql
```

(Or just paste each file's contents into the SQL Editor and hit Run — simplest for a first pass.)

### 3.3 What the SQL actually sets up

- Tables: `profiles`, `teams`, `accounts`, `contacts`, `activities`, `tasks`, `invitations`, `audit_logs`.
- Enums for role, account/contact status, activity type/channel, task status, priority, call outcome.
- A trigger on `auth.users` that creates a matching `profiles` row on signup, applying the role/team
  from a matching pending invitation if one exists (defaults to `sdr` otherwise).
- A trigger on `activities` insert that bumps `last_contacted_at` / `next_follow_up_at` / touch
  counters on the related contact and account automatically.
- **Row Level Security is on for every table.** Admins/managers see everything; SDRs only see rows
  where they are the `owner_id` or `created_by`. This is enforced in Postgres — the UI hiding
  buttons is just a courtesy, the database itself will reject unauthorized reads/writes.
- **The mandatory-2FA requirement is also enforced at the RLS layer**, not just in middleware: every
  policy on `accounts`, `contacts`, `activities`, `tasks`, and `invitations` requires the session's
  JWT to carry `aal = "aal2"` (i.e., a verified TOTP factor for *this* session), via a
  `has_verified_mfa()` helper function. A stolen access token from a user who hasn't completed 2FA
  cannot read or write CRM data, even by calling the API directly.

---

## 4. Environment variables

Copy `.env.example` to `.env.local` (for local dev) and fill in the three Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # server-only, never exposed to the browser
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is only used server-side (in `lib/supabase/admin.ts`) to create user
accounts during invite acceptance. Never commit it, never prefix it with `NEXT_PUBLIC_`.

---

## 5. Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

Visit `http://localhost:3000`. Sign in with one of the seeded accounts (see §3.2), then complete
the 2FA enrollment screen (scan the QR with Google Authenticator / 1Password / Authy) — you cannot
reach the dashboard until you do.

Useful scripts:

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
```

---

## 6. Deploying to Vercel

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel: **New Project → Import** your repo.
3. Add the same four environment variables from §4 in **Project Settings → Environment Variables**
   (set `NEXT_PUBLIC_APP_URL` to your production URL, e.g. `https://outreach.yourcompany.com`).
4. Deploy. Vercel will run `next build` automatically.
5. Back in Supabase → Authentication → URL Configuration, add your Vercel URL to **Site URL** and
   **Redirect URLs** (needed for password-reset links to work in production).

That's it — no separate backend to deploy. Supabase is your database, auth, and (for password
resets) email sender.

---

## 6b. Deploying to Netlify (alternative to Vercel)

This app works on Netlify too — Netlify's official Next.js Runtime (`@netlify/plugin-nextjs`)
supports the App Router, Middleware (runs as a Netlify Edge Function), Server Actions, and Route
Handlers, all of which this project uses.

1. Push the project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, pick your repo. Netlify auto-detects
   Next.js and installs `@netlify/plugin-nextjs` for you — no extra config file is required, but you
   can optionally add a `netlify.toml` with:
   ```toml
   [build]
     command = "npm run build"
   ```
3. Add the same four environment variables from §4 in **Site configuration → Environment variables**
   (set `NEXT_PUBLIC_APP_URL` to your Netlify URL, e.g. `https://outreach.netlify.app`, or your
   custom domain once attached).
4. Deploy. Netlify will run `next build`, convert the SSR pages/Server Actions/API routes into
   Netlify Functions, deploy Middleware to Netlify Edge Functions, and push static assets to its CDN.
5. Back in Supabase → Authentication → URL Configuration, add your Netlify URL to **Site URL** and
   **Redirect URLs** (needed for password-reset and invite-acceptance links to work in production).

Everything else — Supabase setup, seeding, inviting users, 2FA — is identical to the Vercel path
above; only the hosting step changes.

---

## 7. Inviting real users

Only admins can invite. From **Settings → User Management**, enter an email + role and click
**Send Invite**. The app creates a `pending` row in `invitations` and gives you a shareable link
(`/invite/<token>`) — copy it and send it to the person however you'd like (Slack, email, in
person). This is deliberately **not** automated email sending, consistent with the "manual
outreach only" philosophy of the product itself.

When they open the link, they set a name + password, which creates their Supabase Auth user
(pre-confirmed) and assigns the role/team from the invitation. They're then required to set up 2FA
on first login before they can see any CRM data.

---

## 8. Security notes

- 2FA (TOTP) is mandatory — enforced in `middleware.ts` (route redirect) **and** in Postgres RLS
  (`has_verified_mfa()`), so it can't be bypassed by calling Supabase directly.
- All authorization is role + ownership based and lives in `supabase/migrations/0002_rls_policies.sql`.
  The frontend (`lib/auth/session.ts` → `requireRole`) is a UX convenience layer on top, not the
  real gate.
- Every sensitive action (login, logout, role changes, invitations, activity logging, status/owner
  changes) writes a row to `audit_logs` via the `log_audit_event()` Postgres function, visible to
  admins/managers under Settings → Security.
- The service-role key is only ever used server-side, in one file (`lib/supabase/admin.ts`), for
  exactly one purpose: creating a user during invite acceptance.

## 9. Explicitly out of scope (by design)

No outbound email sending, no autodialer, no automated campaigns. This product tracks and manages
**manual** outreach so a sales team stays accountable and visible — it does not do the outreach for
them.
