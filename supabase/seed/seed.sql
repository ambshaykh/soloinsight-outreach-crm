-- ============================================================================
-- Soloinsight Outreach CRM — Seed Data
-- 5 users (1 admin, 1 manager, 3 sdr) / 1 team / 20 accounts / ~60 contacts
-- ~100 activities / ~30 follow-up tasks.
--
-- IMPORTANT: default password for every seeded user is  Password123!
-- Change these immediately in any shared or production environment.
-- Run this AFTER 0001_schema.sql and 0002_rls_policies.sql have been applied.
-- ============================================================================

do $$
declare
  v_team_id uuid;
  v_admin_uid uuid;
  v_manager_uid uuid;
  v_sdr1_uid uuid;
  v_sdr2_uid uuid;
  v_sdr3_uid uuid;
  v_admin_id uuid;
  v_manager_id uuid;
  v_sdr1_id uuid;
  v_sdr2_id uuid;
  v_sdr3_id uuid;
  v_owner_ids uuid[];
  v_account_id uuid;
  v_contact_id uuid;
  v_account_ids uuid[] := array[]::uuid[];
  v_contact_ids uuid[] := array[]::uuid[];
  v_contact_owner uuid;

  v_companies text[] := array[
    'Meridian Health Systems','Northgate Bank & Trust','Vantage Manufacturing Co',
    'BluePeak Realty Group','Cascade School District','Ironclad Security Solutions',
    'Summit Regional Medical Center','Franklin State Credit Union','Alloy Precision Industries',
    'Harborview Real Estate Partners','Lakeside Unified Schools','Sentry Defense Systems',
    'Redwood Community Hospital','Union Trust Financial','Titan Assembly Group',
    'Coastal Property Advisors','Beacon County Government','Vertex Cyber Defense',
    'Pinnacle Data Technologies','Anchor Municipal Services'
  ];
  v_industries text[] := array[
    'Healthcare','Banking','Manufacturing','Corporate Real Estate','Education',
    'Enterprise Security','Government','Technology'
  ];
  v_regions text[] := array['Northeast','Southeast','Midwest','Southwest','West','National'];
  v_sizes text[] := array['1-50','51-200','201-500','501-2000','2000+'];
  v_sources text[] := array['ZoomInfo','Apollo','LeadIQ','Manual Research','Referral','Website','Event List'];
  v_acct_statuses public.account_status[] := array['new','assigned','in_progress','engaged','meeting_booked','not_interested','stale']::public.account_status[];
  v_priorities public.priority_level[] := array['low','medium','high','urgent']::public.priority_level[];

  v_first_names text[] := array['James','Maria','David','Sarah','Michael','Jennifer','Robert','Linda',
    'William','Elizabeth','Daniel','Susan','Kevin','Patricia','Brian','Nancy','Mark','Karen','Paul','Laura',
    'Steven','Amy','Andrew','Rachel','Chris','Megan','Eric','Julie','Jason','Michelle'];
  v_last_names text[] := array['Anderson','Thompson','Garcia','Martinez','Robinson','Clark','Rodriguez',
    'Lewis','Walker','Hall','Young','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Baker',
    'Adams','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker'];
  v_titles text[] := array['VP of Operations','Director of IT','Facilities Manager','Chief Security Officer',
    'HR Director','Procurement Manager','Director of Compliance','VP of Security','IT Manager',
    'Chief Operating Officer','Director of Facilities','Risk Manager'];
  v_contact_statuses public.contact_status[] := array['new','assigned','first_touch_sent','called',
    'follow_up_needed','positive_reply','meeting_booked','not_interested','wrong_person']::public.contact_status[];

  v_activity_types public.activity_type[] := array['email','call','linkedin','note','meeting']::public.activity_type[];
  v_call_outcomes public.call_outcome[] := array['connected','no_answer','voicemail','callback_requested',
    'wrong_number','not_interested','meeting_booked']::public.call_outcome[];
  v_email_subjects text[] := array['Quick question about your badge access program','Following up on physical security audit',
    'Governance layer for your PACS + HR + IT stack','Re: compliance evidence for your next audit',
    'Worth 15 minutes this week?','Following up from LinkedIn','Checking in — any interest in a governance review?'];

  i int; j int; n_contacts int; n_industries int := array_length(v_industries,1);
  n_activities int := 0; n_tasks int := 0;
