create table if not exists production_calendar_days (
  date date primary key,
  dough_day boolean not null default false,
  bake_day boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (dough_day or bake_day or notes is not null)
);

create index if not exists production_calendar_days_dough_idx
on production_calendar_days(dough_day)
where dough_day = true;

create index if not exists production_calendar_days_bake_idx
on production_calendar_days(bake_day)
where bake_day = true;

drop trigger if exists production_calendar_days_set_updated_at on production_calendar_days;
create trigger production_calendar_days_set_updated_at
before update on production_calendar_days
for each row execute function set_updated_at();

alter table production_calendar_days enable row level security;

drop policy if exists "Allow app access to production calendar days" on production_calendar_days;
create policy "Allow app access to production calendar days" on production_calendar_days
for all using (true) with check (true);
