/**
 * Fitty's brain: a Cloudflare Worker that proxies chat to Groq.
 *
 * The key lives here as an encrypted secret, never in the site bundle — anything
 * shipped to the browser is readable by every visitor. No SDK: Groq speaks the
 * OpenAI chat-completions shape, so plain fetch is the whole client.
 */

export interface Env {
  /** Set with: npx wrangler secret put GROQ_API_KEY */
  GROQ_API_KEY?: string;
  /** Tolerated alias — the dashboard dialog makes a trailing "1" easy to add. */
  GROQ_API_KEY1?: string;
  /** Comma-separated list of sites allowed to call this Worker. */
  ALLOWED_ORIGINS?: string;
  /** Optional model override without redeploying code. */
  GROQ_MODEL?: string;
}

/** Groq's strongest free general model. `llama-3.1-8b-instant` is faster. */
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Chat replies are short by design; this is also the per-message cost ceiling. */
const MAX_TOKENS = 700;

const DEFAULT_ORIGINS = ['https://fit.selvipatel.com', 'http://localhost:5173', 'http://localhost:4173'];

const SYSTEM_PROMPT = `You are Fitty, a friendly personal fitness coach on a website called FitPlan.

Who you are:
- Warm, encouraging and straight-talking, like a good trainer who respects the person's time.
- You never shame anyone about their weight, body or eating. Ever.
- You write for a phone screen: short paragraphs, no headers, no walls of text. Under about 120 words unless asked for a full plan.

What you do:
- Collect the person's details conversationally: name, age, gender, height, weight, target weight, goal, diet preference, and how much they currently train. Ask for one or two at a time, never all at once, and never re-ask for something they have already told you.
- Once you have enough, give concrete numbers: daily calories, protein/carbs/fat in grams, and a simple meal plan matching their diet.
- Suggest specific workouts for their goal and experience. Name the exercises, sets and reps.
- When asked how to do an exercise, give four short numbered steps in plain language, then the one mistake that matters most.
- Answer questions about a body part (legs, arms, chest, back, core, cardio) by naming the best movements for it.

Video links — follow exactly:
- Always give 2-3 links, never one, written as markdown: [Watch: squat form tutorial](URL).
- URLs must be YouTube *search* links in this form: https://www.youtube.com/results?search_query=how+to+do+a+squat+proper+form — swap in the exercise and angle (form tutorial, common mistakes, beginner version).
- NEVER invent a video id, channel or title. A made-up link is worse than no link; search links never break.

Rules:
- General fitness guidance, not medical advice. If someone mentions injury, pain, pregnancy, an eating disorder or a medical condition, tell them plainly to speak to a doctor or physiotherapist first, and do not prescribe around it.
- Never recommend under 1200 kcal a day for women or 1500 for men, and never a loss rate above about 1% of bodyweight per week. If asked for faster, explain honestly why that does not work and give the fastest healthy version instead.
- If you do not know something, say so.`;

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) ?? DEFAULT_ORIGINS).filter(Boolean);
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] ?? '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/**
 * Per-IP throttle held in the isolate's memory — a speed bump, not a guarantee,
 * since isolates recycle and don't share state. Cloudflare's own Rate Limiting
 * rules are the real control; see the README.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

interface ChatRequest {
  messages?: Array<{ role: 'user' | 'assistant'; content: unknown }>;
  facts?: Record<string, unknown>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);
    const json = (body: unknown, status: number) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
    const apiKey = env.GROQ_API_KEY || env.GROQ_API_KEY1;
    if (!apiKey) return json({ error: 'Coach is not configured yet (missing GROQ_API_KEY).' }, 500);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (rateLimited(ip)) return json({ error: "I'm getting a lot of messages right now — try again in a minute." }, 429);

    let body: ChatRequest;
    try {
      body = (await request.json()) as ChatRequest;
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    // Keep only well-formed turns, cap the history and each message, so a
    // crafted request cannot burn the free quota.
    const history = (body.messages ?? [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      return json({ error: 'Last message must be from the user' }, 400);
    }

    const known = body.facts && typeof body.facts === 'object' ? JSON.stringify(body.facts).slice(0, 1000) : '{}';
    const system =
      known === '{}'
        ? SYSTEM_PROMPT
        : `${SYSTEM_PROMPT}\n\nWhat you already know about this person (never ask for any of it again): ${known}`;

    let upstream: Response;
    try {
      upstream = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL || DEFAULT_MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0.6,
          stream: true,
          messages: [{ role: 'system', content: system }, ...history],
        }),
      });
    } catch {
      return json({ error: 'Could not reach the coach. Try again in a moment.' }, 502);
    }

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      const message =
        upstream.status === 429
          ? "The coach has hit today's free limit. Try again later."
          : upstream.status === 401
            ? 'Coach is misconfigured (the API key was rejected).'
            : 'The coach had a problem answering. Try again.';
      console.error('groq error', upstream.status, detail.slice(0, 300));
      return json({ error: message }, upstream.status === 429 ? 429 : 502);
    }

    // Translate Groq's OpenAI-shaped SSE into the simple {text} events the site
    // already understands.
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        let buffer = '';
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? '';
            for (const part of parts) {
              const line = part.split('\n').find((l) => l.startsWith('data:'));
              if (!line) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
                const text = parsed.choices?.[0]?.delta?.content;
                if (text) send({ text });
              } catch {
                // A malformed chunk shouldn't kill the whole reply.
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch {
          send({ error: 'The reply was cut short. Ask me again.' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...cors,
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
      },
    });
  },
};
