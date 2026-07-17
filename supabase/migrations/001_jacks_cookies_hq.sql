create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('wholesale', 'individual')),
  name text not null,
  code text,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code)
);

create table if not exists invoice_sequences (
  prefix text primary key,
  next_number integer not null default 1 check (next_number > 0),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  customer_type text not null check (customer_type in ('wholesale', 'individual')),
  invoice_reference text not null,
  delivery_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'unpaid')),
  cookie_count integer not null default 0 check (cookie_count >= 0),
  revenue numeric(10, 2) not null default 0 check (revenue >= 0),
  dough_prep text,
  bake_list text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_type_idx on customers(type);
create index if not exists orders_delivery_date_idx on orders(delivery_date);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_payment_status_idx on orders(payment_status);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_at
before update on customers
for each row execute function set_updated_at();

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
before update on orders
for each row execute function set_updated_at();

create or replace function allocate_wholesale_invoice(prefix_value text)
returns text
language plpgsql
as $$
declare
  current_number integer;
begin
  if prefix_value is null or length(trim(prefix_value)) = 0 then
    raise exception 'Wholesale customers require an invoice prefix';
  end if;

  insert into invoice_sequences(prefix, next_number)
  values (upper(trim(prefix_value)), 2)
  on conflict (prefix)
  do update set
    next_number = invoice_sequences.next_number + 1,
    updated_at = now()
  returning next_number - 1 into current_number;

  return upper(trim(prefix_value)) || '-' || lpad(current_number::text, 3, '0');
end;
$$;

alter table customers enable row level security;
alter table invoice_sequences enable row level security;
alter table orders enable row level security;

drop policy if exists "Allow app access to customers" on customers;
create policy "Allow app access to customers" on customers
for all using (true) with check (true);

drop policy if exists "Allow app access to invoice sequences" on invoice_sequences;
create policy "Allow app access to invoice sequences" on invoice_sequences
for all using (true) with check (true);

drop policy if exists "Allow app access to orders" on orders;
create policy "Allow app access to orders" on orders
for all using (true) with check (true);
