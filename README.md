# Auktionsrundan – React SPA

Single Page Application with an Admin dashboard for Auktionsrundan.

## Tech Stack
- React + Vite
- Tailwind CSS
- react-router-dom
- i18next + react-i18next (sv default, en optional)

## Features
- One-page scrolling with anchors: `#home`, `#auctions`, `#items`, `#terms`
- Sections are editable and toggleable via `/admin`
- LocalStorage-backed content store (`src/services/store.js`)
- Minimal client-side admin login (demo): any password ≥ 4 characters
- Google Maps embeds supported via admin (paste embed URL)
- Instagram section placeholder (configure in admin; real API integration TBD)

## Scripts
- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open the shown local URL. Navigate to `/admin` to edit content.

## Admin
- Route: `/admin`
- Demo login: any password ≥ 4 characters (stored as a local flag; replace with real auth for production)
- Sections: Header, Hero, Auctions, Items (structure placeholder), Terms, Instagram, Footer

## Content Storage
- LocalStorage key: `ar_site_content_v1`
- Reset to defaults from Admin → "Återställ standard"

## Deploy (Recommended)
- GitHub + Cloudflare Pages or Vercel/Netlify.
- Build command: `npm run build`
- Output directory: `dist`

### Cloudflare Pages (manual quickstart)
1. Push repo to GitHub.
2. In Cloudflare Pages, create project → Connect to GitHub → select repo.
3. Framework preset: Vite. Build command `npm run build`, output `dist`.

#### Ratings with Cloudflare D1 (API under `functions/api/ratings.js`)
1. In Cloudflare Pages → Your Project → Settings → Functions → D1 Bindings:
   - Add a D1 binding with name `DB` and select/create a D1 database.
2. First request auto-creates tables `ratings` and `votes`.
3. API endpoints:
   - GET `/api/ratings?type=upcoming` → `{ average, totalVotes }`
   - GET `/api/ratings?type=item&id=<category:index>` → per-item aggregate
   - POST `/api/ratings` JSON body: `{ type: 'upcoming'|'item', id?: string, score: 1..5 }`
4. The site integrates a `RatingStars` component in:
   - `src/sections/Auctions.jsx` (section-wide rating)
   - `src/sections/Items.jsx` (per item ratings)
5. Basic abuse protection:
   - Per-IP cooldown of 120s for the same target
   - LocalStorage stores the last score per target on the client

### Vercel / Netlify
- New Project → Import Git Repository → Framework: Vite → Build: `npm run build` → Output: `dist`.

## Notes
- Replace the Instagram placeholder with Graph API integration when token/permissions are available.
- Replace the demo admin login with a real authentication method (e.g., Firebase Auth) for production.
