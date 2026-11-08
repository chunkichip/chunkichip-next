-- Applied through Supabase migration catering_requests.
create table public.catering_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, phone text not null,
  event_date date not null, event_type text not null default '',
  quantity text not null, fulfillment text not null default '', details text not null,
  status text not null default 'New', created_at timestamptz not null default now()
);
alter table public.catering_requests enable row level security;
revoke all on public.catering_requests from anon, authenticated;
grant select on public.catering_requests to authenticated;
grant update(status) on public.catering_requests to authenticated;
grant select, insert on public.catering_requests to service_role;
create policy "Owners read catering requests" on public.catering_requests for select to authenticated
using ((select auth.jwt()->'app_metadata'->>'site_admin')='true');
create policy "Owners update catering request status" on public.catering_requests for update to authenticated
using ((select auth.jwt()->'app_metadata'->>'site_admin')='true')
with check ((select auth.jwt()->'app_metadata'->>'site_admin')='true');
create index catering_requests_created_idx on public.catering_requests(created_at desc);
