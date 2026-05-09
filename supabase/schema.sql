-- MenuPilot / Roma Pastry production schema
-- Run this whole file in the Supabase SQL Editor.
-- It is idempotent: safe to run again after future deployments.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Original MenuPilot MVP tables
-- Kept for compatibility with the first SaaS foundation.
-- The current Roma Pastry production flow uses the roma_* tables below.
-- ---------------------------------------------------------------------------

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  phone text,
  currency text not null default 'SAR',
  created_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name_en text not null,
  name_ar text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

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
      select 1
      from pg_enum
      where enumlabel = 'Paid'
      and enumtypid = 'public.order_status'::regtype
    ) then
      alter type public.order_status add value 'Paid' after 'New';
    end if;
  end if;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  notes text,
  status public.order_status not null default 'New',
  total numeric(10, 2) not null check (total >= 0),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Roma Pastry production tables
-- These are used by Vercel server code with SUPABASE_SERVICE_ROLE_KEY.
-- ---------------------------------------------------------------------------

create table if not exists public.roma_orders (
  id text primary key,
  order_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.roma_orders
  add column if not exists order_data jsonb,
  add column if not exists created_at timestamptz default now();

create table if not exists public.roma_pending_payments (
  id text primary key,
  invoice_id text unique,
  status text not null default 'initiated',
  payment_data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.roma_pending_payments
  add column if not exists invoice_id text,
  add column if not exists status text not null default 'initiated',
  add column if not exists payment_data jsonb,
  add column if not exists created_at timestamptz default now();

create table if not exists public.roma_menu_items (
  item_id text primary key,
  item_data jsonb not null,
  is_deleted boolean not null default false,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.roma_menu_items
  add column if not exists item_data jsonb,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists sort_order int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Legacy Roma tables kept only so older deployed code does not crash.
-- Current code writes menu data to roma_menu_items.
create table if not exists public.roma_item_overrides (
  item_id text primary key,
  item_data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.roma_item_images (
  item_id text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.roma_deleted_items (
  item_id text primary key,
  deleted_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists menu_categories_restaurant_id_idx on public.menu_categories(restaurant_id);
create index if not exists menu_items_restaurant_id_idx on public.menu_items(restaurant_id);
create index if not exists menu_items_category_id_idx on public.menu_items(category_id);
create index if not exists orders_restaurant_id_created_at_idx on public.orders(restaurant_id, created_at desc);
create index if not exists roma_orders_created_at_idx on public.roma_orders(created_at desc);
create index if not exists roma_pending_payments_invoice_id_idx on public.roma_pending_payments(invoice_id);
create index if not exists roma_pending_payments_status_idx on public.roma_pending_payments(status);
create index if not exists roma_menu_items_sort_order_idx on public.roma_menu_items(sort_order);
create index if not exists roma_menu_items_deleted_idx on public.roma_menu_items(is_deleted);

-- RLS is enabled. The current Next.js server uses SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS. Do not expose the service role key in client code.
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.roma_orders enable row level security;
alter table public.roma_pending_payments enable row level security;
alter table public.roma_menu_items enable row level security;
alter table public.roma_item_overrides enable row level security;
alter table public.roma_item_images enable row level security;
alter table public.roma_deleted_items enable row level security;

-- Original SaaS policies
drop policy if exists "Owners can manage restaurants" on public.restaurants;
create policy "Owners can manage restaurants"
on public.restaurants
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
on public.restaurants
for select
using (true);

drop policy if exists "Owners can manage categories" on public.menu_categories;
create policy "Owners can manage categories"
on public.menu_categories
for all
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_categories.restaurant_id
    and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_categories.restaurant_id
    and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Public can read categories" on public.menu_categories;
create policy "Public can read categories"
on public.menu_categories
for select
using (true);

drop policy if exists "Owners can manage items" on public.menu_items;
create policy "Owners can manage items"
on public.menu_items
for all
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
    and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = menu_items.restaurant_id
    and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Public can read available items" on public.menu_items;
create policy "Public can read available items"
on public.menu_items
for select
using (is_available = true);

drop policy if exists "Owners can manage orders" on public.orders;
create policy "Owners can manage orders"
on public.orders
for all
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = orders.restaurant_id
    and restaurants.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = orders.restaurant_id
    and restaurants.owner_id = auth.uid()
  )
);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
with check (true);

-- ---------------------------------------------------------------------------
-- Roma Pastry menu seed
-- Images are stored in Supabase as persistent item_data.image_url values.
-- Existing bundled /uploads images are used for items that already have assets.
-- Production uploads are saved back into this same JSON field.
-- ---------------------------------------------------------------------------

insert into public.roma_menu_items (item_id, item_data, is_deleted, sort_order, updated_at)
values
(
  'item-original',
  '{
    "id": "item-original",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-millefeuille",
    "name_en": "Original Millefeuille Bites",
    "name_ar": "ميلفيه بايتس أورجنال",
    "description_en": "Crispy millefeuille layers filled with silky mousseline cream and finished with a refined French touch.",
    "description_ar": "طبقات ميلفيه هشة محشية بكريمة الموسلين الكريمية بلمسة فرنسية فاخرة.",
    "price": 175,
    "image_url": "/uploads/item-original-1778111455841.jpeg",
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  1,
  now()
),
(
  'item-mix',
  '{
    "id": "item-mix",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-millefeuille",
    "name_en": "Mixed Millefeuille Bites",
    "name_ar": "ميلفيه بايتس مكس",
    "description_en": "An elegant mixed box of Roma millefeuille bites with assorted refined fillings.",
    "description_ar": "بوكس أنيق من ميلفيه روما بايتس بتشكيلة حشوات فاخرة ومتنوعة.",
    "price": 185,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  2,
  now()
),
(
  'item-savory',
  '{
    "id": "item-savory",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-millefeuille",
    "name_en": "Savory Millefeuille Bites",
    "name_ar": "ميلفيه بايتس مالح",
    "description_en": "A premium assortment of savory millefeuille selections with rich gourmet fillings.",
    "description_ar": "تشكيلة ميلفيه مالحة بحشوات فاخرة ومتنوعة مناسبة للتقديم والمناسبات.",
    "price": 178,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  3,
  now()
),
(
  'item-signature',
  '{
    "id": "item-signature",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-signature",
    "name_en": "Roma Signature",
    "name_ar": "روما سيجنتشر",
    "description_en": "French layered cake with joconde sponge, coffee cream, and dark chocolate ganache.",
    "description_ar": "كيك فرنسي بطبقات الجوكند وكريمة القهوة وجاناش الشوكولاتة الداكنة.",
    "price": 180,
    "image_url": "/uploads/item-signature-1778115230042.jpeg",
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  4,
  now()
),
(
  'item-madrid-classic',
  '{
    "id": "item-madrid-classic",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-cheesecakes",
    "name_en": "Madrid Classic Cheesecake",
    "name_ar": "تشيز كيك مدريد كلاسيك",
    "description_en": "Rich and creamy cheesecake with a refined French touch and a smooth melt-in-your-mouth texture.",
    "description_ar": "تشيز كيك كريمي غني بلمسة فرنسية كلاسيكية وقوام ناعم يذوب بالفم.",
    "price": 200,
    "image_url": "/uploads/item-madrid-classic-1778115397813.jpeg",
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  5,
  now()
),
(
  'item-madrid-mix',
  '{
    "id": "item-madrid-mix",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-cheesecakes",
    "name_en": "Madrid Mixed Cheesecake",
    "name_ar": "تشيز كيك مدريد مكس",
    "description_en": "A mixed cheesecake selection made for sharing, gifting, and refined dessert tables.",
    "description_ar": "تشكيلة تشيز كيك مدريد مكس للتقديم والمشاركة والهدايا الفاخرة.",
    "price": 210,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  6,
  now()
),
(
  'item-chocolate-madrid',
  '{
    "id": "item-chocolate-madrid",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-cheesecakes",
    "name_en": "Chocolate Madrid Cheesecake",
    "name_ar": "تشوكلت مدريد تشيز كيك",
    "description_en": "Luxurious chocolate cheesecake with creamy layers and a deep balanced cocoa flavor.",
    "description_ar": "تشيز كيك شوكولاتة فاخر بطبقات كريمية ونكهة كاكاو عميقة ومتوازنة.",
    "price": 200,
    "image_url": "/uploads/item-chocolate-madrid-1778115483830.jpeg",
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  7,
  now()
),
(
  'item-italian-french-box',
  '{
    "id": "item-italian-french-box",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-italian-french",
    "name_en": "Italian & French Desserts Box",
    "name_ar": "بوكس الحلويات الإيطالية والفرنسية",
    "description_en": "A boutique dessert box inspired by Italian and French pastry classics.",
    "description_ar": "بوكس حلويات فاخر مستوحى من كلاسيكيات الحلويات الإيطالية والفرنسية.",
    "price": 220,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  8,
  now()
),
(
  'item-eclair-platter',
  '{
    "id": "item-eclair-platter",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-platters",
    "name_en": "Eclair Platter",
    "name_ar": "إكلير بلاتر",
    "description_en": "An elegant eclair platter with polished finishes and refined pastry cream.",
    "description_ar": "بلاتر إكلير أنيق بتشطيبات فاخرة وكريمة باتسيير راقية.",
    "price": 190,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  9,
  now()
),
(
  'item-roma-show',
  '{
    "id": "item-roma-show",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-platters",
    "name_en": "Roma Show",
    "name_ar": "روما شو",
    "description_en": "A statement Roma platter designed for celebrations, gatherings, and premium gifting.",
    "description_ar": "بلاتر روما فاخر مصمم للاحتفالات والجمعات والهدايا الراقية.",
    "price": 260,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  10,
  now()
),
(
  'item-macaron',
  '{
    "id": "item-macaron",
    "restaurant_id": "roma-pastry",
    "category_id": "cat-macarons",
    "name_en": "Macarons",
    "name_ar": "ماكرون",
    "description_en": "Delicate French macarons with refined textures and elegant flavors.",
    "description_ar": "ماكرون فرنسي ناعم بقوام راق ونكهات أنيقة.",
    "price": 150,
    "image_url": null,
    "is_available": true,
    "created_at": "2026-05-07T00:00:00.000Z"
  }'::jsonb,
  false,
  11,
  now()
)
on conflict (item_id) do update
set
  item_data = excluded.item_data,
  is_deleted = false,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Optional quick checks after running this file:
-- select count(*) as roma_menu_item_count from public.roma_menu_items where is_deleted = false;
-- select item_id, item_data->>'name_ar' as name_ar, item_data->>'image_url' as image_url from public.roma_menu_items order by sort_order;
