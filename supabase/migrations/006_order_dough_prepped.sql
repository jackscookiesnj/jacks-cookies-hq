alter table orders
add column if not exists dough_prepped boolean not null default false;

create index if not exists orders_open_dough_prepped_idx
on orders(dough_prepped)
where status = 'open';
