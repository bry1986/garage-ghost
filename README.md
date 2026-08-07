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
language), see **FIXD-style repair cost ballparks** (typical USD parts-and-labor ranges matched
from the detected issue / DTC code — deterministic, no AI call; suppressed for emergencies)
and **export a printable mechanic report** via *Print / Save as PDF* (print styles included;
works with Arabic and other scripts).

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

## Pro tier (Lemon Squeezy)

Garage Ghost has an optional **Pro subscription** that gates premium features:

| | Free | Pro ($5.99/mo or $49.99/yr) |
|---|---|---|
| Diagnoses, follow-ups, DTC lookup | Unlimited | Unlimited |
| Repair cost estimates | 3 per day | Unlimited |
| Print / Save-as-PDF reports | — | ✅ |

Pro works **without any backend**: it uses Lemon Squeezy's License API, which is designed
for client-side verification. After checkout the customer receives a license key by email;
they paste it into the upgrade dialog (or any gated button opens it), the app activates it
against `api.lemonsqueezy.com` from the browser, and stores the Pro state in localStorage.
The stored key is re-validated on each app load, so expired/cancelled subscriptions lose
access. Lemon Squeezy is a merchant of record — it collects and remits sales tax / EU VAT
for you.

### One-time setup (about 20 minutes)

1. Create a free account at https://lemonsqueezy.com.
2. **Products → New product** — name it *Garage Ghost Pro*, add a one-time setup fee of $0
   (needed for the yearly variant model), and create two variants:
   - *Monthly* — `$5.99`, subscription, monthly billing.
   - *Yearly* — `$49.99`, subscription, yearly billing.
3. For **each variant**, enable **License keys** (Product settings → License keys) and set the
   activation limit to **2–3** (so one key works across a couple of browsers/devices).
4. Copy each variant's **Checkout URL** (Products → the variant → checkout URL) and your
   **store slug** (the part before `.lemonsqueezy.com` in that URL).
5. Set the public env vars (safe to expose — no secrets):

```bash
cd garage-ghost
cp .env.example .env.local
# fill in NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL (monthly)
#       NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL_ANNUAL (yearly)
#       NEXT_PUBLIC_LEMONSQUEEZY_STORE (store slug)
```

6. Add the same three variables to Vercel (Project → Settings → Environment Variables) so
   production checkout links work.

### Honest limitations

- License verification happens in the browser, so a determined user could share a key or tamper
  with localStorage; activation limits reduce sharing. This is standard for client-license MVPs
  and acceptable until a full auth/backend exists.
- The **free** cost-estimate allowance (3/day) is tracked per browser via localStorage and
  counts **freshly generated** results only — reopening a report you already generated in
  History always shows it in full and costs nothing.
- The DTC lookup card's "Est. typical cost" line is **always free** (it is static reference
  data for the ~44 built-in codes, not an AI-driven estimate). The Pro gate applies to the
  per-diagnosis cost estimates.
- Payment collection is handled entirely by Lemon Squeezy's hosted checkout and customer
  portal (for cancellations). You never touch card data.

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
- Repair cost estimates are English keyword/DTC-code matched ballparks in USD. Because the AI
  returns causes in the selected language, German/French/Arabic results without a DTC code
  generally show the broad generic range rather than a job-specific one.
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

**Live: https://garage-ghost.vercel.app** — the base app needs no environment variables or API
keys. The three optional `NEXT_PUBLIC_LEMONSQUEEZY_*` variables above enable the Pro checkout
links. Framework preset: Next.js (auto-detected).

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
