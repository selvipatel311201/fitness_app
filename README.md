# FitPlan

A personal fitness planner. You enter your age, height, weight, target weight,
goal, food preference, how many days you want, and a photo — it returns a
calorie target, macro split, meal plan, weekly training split and dated
checkpoints.

Everything is computed in the browser and stored in `localStorage`. There is no
backend and nothing is uploaded, photo included.

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

### Later: custom domain (selvipatel.com)

The site starts out on its `github.io` URL. To move it to the domain, do the DNS
setup below **first**, then add the domain to the repo:

```bash
mkdir -p public && echo 'selvipatel.com' > public/CNAME
```

That file ships in every build, which is what keeps Pages from resetting the
custom domain on each deploy. Add it before DNS resolves and the site is
unreachable at both URLs, so leave it out until the records are live.

At your DNS provider:

1. **Apex** (`selvipatel.com`) — four `A` records:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
   Add the matching `AAAA` records if your provider supports IPv6:
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
   `2606:50c0:8003::153`.
2. **www** — a `CNAME` record pointing to `selvipatel311201.github.io`.

Then in **Settings → Pages → Custom domain** enter `selvipatel.com`, wait for the
DNS check to pass, and tick **Enforce HTTPS** (the certificate can take up to an
hour). DNS propagation is usually minutes but can take up to 24 hours.

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
