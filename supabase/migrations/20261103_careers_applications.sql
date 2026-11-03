create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null check (char_length(btrim(applicant_name)) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  phone text check (phone is null or char_length(phone) <= 40),
  role text not null check (char_length(btrim(role)) between 2 and 120),
  experience text not null check (char_length(btrim(experience)) between 20 and 3000),
  created_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;

revoke all on public.job_applications from public, anon, authenticated;
grant insert on public.job_applications to anon;

drop policy if exists "Anyone can submit a job application" on public.job_applications;
create policy "Anyone can submit a job application"
  on public.job_applications for insert to anon
  with check (true);
