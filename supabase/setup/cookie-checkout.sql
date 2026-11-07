create table public.cookie_checkout_sessions (
 id uuid primary key,
 token_hash text not null,
 square_order_id text not null unique,
 location_id text not null,
 location_name text not null,
 method text not null check (method in ('pickup','curbside','shipping')),
 amount integer not null check (amount > 0),
 status text not null default 'open' check (status in ('open','paying','paid','canceling','canceled','attention')),
 contact jsonb,
 payments jsonb not null default '[]',
 operation jsonb,
 receipt_url text,
 loyalty_done boolean not null default false,
 lease uuid,
 lease_until timestamptz not null default 'epoch',
 expires_at timestamptz not null default (now() + interval '30 minutes'),
 created_at timestamptz not null default now()
);
alter table public.cookie_checkout_sessions enable row level security;
revoke all on public.cookie_checkout_sessions from public,anon,authenticated;
grant select,insert,update on public.cookie_checkout_sessions to service_role;
create index cookie_checkout_recovery on public.cookie_checkout_sessions(expires_at) where status in ('open','paying','canceling') or (status='paid' and loyalty_done=false);
