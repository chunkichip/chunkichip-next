-- Apply once through the Supabase connector. Voting stays closed until email delivery is tested.
begin;

create table if not exists public.archive_flavors (
  name text primary key,
  eligible boolean not null default true
);
create table if not exists public.archive_voting_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false
);
insert into public.archive_voting_settings (id, enabled) values (true, false) on conflict do nothing;

create table if not exists public.archive_ballots (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  choices text[] not null check (cardinality(choices) between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.archive_flavors enable row level security;
alter table public.archive_voting_settings enable row level security;
alter table public.archive_ballots enable row level security;

revoke all on public.archive_flavors, public.archive_voting_settings, public.archive_ballots from anon, authenticated;
grant select on public.archive_ballots to authenticated;
drop policy if exists archive_read_own_ballot on public.archive_ballots;
create policy archive_read_own_ballot on public.archive_ballots for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.archive_voting_status()
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'enabled', coalesce((select enabled from public.archive_voting_settings where id = true), false),
    'week_start', date_trunc('week', now() at time zone 'America/New_York')::date,
    'resets_at', (date_trunc('week', now() at time zone 'America/New_York') + interval '1 week') at time zone 'America/New_York'
  );
$$;

create or replace function public.submit_archive_ballot(p_choices text[])
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  voter uuid := auth.uid();
  current_week date := date_trunc('week', now() at time zone 'America/New_York')::date;
begin
  if voter is null or not exists (
    select 1 from auth.users where id = voter and email_confirmed_at is not null and coalesce(is_anonymous, false) = false
  ) then
    raise exception 'Verify your email before voting.' using errcode = '42501';
  end if;
  if not coalesce((select enabled from public.archive_voting_settings where id = true), false) then
    raise exception 'Comeback voting is currently closed.';
  end if;
  if p_choices is null or cardinality(p_choices) not between 1 and 3
    or (select count(distinct choice) from unnest(p_choices) as choice) <> cardinality(p_choices)
    or exists (select 1 from unnest(p_choices) as choice where choice is null or not exists (
      select 1 from public.archive_flavors as flavor where flavor.name = choice and flavor.eligible
    )) then
    raise exception 'Choose one to three different archive flavors.';
  end if;
  insert into public.archive_ballots (user_id, week_start, choices) values (voter, current_week, p_choices)
    on conflict (user_id, week_start) do nothing;
  if not found then
    raise exception 'You have already voted this week.';
  end if;
  return jsonb_build_object('saved', true, 'week_start', current_week, 'choices', p_choices);
end;
$$;
revoke all on function public.archive_voting_status() from public;
revoke all on function public.submit_archive_ballot(text[]) from public;
grant execute on function public.archive_voting_status() to anon, authenticated;
grant execute on function public.submit_archive_ballot(text[]) to authenticated;

insert into public.archive_flavors (name) values
  ('Apple Cider Donut'),
  ('Banana Cream'),
  ('Blueberry Pancake'),
  ('Butterfinger'),
  ('Carrot Cake'),
  ('Chai Frosted Sugar'),
  ('Chocolate Chip Banana Bread'),
  ('Chocolate Chip Banana Nut Bread'),
  ('Chunki Chip Chiptinis'),
  ('Chunki Chip Cookie Dough Frosted'),
  ('Cinnamon Roll'),
  ('Circus Animal'),
  ('Cookie Monster'),
  ('Cookies & Scream'),
  ('Fluffernutter'),
  ('Froot Loops'),
  ('Frosted Birthday Cake'),
  ('Frosted Cookie Monster'),
  ('Frosted Toffee Crunch'),
  ('Fruity Pebbles'),
  ('Funfetti Brownie'),
  ('M&M'),
  ('M&M Krispy Treat'),
  ('Maple Cinnamon Roll'),
  ('Maple Walnut'),
  ('Monster Mash'),
  ('Oatmeal Apple Crisp'),
  ('Oatmeal Raisin'),
  ('Patriotic Cupcake'),
  ('Peach Cobbler'),
  ('Peanut Butter Cup Chiptinis'),
  ('Peanut Butter M&M'),
  ('Pecan Turtle Crunch'),
  ('Pistachio Cream'),
  ('Pumpkin Cheesecake'),
  ('Pumpkin Pie Pop-Tarts'),
  ('Red Velvet Oreo®'),
  ('Reese’s Pieces'),
  ('S’mores'),
  ('Snick Or Treat'),
  ('Spooky M&M’s Chiptinis'),
  ('Strawberry Cheesecake'),
  ('Strawberry Frosted Cupcake'),
  ('Vanilla Bean Iced Pumpkin Bread'),
  ('Blueberry Cheesecake'),
  ('Brown Sugar Pop-Tart'),
  ('Oatmeal Chocolate Chip'),
  ('Snickers')
on conflict (name) do nothing;

commit;

-- Private results: run in Supabase SQL Editor as project owner.
-- select week_start, choice as flavor, count(*) as votes
-- from public.archive_ballots cross join lateral unnest(choices) as choice
-- group by week_start, choice order by week_start desc, votes desc, flavor;
-- Enable only after production email verification has been tested:
-- update public.archive_voting_settings set enabled = true where id = true;
