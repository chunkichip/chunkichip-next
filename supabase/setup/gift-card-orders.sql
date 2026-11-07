create table public.gift_card_orders (
 id uuid primary key,
 token_hash text not null,
 fingerprint text not null,
 amount integer not null check (amount between 500 and 50000),
 design_id text not null,
 recipient_name text not null,
 recipient_email text not null,
 buyer_name text not null,
 buyer_email text not null,
 message text not null default '',
 location_id text not null,
 status text not null default 'pending' check (status in ('pending','processing','paid','sent','payment_failed','attention')),
 square_order_id text unique,
 payment_id text unique,
 gift_card_id text unique,
 receipt_url text,
 email_id text,
 email_started_at timestamptz,
 sent_at timestamptz,
 attempts integer not null default 0,
 lease uuid,
 lease_until timestamptz not null default '1970-01-01',
 next_retry timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.gift_card_orders enable row level security;
revoke all on public.gift_card_orders from anon, authenticated, public;
grant select, insert, update on public.gift_card_orders to service_role;
create index gift_card_orders_work on public.gift_card_orders (next_retry,created_at) where status in ('pending','processing','paid');