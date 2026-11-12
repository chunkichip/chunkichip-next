-- Owner-only production data. All access is through the authenticated server API.
create table public.production_flavors (
 id text primary key check (id ~ '^[a-f0-9]{24}$'),
 name text not null check (length(name) between 2 and 100),
 kind text not null check (kind in ('full','mini')),
 created_at timestamptz not null default now()
);
create table public.production_orders (
 id text primary key,location_id text not null,version integer not null,
 business_date date not null,advance_order boolean not null,state text not null,
 paid boolean not null,ticket text not null,counts jsonb not null default '[]'::jsonb,
 issues jsonb not null default '[]'::jsonb,updated_at timestamptz not null,
 check (jsonb_typeof(counts)='array'),check (jsonb_typeof(issues)='array')
);
create index production_orders_location_day on public.production_orders(location_id,business_date,id);
create table public.production_events (
 id uuid primary key,location_id text not null,business_date date not null,
 flavor_id text not null references public.production_flavors(id),
 kind text not null check(kind in ('opening','bake','waste','adjustment','target','manual_sale')),
 quantity integer not null check(abs(quantity)<=100000),
 note text not null default '' check(length(note)<=300),
 created_by uuid not null,created_at timestamptz not null default now(),
 check(kind='adjustment' or quantity>=0)
);
create index production_events_location_day on public.production_events(location_id,business_date,created_at,id);
create table public.production_syncs (
 id uuid primary key,location_id text not null,history_from date,
 finished_at timestamptz not null,orders_processed integer not null
);
create index production_syncs_location_time on public.production_syncs(location_id,finished_at desc);
alter table public.production_flavors enable row level security;
alter table public.production_orders enable row level security;
alter table public.production_events enable row level security;
alter table public.production_syncs enable row level security;
revoke all on public.production_flavors,public.production_orders,public.production_events,public.production_syncs from anon,authenticated;
grant select,insert,update,delete on public.production_flavors,public.production_orders,public.production_events,public.production_syncs to service_role;

create table public.production_reviews (
 id text primary key,order_id text not null references public.production_orders(id),
 order_version integer not null,location_id text not null,business_date date not null,
 counts jsonb not null check(jsonb_typeof(counts)='array'),
 note text not null check(length(note) between 5 and 300),created_by uuid not null,
 updated_at timestamptz not null,unique(order_id,order_version)
);
create index production_reviews_location_day on public.production_reviews(location_id,business_date,id);
alter table public.production_reviews enable row level security;
revoke all on public.production_reviews from anon,authenticated;
grant select,insert,update,delete on public.production_reviews to service_role;
