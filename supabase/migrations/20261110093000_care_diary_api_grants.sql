-- Data API permissions; RLS policies in the preceding migration isolate owners.
revoke all on table public.care_recipients, public.care_events from anon;
revoke all on table public.care_recipients, public.care_events from authenticated;
grant select, insert, update, delete on table public.care_recipients, public.care_events to authenticated;
