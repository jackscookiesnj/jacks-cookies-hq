alter table production_calendar_days
add column if not exists shopping_day boolean not null default false,
add column if not exists packaging_day boolean not null default false;

alter table production_calendar_days
drop constraint if exists production_calendar_days_check;

alter table production_calendar_days
add constraint production_calendar_days_check
check (dough_day or bake_day or shopping_day or packaging_day or notes is not null);

alter table orders
add column if not exists cookie_size text not null default '2oz' check (cookie_size in ('2oz', '3oz')),
add column if not exists price_per_cookie numeric(10, 2) not null default 0 check (price_per_cookie >= 0),
add column if not exists cost_per_cookie numeric(10, 2) not null default 0.55 check (cost_per_cookie >= 0);

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

create index if not exists inventory_items_category_idx on inventory_items(category);

drop trigger if exists inventory_items_set_updated_at on inventory_items;
create trigger inventory_items_set_updated_at
before update on inventory_items
for each row execute function set_updated_at();

alter table inventory_items enable row level security;

drop policy if exists "Allow app access to inventory items" on inventory_items;
create policy "Allow app access to inventory items" on inventory_items
for all using (true) with check (true);
