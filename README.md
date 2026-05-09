# MenuPilot

MenuPilot is a reusable restaurant ordering platform template. Roma Pastry is the first default restaurant configuration and remains fully working as the current live brand.

The app supports a public menu, cart, checkout, WhatsApp orders, Moyasar payments, admin dashboard, accountant dashboard, Supabase-backed production storage, and local development fallbacks.

## Restaurant Config

Restaurant branding and defaults live in:

```text
config/restaurants/
```

Roma Pastry is configured in:

```text
config/restaurants/roma-pastry.ts
```

The restaurant registry and switcher helpers live in:

```text
config/restaurants/index.ts
```

Each restaurant config controls:

- name and slug
- aliases and future custom domains
- logo text or logo URL
- colors
- city, tagline, and description
- WhatsApp number
- social links
- Moyasar environment variable names
- Supabase table names
- order prefix
- categories
- menu items

To clone a new restaurant, copy `config/restaurants/roma-pastry.ts`, rename it, edit the fields, then register it in `config/restaurants/index.ts`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase production storage
- Local mock/data fallback
- Local image uploads saved under `public/uploads`

## Main Routes

- Home: `http://localhost:3000`
- Public menu: `http://localhost:3000/menu`
- Restaurant menu by slug: `http://localhost:3000/menu/roma`
- Admin login: `http://localhost:3000/admin/login`
- Admin dashboard: `http://localhost:3000/admin/dashboard`
- Admin items: `http://localhost:3000/admin/items`
- Admin orders: `http://localhost:3000/admin/orders`

## Local Setup

1. Open PowerShell.

2. Go to the project folder:

```powershell
cd "C:\Users\altaw\Documents\New project\MenuPilot"
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

## Image Uploads

Admin item images are stored locally:

```text
public/uploads/
```

The item-to-image mapping is stored locally:

```text
data/item-images.json
```

Edited mock item fields are stored locally:

```text
data/items.json
```

Keep both `public/uploads` and `data` when backing up or moving the project.

## Backup

Back up this exact folder:

```text
C:\Users\altaw\Documents\New project\MenuPilot
```

For a smaller backup, you may omit generated dependency/build folders such as `node_modules` and `.next`, then run `npm.cmd install` again after restoring.

Do not omit:

- `app`
- `components`
- `lib`
- `types`
- `public/uploads`
- `data`
- `package.json`
- `package-lock.json`
- config files such as `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `eslint.config.mjs`

## Deployment Notes

Vercel production uses Supabase/Moyasar environment variables. Local development can still use mock data and local uploads.

### Vercel

This project includes `vercel.json` and is ready to build on Vercel as a Next.js app.

Recommended Vercel settings:

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave blank
- Environment variables: add the Supabase, admin, accountant, and Moyasar keys used by your active restaurant config

Deploy steps:

1. Push or upload this project to GitHub.
2. Import the repository in Vercel.
3. Keep the default Next.js settings.
4. Deploy.

Important: local admin uploads and JSON order/item edits use `public/uploads` and `data/*.json`. These are kept for localhost and repository-backed demo content. For a real production restaurant system with persistent admin uploads/orders after deployment, move uploads and order data to Vercel Blob, Supabase Storage, or another database/storage layer.

## Verification

Useful checks:

```powershell
npm.cmd run lint
npm.cmd run build
```
