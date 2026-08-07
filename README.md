# Garage Ghost

**Understand the warning. Choose the safe next step.**

A safety-first, educational AI vehicle-warning triage web app. Users enter vehicle
information, describe symptoms, optionally attach a dashboard warning-light photo, and
receive guidance generated through [Puter.ai](https://developer.puter.com) — clearly framed
as general education, not a professional diagnosis.

## What it does

- `/` — Landing page with emergency warning and explanation of what the app is / isn't.
- `/diagnose` — Diagnosis workflow: vehicle fields, symptom quick chips, optional photo
  upload (preview + validation), and an "Analyze safely" flow that calls Puter.
- `/history` — Reports saved to browser localStorage, with per-item delete, clear-all, and a
  privacy note.

AI analysis runs entirely in the browser via `puter.ai.chat()` (default model
`gpt-5.6-luna`, `temperature: 0.2`, `max_tokens: 1200`). No API key, `.env`, database, or
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
- Image upload supports JPG/PNG/WebP up to 10 MB. In this build, analysis is **text-based**;
  an attached photo is previewed but not sent, and a non-breaking notice explains this.
- Diagnosis requires the browser to reach Puter's servers; offline use is not supported.

## Deployment (Vercel)

No environment variables or API keys are required. Framework preset: Next.js.

### Option A — Vercel CLI (fastest, no GitHub needed)

```bash
cd garage-ghost
git add -A
git commit -m "Garage Ghost MVP"
vercel login        # opens a browser; sign in once
vercel              # creates the project, deploys a preview URL
vercel --prod       # deploy to production
```

Optional: if you want demo mode on the deployment (not recommended for production):

```bash
vercel env add NEXT_PUBLIC_DEMO_MODE
# paste: true
vercel --prod
```

### Option B — Git push + dashboard import

1. Push this folder's Git repo to GitHub (this directory is its own repo):

   ```bash
   cd garage-ghost
   git add -A
   git commit -m "Garage Ghost MVP"
   git branch -M main
   git remote add origin git@github.com:<you>/garage-ghost.git
   git push -u origin main
   ```

2. In the Vercel dashboard: **Add New → Project → import the repo**. Because
   `garage-ghost/` is the repo root, no Root Directory setting is needed.
3. Framework preset is detected as Next.js automatically. Deploy.

### After deploying

- The first real diagnosis on the deployed site prompts the visitor to sign in with
  Puter (user-pays model) — this happens in the browser, no config needed.
- Reports stay in each visitor's browser localStorage (per-visitor, per-browser).
- Verify the deploy with the test example above (Audi A3 / 2017 / Diesel / loss of power).
