# FitPlan

A personal fitness planner. You enter your age, height, weight, target weight,
goal, food preference, how many days you want, and a photo — it returns a
calorie target, macro split, meal plan, weekly training split and dated
checkpoints.

Everything is computed in the browser and stored in `localStorage`. There is no
backend and nothing is uploaded, photo included.

**Save as PDF** uses the browser's own print-to-PDF through a print stylesheet,
so the output is selectable vector text rather than a screenshot, and no PDF
library ships in the bundle. **Email my plan** opens a `mailto:` with the plan
written into the message body — the page never sends anything itself, which is
what keeps the no-upload promise true. Because a `mailto:` cannot carry an
attachment, sending the PDF means saving it first and attaching it by hand.

## Stack

React 19 · TypeScript (strict) · Vite · plain CSS · GitHub Actions → GitHub Pages

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve the built dist/ locally
npm run typecheck  # types only
```

## Running with Docker

No local Node needed — everything happens inside the containers.

```bash
docker compose up web              # production build behind nginx → http://localhost:8080
docker compose --profile dev up dev  # Vite dev server, hot reload → http://localhost:5173
docker compose down                # stop
```

`Dockerfile` is a two-stage build: `node:22-alpine` compiles the site, then only
`dist/` is copied into `nginx:1.27-alpine` (final image ~76 MB, no toolchain or
`node_modules`). `docker/nginx.conf` adds the SPA fallback and cache headers —
fingerprinted assets are immutable for a year, `index.html` is never cached.

The `dev` service bind-mounts the source and keeps the container's
`node_modules`, so edits on the host hot-reload without a rebuild.

On a Mac without Docker Desktop, [Colima](https://github.com/abiosoft/colima)
provides the daemon headlessly:

```bash
brew install colima docker docker-compose
colima start                       # once per boot
```

## Deploying

Push to `main` and the workflow in `.github/workflows/deploy.yml` builds and
publishes to GitHub Pages. One-time setup:

1. Create the repo and push:
   ```bash
   git init && git add -A && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The next push to `main` deploys. The URL appears in the workflow run and
   under Settings → Pages.

`vite.config.ts` sets `base: './'`, so the build works at any path — a project
site (`user.github.io/repo/`), a user site, or a custom domain — with no change.

### Custom domain: fit.selvipatel.com

Live at <https://fit.selvipatel.com>. Two pieces make that work:

1. **DNS** — a single `CNAME` at Porkbun: host `fit`, answer
   `selvipatel311201.github.io`, TTL 600. The domain also carries a wildcard
   `*.selvipatel.com` pointing at Porkbun's parking page; the explicit `fit`
   record takes precedence over it, so both can coexist.
2. **`public/CNAME`** — holds `fit.selvipatel.com`. Vite copies `public/` into
   `dist/` verbatim, so the file ships with every build. Without it Pages clears
   the custom domain on each deploy, which is the usual cause of a custom domain
   that "keeps disconnecting".

Don't add `public/CNAME` before the DNS record resolves — Pages will redirect the
`github.io` URL to a domain that doesn't answer yet, taking the site offline at
both addresses.

To move to a different host, change `public/CNAME`, add the matching DNS record,
and update the domain in **Settings → Pages**. For an apex domain (`selvipatel.com`)
DNS needs four `A` records instead — `185.199.108.153` through `185.199.111.153`
— since a CNAME cannot coexist with the domain's `MX` and `TXT` records.

If you'd rather keep `selvipatel.com` for something else and put this on a
subdomain like `fit.selvipatel.com`, change `public/CNAME` to that hostname and
add a single `CNAME` record for `fit` → `selvipatel311201.github.io`.

## How the numbers are worked out

| Quantity | Method |
| --- | --- |
| BMI | weight ÷ height² |
| BMR | Mifflin-St Jeor |
| TDEE | BMR × activity factor (1.2 – 1.9) |
| Calorie target | TDEE ± (weight change × 7700 kcal/kg ÷ days) |
| Protein | 1.6 – 2.0 g/kg depending on goal |
| Fat | 25% of calories; carbs take the rest |

The target is clamped for safety: at most ~1% of bodyweight lost per week (0.5%
gained), and never below 1500 kcal (male) / 1200 kcal (female). If your timeline
needs more than that, the app says so and plans the fastest healthy pace instead.

These are estimates from population formulas, not medical advice.

## Layout

```
src/
  App.tsx                  form ↔ dashboard state, persistence
  types.ts                 Profile, ProfileDraft, enums
  lib/calc.ts              BMI / BMR / TDEE / calories / macros / milestones
  lib/mealPlan.ts          food banks per diet, meal split, habit notes
  lib/trainingPlan.ts      weekly split per goal, trimmed by activity level
  lib/image.ts             photo → downscaled JPEG data URL
  lib/storage.ts           localStorage read/write
  lib/validate.ts          draft → validated Profile
  components/              ProfileForm, PhotoUpload, Dashboard
```
