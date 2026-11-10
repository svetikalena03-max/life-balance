-- Care diary: owner-only access; do not copy private data to shared family tables.
create table if not exists public.care_recipients (
 id uuid primary key default gen_random_uuid(),
 owner_user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null check (length(btrim(display_name)) between 1 and 100),
 consent_confirmed boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists care_recipients_owner_idx on public.care_recipients(owner_user_id);
alter table public.care_recipients enable row level security;
create policy "care_recipients_owner_select" on public.care_recipients for select to authenticated using (owner_user_id = (select auth.uid()));
create policy "care_recipients_owner_insert" on public.care_recipients for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "care_recipients_owner_update" on public.care_recipients for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy "care_recipients_owner_delete" on public.care_recipients for delete to authenticated using (owner_user_id = (select auth.uid()));

create table if not exists public.care_events (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.care_recipients(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,
 event_at timestamptz not null default now(),
 category text not null check (category in ('bp','medication','meal','hydration','hygiene','position','wellbeing','caregiver_visit','note')),
 details text not null check(length(details) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists care_events_recipient_time_idx on public.care_events(recipient_id,event_at desc);
alter table public.care_events enable row level security;
create policy "care_events_owner_select" on public.care_events for select to authenticated using (
 created_by = (select auth.uid()) and exists(select 1 from public.care_recipients r where r.id = recipient_id and r.owner_user_id = (select auth.uid()))
);
create policy "care_events_owner_insert" on public.care_events for insert to authenticated with check (
 created_by = (select auth.uid()) and exists(select 1 from public.care_recipients r where r.id = recipient_id and r.owner_user_id = (select auth.uid()))
);
create policy "care_events_owner_update" on public.care_events for update to authenticated using (
 created_by = (select auth.uid()) and exists(select 1 from public.care_recipients r where r.id = recipient_id and r.owner_user_id = (select auth.uid()))
) with check (
 created_by = (select auth.uid()) and exists(select 1 from public.care_recipients r where r.id = recipient_id and r.owner_user_id = (select auth.uid()))
);
create policy "care_events_owner_delete" on public.care_events for delete to authenticated using (
 created_by = (select auth.uid()) and exists(select 1 from public.care_recipients r where r.id = recipient_id and r.owner_user_id = (select auth.uid()))
);
