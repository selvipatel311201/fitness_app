# Fitty's Claude backend

Fitty works with no backend at all — the built-in coach in `src/lib/fitty/`
runs entirely in the browser, costs nothing, and sends no data anywhere. This
Worker is the optional upgrade: real Claude conversation, with your API key kept
server-side where visitors can't read it.

**Never put an API key in the React app.** Anything in `src/` ships to the
browser and is readable by anyone who opens DevTools — they could then spend
your credits. That is the entire reason this Worker exists.

## Deploy

```bash
cd worker
npm install
npx wrangler login                      # opens a browser once
npx wrangler secret put ANTHROPIC_API_KEY   # paste the key; it is stored encrypted
npx wrangler deploy
```

Deploy prints a URL like `https://fitty.<your-subdomain>.workers.dev`.

## Point the site at it

```bash
cd ..
echo 'VITE_FITTY_API=https://fitty.<your-subdomain>.workers.dev' > .env.production
npm run build
git add -A && git commit -m "Enable Fitty's Claude backend" && git push
```

`.env.production` is gitignored — the URL is baked into the built JS at build
time, so GitHub Actions needs it too. Add it as a repository variable
(**Settings → Secrets and variables → Actions → Variables**, name
`VITE_FITTY_API`) and the deploy workflow will pass it through.

Without `VITE_FITTY_API` set, the site silently uses the local coach. That is a
deliberate fallback, not an error state.

## What it costs

Claude Opus 5 is $5 per million input tokens and $25 per million output. A
typical Fitty exchange is roughly 700 in / 200 out, so about **half a cent per
message** — around $5 for a thousand messages. The Worker itself is free up to
100k requests/day.

Cost controls already in place:

- `max_tokens: 2048` caps the length of any single reply
- history is trimmed to the last 20 turns, each capped at 4,000 characters
- 15 messages per IP per minute

That per-IP limit lives in the isolate's memory, so it resets when the isolate
recycles and doesn't coordinate across Cloudflare's edge — treat it as a speed
bump. For a real ceiling, add a **Rate Limiting rule** in the Cloudflare
dashboard (Security → WAF → Rate limiting rules) against the Worker's route, and
set a **billing alert** in the Anthropic console.

## Model choices, and why

- **`claude-opus-5`** — the current flagship. Swap `MODEL` in `src/index.ts` to
  `claude-haiku-4-5` ($1/$5) if you want it cheaper and faster; the coaching
  quality drops but stays usable.
- **`effort: 'low'`** — this model is unusually strong at low effort, and a chat
  coach wants fast replies more than deep reasoning. Raise it to `medium` if
  answers feel shallow.
- **Thinking left on** (the default on Opus 5) — disabling it on this model can
  make it emit tool calls as plain text and leak `<thinking>` tags into replies.
  Lower effort is the better cost lever.
- **`fallbacks: 'default'`** — safety classifiers occasionally decline a
  request; this retries it on a fallback model server-side rather than leaving
  the user with silence.

## Local development

```bash
npx wrangler dev            # http://localhost:8787
```

Then in the site's `.env.local`: `VITE_FITTY_API=http://localhost:8787`
