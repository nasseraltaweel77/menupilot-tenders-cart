-- Tenders Cart production schema
-- Run this whole file in the Supabase SQL Editor.
-- It is idempotent and safe to run again after future deployments.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status' and typnamespace = 'public'::regnamespace) then
    create type public.order_status as enum ('New', 'Paid', 'Preparing', 'Ready', 'Delivered', 'Cancelled');
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'order_status' and typnamespace = 'public'::regnamespace) then
    if not exists (
      select 1 from pg_enum
      where enumlabel = 'Paid'
      and enumtypid = 'public.order_status'::regtype
    ) then
      alter type public.order_status add value 'Paid' after 'New';
    end if;
  end if;
end $$;

create table if not exists public.tenders_orders (
  id text primary key,
  order_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.tenders_orders
  add column if not exists order_data jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.tenders_pending_payments (
  id text primary key,
  invoice_id text unique,
  status text not null default 'initiated',
  payment_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.tenders_pending_payments
  add column if not exists invoice_id text,
  add column if not exists status text not null default 'initiated',
  add column if not exists payment_data jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.tenders_menu_items (
  item_id text primary key,
  item_data jsonb not null,
  is_deleted boolean not null default false,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.tenders_menu_items
  add column if not exists item_data jsonb,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists sort_order int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.tenders_item_overrides (
  item_id text primary key,
  item_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.tenders_item_overrides
  add column if not exists item_data jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.tenders_item_images (
  item_id text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.tenders_item_images
  add column if not exists image_url text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.tenders_deleted_items (
  item_id text primary key,
  deleted_at timestamptz not null default now()
);

alter table public.tenders_deleted_items
  add column if not exists deleted_at timestamptz not null default now();

create index if not exists tenders_orders_created_at_idx on public.tenders_orders(created_at desc);
create index if not exists tenders_pending_payments_invoice_id_idx on public.tenders_pending_payments(invoice_id);
create index if not exists tenders_pending_payments_status_idx on public.tenders_pending_payments(status);
create index if not exists tenders_menu_items_sort_order_idx on public.tenders_menu_items(sort_order);
create index if not exists tenders_menu_items_deleted_idx on public.tenders_menu_items(is_deleted);

alter table public.tenders_orders enable row level security;
alter table public.tenders_pending_payments enable row level security;
alter table public.tenders_menu_items enable row level security;
alter table public.tenders_item_overrides enable row level security;
alter table public.tenders_item_images enable row level security;
alter table public.tenders_deleted_items enable row level security;

-- Server routes use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Never expose the service role key in client-side code.

insert into public.tenders_menu_items (item_id, item_data, is_deleted, sort_order, updated_at)
values
('item-sos-burger', '{"id":"item-sos-burger","restaurant_id":"tenders-cart","category_id":"cat-burgers","name_en":"SOS Burger","name_ar":"برجر SOS","description_en":"Crispy chicken, soft bun, pickles, and bold SOS sauce.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":25,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 1, now()),
('item-original-burger', '{"id":"item-original-burger","restaurant_id":"tenders-cart","category_id":"cat-burgers","name_en":"Original Burger","name_ar":"برجر أوريجنال","description_en":"Golden chicken fillet with classic Tenders Cart flavor.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":25,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 2, now()),
('item-tc-mango-sandwich', '{"id":"item-tc-mango-sandwich","restaurant_id":"tenders-cart","category_id":"cat-burgers","name_en":"TC Mango Sandwich","name_ar":"ساندويتش TC مانجو","description_en":"Crispy chicken with sweet-spicy mango sauce.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":28,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 3, now()),
('item-sos-meal', '{"id":"item-sos-meal","restaurant_id":"tenders-cart","category_id":"cat-meals","name_en":"SOS Meal","name_ar":"وجبة SOS","description_en":"SOS burger served as a complete fast food meal.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":33,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 4, now()),
('item-original-meal', '{"id":"item-original-meal","restaurant_id":"tenders-cart","category_id":"cat-meals","name_en":"Original Meal","name_ar":"وجبة أوريجنال","description_en":"Original burger meal with a crispy premium bite.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":32,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 5, now()),
('item-tc-mango-meal', '{"id":"item-tc-mango-meal","restaurant_id":"tenders-cart","category_id":"cat-meals","name_en":"TC Mango Meal","name_ar":"وجبة TC مانجو","description_en":"Mango sandwich meal with a bright sweet-spicy finish.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":35,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 6, now()),
('item-3pcs-tenders', '{"id":"item-3pcs-tenders","restaurant_id":"tenders-cart","category_id":"cat-tenders","name_en":"3 PCS Chicken Tenders","name_ar":"3 قطع تندرز دجاج","description_en":"Three juicy chicken tenders fried until crisp.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":29,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 7, now()),
('item-5pcs-tenders', '{"id":"item-5pcs-tenders","restaurant_id":"tenders-cart","category_id":"cat-tenders","name_en":"5 PCS Chicken Tenders","name_ar":"5 قطع تندرز دجاج","description_en":"Five crispy tenders for bigger cravings.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":39,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 8, now()),
('item-3pcs-tenders-meal', '{"id":"item-3pcs-tenders-meal","restaurant_id":"tenders-cart","category_id":"cat-tenders","name_en":"3 PCS Chicken Tenders Meal","name_ar":"وجبة 3 قطع تندرز","description_en":"Three-piece tenders meal with the full Tenders Cart experience.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":36,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 9, now()),
('item-5pcs-tenders-meal', '{"id":"item-5pcs-tenders-meal","restaurant_id":"tenders-cart","category_id":"cat-tenders","name_en":"5 PCS Chicken Tenders Meal","name_ar":"وجبة 5 قطع تندرز","description_en":"Five-piece tenders meal made for serious crispy chicken fans.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":45,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 10, now()),
('item-chicken-wrap', '{"id":"item-chicken-wrap","restaurant_id":"tenders-cart","category_id":"cat-burgers","name_en":"Chicken Wrap","name_ar":"راب دجاج","description_en":"A quick crispy chicken wrap with signature flavor.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":14,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 11, now()),
('item-french-fries', '{"id":"item-french-fries","restaurant_id":"tenders-cart","category_id":"cat-sides","name_en":"French Fries","name_ar":"بطاطس مقلية","description_en":"Hot, golden, lightly salted fries.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":7,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 12, now()),
('item-mozzarella-sticks', '{"id":"item-mozzarella-sticks","restaurant_id":"tenders-cart","category_id":"cat-sides","name_en":"Mozzarella Sticks","name_ar":"أصابع موزاريلا","description_en":"Crispy mozzarella sticks with a melty center.","description_ar":"اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.","price":17,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 13, now()),
('item-bbq', '{"id":"item-bbq","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"BBQ","name_ar":"باربكيو","description_en":"Smoky BBQ sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":2,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 14, now()),
('item-ranch', '{"id":"item-ranch","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Ranch","name_ar":"رانش","description_en":"Creamy ranch sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":2,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 15, now()),
('item-mango', '{"id":"item-mango","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Mango","name_ar":"مانجو","description_en":"Sweet and tangy mango sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":3,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 16, now()),
('item-honey-mustard', '{"id":"item-honey-mustard","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Honey Mustard","name_ar":"هني مسترد","description_en":"Honey mustard sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":2,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 17, now()),
('item-mayo-sriracha', '{"id":"item-mayo-sriracha","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Mayo Sriracha","name_ar":"مايو سريراتشا","description_en":"Creamy spicy mayo sriracha.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":2,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 18, now()),
('item-garlic', '{"id":"item-garlic","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Garlic","name_ar":"ثوم","description_en":"Rich garlic sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":2,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 19, now()),
('item-cheese', '{"id":"item-cheese","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Cheese","name_ar":"جبن","description_en":"Warm cheese sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":3,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 20, now()),
('item-old-bay', '{"id":"item-old-bay","restaurant_id":"tenders-cart","category_id":"cat-sauces","name_en":"Old Bay","name_ar":"أولد باي","description_en":"Old Bay seasoned sauce.","description_ar":"صوص تندرز كارت بنكهة جريئة.","price":2,"image_url":null,"is_available":true,"created_at":"2026-05-09T00:00:00.000Z"}'::jsonb, false, 21, now())
on conflict (item_id) do update
set
  item_data = excluded.item_data,
  is_deleted = false,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Quick check:
-- select count(*) as tenders_menu_item_count from public.tenders_menu_items where is_deleted = false;
