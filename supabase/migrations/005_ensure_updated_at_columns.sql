alter table customers
add column if not exists updated_at timestamptz not null default now(),
add column if not exists created_at timestamptz not null default now();

alter table orders
add column if not exists updated_at timestamptz not null default now(),
add column if not exists created_at timestamptz not null default now();

alter table invoice_sequences
add column if not exists updated_at timestamptz not null default now();

alter table production_calendar_days
add column if not exists updated_at timestamptz not null default now(),
add column if not exists created_at timestamptz not null default now();

alter table inventory_items
add column if not exists updated_at timestamptz not null default now(),
add column if not exists created_at timestamptz not null default now();
