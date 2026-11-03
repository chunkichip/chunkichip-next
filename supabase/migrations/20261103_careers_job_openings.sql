create table if not exists public.job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  location text not null default 'Milford, NH' check (char_length(btrim(location)) between 2 and 120),
  employment_type text check (employment_type is null or char_length(employment_type) <= 80),
  description text not null check (char_length(btrim(description)) between 10 and 3000),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.job_openings enable row level security;
revoke all on public.job_openings from public, anon, authenticated;
grant select on public.job_openings to anon;

drop policy if exists "Anyone can view active job openings" on public.job_openings;
create policy "Anyone can view active job openings"
  on public.job_openings for select to anon
  using (is_active = true);
