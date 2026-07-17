create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customers
add column if not exists type text not null default 'wholesale',
add column if not exists name text not null default '',
add column if not exists code text,
add column if not exists contact_name text,
add column if not exists email text,
add column if not exists phone text,
add column if not exists address text,
add column if not exists notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'customers_type_check'
  ) then
    alter table customers
    add constraint customers_type_check check (type in ('wholesale', 'individual'));
  end if;
end;
$$;

create unique index if not exists customers_code_unique_idx
on customers(code)
where code is not null;

create table if not exists invoice_sequences (
  prefix text primary key,
  next_number integer not null default 1 check (next_number > 0),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table orders
add column if not exists customer_id uuid references customers(id) on delete restrict,
add column if not exists customer_type text not null default 'wholesale',
add column if not exists invoice_reference text not null default '',
add column if not exists delivery_date date not null default current_date,
add column if not exists status text not null default 'open',
add column if not exists payment_status text not null default 'unpaid',
add column if not exists cookie_size text not null default '2oz',
add column if not exists cookie_count integer not null default 0,
add column if not exists price_per_cookie numeric(10, 2) not null default 0,
add column if not exists cost_per_cookie numeric(10, 2) not null default 0.55,
add column if not exists revenue numeric(10, 2) not null default 0,
add column if not exists dough_prep text,
add column if not exists bake_list text,
add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_customer_type_check') then
    alter table orders add constraint orders_customer_type_check check (customer_type in ('wholesale', 'individual'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_status_check') then
    alter table orders add constraint orders_status_check check (status in ('open', 'closed'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_payment_status_check') then
    alter table orders add constraint orders_payment_status_check check (payment_status in ('paid', 'unpaid'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_cookie_size_check') then
    alter table orders add constraint orders_cookie_size_check check (cookie_size in ('2oz', '3oz'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_cookie_count_check') then
    alter table orders add constraint orders_cookie_count_check check (cookie_count >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_revenue_check') then
    alter table orders add constraint orders_revenue_check check (revenue >= 0);
  end if;
end;
$$;

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

create table if not exists production_calendar_days (
  date date primary key,
  dough_day boolean not null default false,
  bake_day boolean not null default false,
  shopping_day boolean not null default false,
  packaging_day boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists production_calendar_days_set_updated_at on production_calendar_days;
create trigger production_calendar_days_set_updated_at
before update on production_calendar_days
for each row execute function set_updated_at();

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'frozen dough',
  quantity numeric(10, 2) not null default 0 check (quantity >= 0),
  unit text not null default 'cookies',
  par_level numeric(10, 2) not null default 0 check (par_level >= 0),
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists production_calendar_days_dough_idx
on production_calendar_days(dough_day)
where dough_day = true;

create index if not exists production_calendar_days_bake_idx
on production_calendar_days(bake_day)
where bake_day = true;

create index if not exists inventory_items_category_idx on inventory_items(category);

drop trigger if exists inventory_items_set_updated_at on inventory_items;
create trigger inventory_items_set_updated_at
before update on inventory_items
for each row execute function set_updated_at();

alter table customers enable row level security;
alter table invoice_sequences enable row level security;
alter table orders enable row level security;
alter table production_calendar_days enable row level security;
alter table inventory_items enable row level security;

drop policy if exists "Allow app access to customers" on customers;
create policy "Allow app access to customers" on customers
for all using (true) with check (true);

drop policy if exists "Allow app access to invoice sequences" on invoice_sequences;
create policy "Allow app access to invoice sequences" on invoice_sequences
for all using (true) with check (true);

drop policy if exists "Allow app access to orders" on orders;
create policy "Allow app access to orders" on orders
for all using (true) with check (true);

drop policy if exists "Allow app access to production calendar days" on production_calendar_days;
create policy "Allow app access to production calendar days" on production_calendar_days
for all using (true) with check (true);

drop policy if exists "Allow app access to inventory items" on inventory_items;
create policy "Allow app access to inventory items" on inventory_items
for all using (true) with check (true);
