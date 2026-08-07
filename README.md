# Garage Ghost

**Understand the warning. Choose the safe next step.**

A safety-first, educational AI vehicle-warning triage web app. Users enter vehicle
information, describe symptoms, optionally attach a dashboard warning-light photo, and
receive guidance generated through [Puter.ai](https://developer.puter.com) — clearly framed
as general education, not a professional diagnosis.

## What it does

- `/` — Landing page with emergency warning and explanation of what the app is / isn't.
- `/diagnose` — Diagnosis workflow: vehicle fields, symptom quick chips, optional photo
  upload (now sent for real image analysis), an "Analyze safely" flow that calls Puter,
  plus two zero-AI helpers:
  - **OBD-II code lookup** — paste a scanner code like `P0300` for an instant
    plain-English explanation from a built-in reference (no AI call, works offline).
  - **Saved vehicles** — save a vehicle once, reload it with one click (localStorage).
- `/history` — Reports saved to browser localStorage, with per-item delete, clear-all, and a
  privacy note.

After a diagnosis you can **ask follow-up questions** (plain-text AI answers in the selected
language) and **export a printable mechanic report** via *Print / Save as PDF* (print
styles included; works with Arabic and other scripts).

AI analysis runs entirely in the browser via `puter.ai.chat()` (default model
`gpt-5.6-luna`, `temperature: 0.2`, `max_tokens: 2000`), with automatic fallback models when
Puter reports the default unavailable. Photos are sent through Puter's documented `media`
parameter (`puter.ai.chat(prompt, imageFile, options)`). No API key, `.env`, database, or
custom backend is required.

## Prerequisites

- Node.js 20.9+ (Node 22 LTS recommended)
- npm

## Installation & run

```bash
cd garage-ghost
npm install
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm run lint   # ESLint
npm run build  # Production build
npm run start  # Serve the production build (after `npm run build`)
```

## Puter note (user-pays)

Puter uses a **user-pays model**. When you run a diagnosis, Puter may show a sign-in dialog;
usage on your Puter account covers the request. Garage Ghost never uses or stores an API key.
A small info element on the diagnose page explains this.

### Demo mode (no Puter account needed)

To try the UI without any Puter account, run with:

```bash
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

A clearly labeled mock result is returned instead of an AI call. Demo mode is **not** enabled
by default.

## Safety limitation

Garage Ghost provides general educational information only. It is **not** a diagnosis and is
not a substitute for a qualified mechanic. If there is a red warning light, smoke, a fuel
smell, loss of braking or steering, overheating, or an electrical burning smell: stop safely
and contact roadside assistance or a qualified workshop. A fixed disclaimer is shown with
every result.

## Test example

In the form:

- Brand: `Audi`
- Model: `A3`
- Year: `2017`
- Fuel / power type: `Diesel`
- Mileage: `145000 km`
- Symptoms: `Orange engine light and loss of power above 2500 RPM`

Expected: an educational result (typically DRIVE_CAREFULLY or BOOK_SERVICE depending on the
model's answer), with safe checks and a mechanic-ready report.

## Notes

- Reports are stored in **browser localStorage only** for this MVP.
- The landing hero shows a GSAP canvas spiral animation (paused when off-screen or for
  `prefers-reduced-motion` users).
- If a Puter sign-in window is closed without signing in, the request would otherwise hang:
  a 90s guard shows a hint, then cancels with a clear message and re-enables the button.
- Image upload supports JPG/PNG/WebP up to 10 MB. Attached photos are sent with the written
  description using Puter's documented image path; visual identification is still not
  guaranteed and is treated as a hint, not a certain diagnosis.
- Diagnosis requires the browser to reach Puter's servers; offline use is not supported.

## Install as an app (PWA)

Garage Ghost is a Progressive Web App — on a phone, open the site in the browser and:

- **Android (Chrome):** menu → *Add to Home screen* / *Install app*.
- **iOS (Safari):** Share → *Add to Home Screen*.

It then opens full-screen like a native app, with the Garage Ghost icon. A service worker
caches static assets so the app shell loads quickly and pages fall back to cache offline.

## Deployment (Vercel)

**Live: https://garage-ghost.vercel.app** — no environment variables or API keys are required.
Framework preset: Next.js (auto-detected).

### Auto-deploys from GitHub (current setup)

The project lives at https://github.com/bry1986/garage-ghost and is connected to the Vercel
project `garage-ghost`, so **every push to `main` deploys automatically**:

```bash
git push origin main   # Vercel builds and deploys production automatically
```

Connecting was done once with:

```bash
gh repo create garage-ghost --public --source=. --push --remote=origin  # create repo + push
vercel git connect https://github.com/bry1986/garage-ghost.git           # enable git deploys
```

### Alternative — Vercel CLI (no GitHub)

```bash
cd garage-ghost
vercel login        # opens a browser; sign in once
vercel --prod       # deploy to production from the current folder
```

Optional: if you want demo mode on the deployment (not recommended for production):

```bash
vercel env add NEXT_PUBLIC_DEMO_MODE
# paste: true
```

### After deploying

- The first real diagnosis on the deployed site prompts the visitor to sign in with
  Puter (user-pays model) — this happens in the browser, no config needed.
- Reports stay in each visitor's browser localStorage (per-visitor, per-browser).
- Verify the deploy with the test example above (Audi A3 / 2017 / Diesel / loss of power).