begin
  -- Team
  insert into public.teams (name) values ('Soloinsight GTM') returning id into v_team_id;

  -- Users (fires handle_new_auth_user -> creates public.profiles rows as 'sdr')
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'admin@soloinsight.com', crypt('Password123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Rivera"}', now(), now(), '', '')
  returning id into v_admin_uid;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'manager@soloinsight.com', crypt('Password123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Chandrasekaran"}', now(), now(), '', '')
  returning id into v_manager_uid;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'sdr1@soloinsight.com', crypt('Password123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Blake"}', now(), now(), '', '')
  returning id into v_sdr1_uid;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'sdr2@soloinsight.com', crypt('Password123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Casey Nakamura"}', now(), now(), '', '')
  returning id into v_sdr2_uid;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
     'sdr3@soloinsight.com', crypt('Password123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Morgan Ellis"}', now(), now(), '', '')
  returning id into v_sdr3_uid;

  -- Fix up roles / team / mark 2FA already enabled for the demo admin & manager
  update public.profiles set role = 'admin', team_id = v_team_id, two_factor_enabled = true where user_id = v_admin_uid returning id into v_admin_id;
  update public.profiles set role = 'manager', team_id = v_team_id, two_factor_enabled = true where user_id = v_manager_uid returning id into v_manager_id;
  update public.profiles set role = 'sdr', team_id = v_team_id, two_factor_enabled = true where user_id = v_sdr1_uid returning id into v_sdr1_id;
  update public.profiles set role = 'sdr', team_id = v_team_id, two_factor_enabled = false where user_id = v_sdr2_uid returning id into v_sdr2_id;
  update public.profiles set role = 'sdr', team_id = v_team_id, two_factor_enabled = true where user_id = v_sdr3_uid returning id into v_sdr3_id;

  update public.teams set created_by = v_admin_id where id = v_team_id;

  v_owner_ids := array[v_sdr1_id, v_sdr2_id, v_sdr3_id, v_manager_id];

  -- ---------------- ACCOUNTS (20) ----------------
  for i in 1..20 loop
    insert into public.accounts (
      company_name, domain, industry, region, company_size, source, status, priority, icp_score,
      owner_id, created_by, last_touched_at, next_follow_up_at, notes
    ) values (
      v_companies[i],
      lower(regexp_replace(split_part(v_companies[i],' ',1),'[^a-zA-Z]','','g')) || '.com',
      v_industries[((i - 1) % n_industries) + 1],
      v_regions[((i - 1) % array_length(v_regions,1)) + 1],
      v_sizes[((i - 1) % array_length(v_sizes,1)) + 1],
      v_sources[((i - 1) % array_length(v_sources,1)) + 1],
      v_acct_statuses[((i - 1) % array_length(v_acct_statuses,1)) + 1],
      v_priorities[((i - 1) % array_length(v_priorities,1)) + 1],
      (20 + (i * 7) % 80),
      v_owner_ids[((i - 1) % array_length(v_owner_ids,1)) + 1],
      v_owner_ids[((i - 1) % array_length(v_owner_ids,1)) + 1],
      now() - ((i * 2) || ' days')::interval,
      now() + ((i % 10 - 4) || ' days')::interval,
      'Sourced via ' || v_sources[((i - 1) % array_length(v_sources,1)) + 1] || '. Physical access governance fit — ICP review pending.'
    )
    returning id into v_account_id;

    v_account_ids := array_append(v_account_ids, v_account_id);

    -- 2-4 contacts per account (~60 total)
    n_contacts := 2 + (i % 3);
    for j in 1..n_contacts loop
      v_contact_owner := v_owner_ids[((i + j - 1) % array_length(v_owner_ids,1)) + 1];
      insert into public.contacts (
        account_id, first_name, last_name, title, email, phone, linkedin_url,
        status, lifecycle_stage, priority, owner_id, created_by,
        last_contacted_at, next_follow_up_at, notes
      ) values (
        v_account_id,
        v_first_names[((i * 3 + j) % array_length(v_first_names,1)) + 1],
        v_last_names[((i * 5 + j) % array_length(v_last_names,1)) + 1],
        v_titles[((i + j) % array_length(v_titles,1)) + 1],
        lower(v_first_names[((i * 3 + j) % array_length(v_first_names,1)) + 1] || '.' ||
              v_last_names[((i * 5 + j) % array_length(v_last_names,1)) + 1] || '@example.com'),
        '555-' || lpad(((i * 13 + j * 7) % 900 + 100)::text, 3, '0') || '-' || lpad(((i * 29 + j) % 9000 + 1000)::text, 4, '0'),
        'https://linkedin.com/in/' || lower(v_first_names[((i * 3 + j) % array_length(v_first_names,1)) + 1] || '-' ||
              v_last_names[((i * 5 + j) % array_length(v_last_names,1)) + 1]),
        v_contact_statuses[((i + j) % array_length(v_contact_statuses,1)) + 1],
        (array['lead','engaged','qualified','opportunity'])[((i+j) % 4) + 1],
        v_priorities[((i + j) % array_length(v_priorities,1)) + 1],
        v_contact_owner,
        v_contact_owner,
        now() - ((j * 3) || ' days')::interval,
        now() + (((i + j) % 12 - 5) || ' days')::interval,
        'Engaged via manual outreach. Physical/security governance buyer persona.'
      )
      returning id into v_contact_id;

      v_contact_ids := array_append(v_contact_ids, v_contact_id);
    end loop;
  end loop;

  -- ---------------- ACTIVITIES (~100) ----------------
  for i in 1..100 loop
    v_contact_id := v_contact_ids[((i * 7) % array_length(v_contact_ids,1)) + 1];
    declare
      v_type public.activity_type := v_activity_types[((i * 3) % array_length(v_activity_types,1)) + 1];
      v_owner uuid;
      v_acct uuid;
    begin
      select owner_id, account_id into v_owner, v_acct from public.contacts where id = v_contact_id;

      insert into public.activities (
        account_id, contact_id, activity_type, channel, subject, notes, outcome, call_outcome,
        next_follow_up_at, created_by, created_at
      ) values (
        v_acct,
        v_contact_id,
        v_type,
        (case v_type when 'email' then 'email' when 'call' then 'phone' when 'linkedin' then 'linkedin'
             when 'meeting' then 'in_person' else 'other' end)::public.activity_channel,
        case when v_type = 'email' then v_email_subjects[((i) % array_length(v_email_subjects,1)) + 1] else null end,
        case v_type
          when 'email' then 'Sent manual outreach email. Awaiting reply.'
          when 'call' then 'Logged manual call attempt.'
          when 'linkedin' then 'Sent LinkedIn connection + note.'
          when 'meeting' then 'Discovery call booked and confirmed.'
          else 'Internal note logged by rep.'
        end,
        case when i % 5 = 0 then 'Positive reply' when i % 7 = 0 then 'Not interested' else 'No response yet' end,
        case when v_type = 'call' then v_call_outcomes[((i) % array_length(v_call_outcomes,1)) + 1] else null end,
        case when i % 4 = 0 then now() + ((i % 9 + 1) || ' days')::interval else null end,
        coalesce(v_owner, v_admin_id),
        now() - ((i % 30) || ' days')::interval - ((i % 24) || ' hours')::interval
      );
      n_activities := n_activities + 1;
    end;
  end loop;

  -- ---------------- TASKS / FOLLOW UPS (~30) ----------------
  for i in 1..30 loop
    v_contact_id := v_contact_ids[((i * 11) % array_length(v_contact_ids,1)) + 1];
    declare
      v_owner uuid;
      v_acct uuid;
    begin
      select owner_id, account_id into v_owner, v_acct from public.contacts where id = v_contact_id;
      insert into public.tasks (
        account_id, contact_id, title, description, due_date, status, priority, assigned_to, created_by
      ) values (
        v_acct,
        v_contact_id,
        case (i % 4)
          when 0 then 'Second touch follow-up call'
          when 1 then 'Send follow-up email with case study'
          when 2 then 'Confirm meeting time'
          else 'Check in after voicemail'
        end,
        'Auto-generated follow-up task from outreach cadence.',
        now() + ((i % 14 - 6) || ' days')::interval,
        (case when i % 6 = 0 then 'completed' when i % 5 = 0 then 'snoozed' else 'open' end)::public.task_status,
        v_priorities[((i) % array_length(v_priorities,1)) + 1],
        coalesce(v_owner, v_sdr1_id),
        coalesce(v_owner, v_sdr1_id)
      );
      n_tasks := n_tasks + 1;
    end;
  end loop;

  raise notice 'Seed complete: % accounts, % contacts, % activities, % tasks',
    array_length(v_account_ids,1), array_length(v_contact_ids,1), n_activities, n_tasks;
end;
$$;
