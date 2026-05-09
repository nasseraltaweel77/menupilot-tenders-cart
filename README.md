# Tenders Cart

Tenders Cart is a branded restaurant ordering app built from the MenuPilot template. It includes a public menu, cart, checkout, WhatsApp orders, Moyasar payments, admin dashboard, accountant dashboard, Supabase production storage, and local development fallbacks.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase production storage
- Moyasar payment invoices
- Local mock/data fallback
- Local image uploads saved under `public/uploads`

## Brand Config

The Tenders Cart brand, menu, WhatsApp number, Moyasar env names, Supabase table names, categories, and menu items are controlled here:

```text
config/restaurants/tenders-cart.ts
```

The active restaurant registry is here:

```text
config/restaurants/index.ts
```

## Main Routes

- Home: `http://localhost:3000`
- Public menu: `http://localhost:3000/menu`
- Restaurant menu by slug: `http://localhost:3000/menu/tenders-cart`
- Admin login: `http://localhost:3000/admin/login`
- Admin dashboard: `http://localhost:3000/admin/dashboard`
- Admin items: `http://localhost:3000/admin/items`
- Admin orders: `http://localhost:3000/admin/orders`
- Accountant dashboard: `http://localhost:3000/admin/accounting`

## Local Setup

1. Open PowerShell.

2. Go to this project folder:

```powershell
cd "C:\Users\altaw\OneDrive\Documents\New project\menupilot-tenders-cart"
```

3. Install dependencies if `node_modules` is not present:

```powershell
npm.cmd install
```

4. Start the development server:

```powershell
npm.cmd run dev
```

5. Open:

```text
http://localhost:3000
```

## Local Login

Default local credentials are:

```text
Admin username: admin
Admin password: tenders123

Accountant username: accountant
Accountant password: tenders123
```

You can override these in `.env.local`.

## Environment Variables

Create `.env.local` from `.env.example` and fill production keys when needed:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_USERNAME=
ADMIN_PASSWORD=
ACCOUNTANT_USERNAME=
ACCOUNTANT_PASSWORD=
MOYASAR_SECRET_KEY=
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=
```

Important: update the Tenders Cart WhatsApp number in `config/restaurants/tenders-cart.ts` before going live. It is currently a placeholder because no official number was provided.

## Supabase

Run this file in the Supabase SQL Editor before deploying production storage:

```text
supabase/schema.sql
```

It creates:

- `tenders_menu_items`
- `tenders_orders`
- `tenders_pending_payments`
- `tenders_item_overrides`
- `tenders_item_images`
- `tenders_deleted_items`

## Backup

Back up this exact folder:

```text
C:\Users\altaw\OneDrive\Documents\New project\menupilot-tenders-cart
```

Do not omit:

- `app`
- `components`
- `config`
- `lib`
- `types`
- `public/uploads`
- `data`
- `supabase/schema.sql`
- `package.json`
- `package-lock.json`
- config files such as `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `eslint.config.mjs`

Generated folders such as `node_modules` and `.next` can be omitted from backups.

## Verification

```powershell
npm.cmd run build
```
