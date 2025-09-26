# Hologram Inventory Wall

Futuristic inventory wall powered by Node.js, Express, MySQL, and a pure HTML/CSS/JS front-end. Items stream in from a real inventory table, rendered as holographic cards with scanlines, glass, and tilt.

## Prerequisites

- Node.js 18+
- MySQL 8+
- `mysql` CLI available on your PATH

## Quick Start

1. `cp .env.example .env` and populate `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`.
2. Create the database manually if it does not exist yet: `CREATE DATABASE hologram_inventory;`
3. Seed schema & demo data (reads credentials from `.env`):
   ```bash
   npm run db:setup
   ```
   The script pipes `schema.sql` then `seed.sql` through the `mysql` CLI. It uses `MYSQL_PWD` so beware of shell history if you keep plaintext passwords.
4. Install dependencies: `npm install`
5. Start the server: `npm start`
6. Visit [http://localhost:3000](http://localhost:3000) to explore the hologram wall.

For live reloading during development: `npm run dev` (watches `server.js` and files under `public/`).

## API

Base URL: `http://localhost:3000/api/inventory`

| Endpoint | Description | Notes |
| --- | --- | --- |
| `GET /api/inventory` | List inventory items | Supports filters (`q`, `status`, `minQty`), `limit` (default 50, max 200) and keyset pagination via `cursor`. Response includes `items`, `nextCursor`, `count`. Cached for 15 seconds. |
| `GET /api/inventory/:id` | Fetch a single item by id | Returns 404 when not found. |

**Filters**

- `q`: partial search across `name`, `sku`, `description` (trimmed to 120 chars).
- `status`: one of `in_stock`, `low`, `out_of_stock`, `discontinued`.
- `minQty`: integer ≥ 0.
- `limit`: items per page (default 50, max 200).
- `cursor`: the last `id` from the previous page for keyset pagination.

All queries use prepared statements and pooled connections via `mysql2/promise`.

## Front-end Highlights

- Pure HTML/CSS/JS (no frameworks, no build step).
- “Hologram screen” container with glow, vignette, animated scanlines (disabled when `prefers-reduced-motion` is enabled).
- Inventory cards feature glassmorphism, shimmer hover, status-tinted glows, and a 3D tilt effect implemented in `public/holo-tilt.js`.
- Accessible toolbar with search, status filter, min quantity, and live result count.
- Lazy loading through a `Load more` button backed by cursor pagination.
- Skeleton loaders, toast-based error feedback, and friendly empty/error states.
- Relative timestamps with `Intl.RelativeTimeFormat`, currency display using `Intl.NumberFormat`.
- Respect for `prefers-reduced-motion` in both CSS and JS (tilt automatically disabled).

## Security & Performance Notes

- Helmet (sans CSP) hardens common headers, CORS is enabled for local development.
- Request payloads limited to 200 KB and all SQL calls use parameterized queries.
- MySQL connection pool limits are conservative (10 connections) and can be tuned.
- Static assets served with sensible HTTP caching (`Cache-Control`), API list cached for 15s.
- Keyset pagination keeps queries efficient even as the table scales.
- `.env` never committed; `.env.example` shows required fields.

## Customizing

- Update `schema.sql` / `seed.sql` for additional columns or different demo data; add new metadata to cards via `public/app.js`.
- Styling tweaks live in `public/styles.css`; global hue/scanline intensity can be adjusted through CSS variables.
- Extend the API in `server.js` (e.g., POST/PUT for admin tools) — keep validation and prepared statements.
- Toggle tilt/glow behavior or card metadata rendering in `public/app.js` and `public/holo-tilt.js`.
