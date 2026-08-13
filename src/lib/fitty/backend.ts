import type { Facts } from './facts';

/**
 * Optional Claude-powered brain. Set VITE_FITTY_API to the deployed Worker URL
 * (see worker/README.md) and Fitty routes conversation through it instead of the
 * built-in rule engine. Left unset, everything stays local and free.
 *
 * The key lives on the Worker, never here — anything in this bundle is public.
 */
export const FITTY_API: string | undefined = import.meta.env.VITE_FITTY_API || undefined;

export const hasBackend = Boolean(FITTY_API);

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamHandlers {
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

export class BackendError extends Error {}

/**
 * Streams a reply from the Worker. Returns the full text once the stream ends so
 * the caller can store it in history.
 */
export async function askFitty(
  history: ChatTurn[],
  facts: Facts,
  { onChunk, signal }: StreamHandlers,
): Promise<string> {
  if (!FITTY_API) throw new BackendError('No Fitty backend configured.');

  const response = await fetch(FITTY_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: history, facts }),
    signal,
  });

  if (response.status === 429) {
    throw new BackendError("I'm getting a lot of messages right now — give me a minute.");
  }
  if (!response.ok || !response.body) {
    throw new BackendError(`Coach is offline (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  // Server-sent events: blank-line separated, each carrying one JSON payload.
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
        const parsed = JSON.parse(payload) as { text?: string; error?: string };
        if (parsed.error) throw new BackendError(parsed.error);
        if (parsed.text) {
          full += parsed.text;
          onChunk(parsed.text);
        }
      } catch (e) {
        if (e instanceof BackendError) throw e;
        // A malformed chunk shouldn't kill the whole reply.
      }
    }
  }

  return full;
}
