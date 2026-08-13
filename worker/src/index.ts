import Anthropic from '@anthropic-ai/sdk';

export interface Env {
  /** Set with: npx wrangler secret put ANTHROPIC_API_KEY */
  ANTHROPIC_API_KEY: string;
  /** Comma-separated list of sites allowed to call this Worker. */
  ALLOWED_ORIGINS?: string;
}

const MODEL = 'claude-opus-5';

/**
 * Chat replies are short by design, and this cap is also the cost ceiling per
 * message. Thinking is on by default on this model and counts against it, so
 * this is not as tight as it looks.
 */
const MAX_TOKENS = 2048;

const DEFAULT_ORIGINS = ['https://fit.selvipatel.com', 'http://localhost:5173', 'http://localhost:4173'];

const SYSTEM_PROMPT = `You are Fitty, a friendly personal fitness coach on a website called FitPlan.

Who you are:
- Warm, encouraging and straight-talking, like a good trainer who respects the person's time.
- You never shame anyone about their weight, body or eating. Ever.
- You write for a phone screen: short paragraphs, no walls of text, no headers.

What you do:
- Collect the person's details conversationally: name, age, gender, height, weight, target weight, fitness goal, diet preference, and how much they currently exercise. Ask for one or two at a time, never all at once, and never re-ask for something they already told you.
- Once you have enough, give concrete numbers: daily calories, protein/carbs/fat in grams, and a simple meal plan matching their diet preference.
- Suggest specific workouts for their goal and experience level. Name the exercises, sets and reps.
- When asked how to do an exercise, explain it in four short numbered steps in plain language, then name the one mistake that matters most.
- Always give 2-3 video links, never just one, written as markdown links so they render as buttons: [Watch: squat form tutorial](URL). Use YouTube *search* URLs in this exact form: https://www.youtube.com/results?search_query=how+to+do+a+squat+proper+form — swapping in the exercise and the angle (form tutorial, common mistakes, beginner version). Never invent a specific video ID, channel or title: a made-up link is worse than no link, and search links never break.
- When asked for exercises or videos in general rather than one movement, give three exercises with two links each, picked for the person's goal.

Rules:
- You give general fitness guidance, not medical advice. If someone mentions injury, pain, pregnancy, an eating disorder, or a medical condition, tell them plainly to speak to a doctor or physiotherapist first, and do not prescribe around it.
- Never recommend under 1200 kcal a day for women or 1500 for men, and never a loss rate above about 1% of bodyweight per week. If someone asks for faster, say honestly why that does not work and give them the fastest healthy version instead.
- If you do not know something, say so.
- Keep replies under about 120 words unless the person asks for a full plan.`;

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
 * Per-IP throttle. This lives in the isolate's memory, so it is a speed bump
 * rather than a guarantee — Cloudflare's own Rate Limiting rules are the real
 * control. See worker/README.md.
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

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
    if (!env.ANTHROPIC_API_KEY) {
      return new Response('Worker is missing ANTHROPIC_API_KEY', { status: 500, headers: cors });
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many messages — try again in a minute.' }), {
        status: 429,
        headers: { ...cors, 'content-type': 'application/json' },
      });
    }

    let body: ChatRequest;
    try {
      body = (await request.json()) as ChatRequest;
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: cors });
    }

    // Keep only well-formed turns, cap the history, and cap each message so a
    // crafted request cannot run up a large bill.
    const messages = (body.messages ?? [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return new Response('Last message must be from the user', { status: 400, headers: cors });
    }

    const known = body.facts && typeof body.facts === 'object' ? JSON.stringify(body.facts).slice(0, 1000) : '{}';
    const system =
      known === '{}'
        ? SYSTEM_PROMPT
        : `${SYSTEM_PROMPT}\n\nWhat you already know about this person (do not ask for any of it again): ${known}`;

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        try {
          const run = client.beta.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages,
            output_config: { effort: 'low' },
            // Safety classifiers can decline a request; this re-runs it on a
            // fallback model server-side instead of returning nothing.
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
          });

          run.on('text', (delta) => send({ text: delta }));

          const final = await run.finalMessage();
          if (final.stop_reason === 'refusal') {
            send({ text: "I can't help with that one — try asking me about training or food." });
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          const message =
            error instanceof Anthropic.RateLimitError
              ? "I'm at my limit right now — give me a minute."
              : error instanceof Anthropic.AuthenticationError
                ? 'Coach is misconfigured (bad API key).'
                : 'Coach had a problem answering. Try again.';
          send({ error: message });
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
