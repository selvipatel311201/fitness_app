import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Profile } from '../types';
import { extractFacts, type Facts, missingFacts } from '../lib/fitty/facts';
import { factsToProfile, planSummary, respond } from '../lib/fitty/engine';
import { BackendError, askFitty, hasBackend, type ChatTurn } from '../lib/fitty/backend';

interface Props {
  profile: Profile | null;
  /** Lets Fitty hand a finished plan to the rest of the app. */
  onProfile: (profile: Profile) => void;
}

interface Message {
  id: number;
  role: 'user' | 'fitty';
  text: string;
  chips?: string[];
  /** Rendered as a "save this plan" prompt. */
  offer?: Profile;
}

const GREETING =
  "Hi, I'm Fitty 👋 your personal coach. Tell me a bit about yourself and I'll build your plan — or ask me how to do any exercise.";

/** Turns **bold**, bullet lines and bare URLs into elements. Deliberately tiny. */
function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <span key={i} className="fitty-gap" />;
    const parts: Array<string | { url: string }> = [];
    const urlRe = /(https?:\/\/[^\s]+)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = urlRe.exec(line))) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      parts.push({ url: match[0] });
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));

    return (
      <p key={i} className="fitty-line">
        {parts.map((part, j) =>
          typeof part === 'string' ? (
            <span key={j}>
              {part.split(/\*\*(.+?)\*\*/g).map((chunk, k) => (k % 2 === 1 ? <strong key={k}>{chunk}</strong> : chunk))}
            </span>
          ) : (
            <a key={j} href={part.url} target="_blank" rel="noreferrer noopener">
              Watch on YouTube ↗
            </a>
          ),
        )}
      </p>
    );
  });
}

export function Fitty({ profile, onProfile }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [facts, setFacts] = useState<Facts>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'fitty',
      text: GREETING,
      chips: ["I'm 24, 165cm, 70kg, want to lose fat", 'How do I do a squat?', 'What can you do?'],
    },
  ]);

  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed from a plan the user already built in the form.
  useEffect(() => {
    if (!profile) return;
    setFacts((f) => ({
      name: f.name ?? (profile.name || undefined),
      age: f.age ?? profile.age,
      sex: f.sex ?? profile.sex,
      heightCm: f.heightCm ?? profile.heightCm,
      weightKg: f.weightKg ?? profile.weightKg,
      targetWeightKg: f.targetWeightKg ?? profile.targetWeightKg,
      goal: f.goal ?? profile.goal,
      diet: f.diet ?? profile.diet,
      activity: f.activity ?? profile.activity,
      days: f.days ?? profile.days,
    }));
  }, [profile]);

  useEffect(() => {
    if (open) {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  // Escape closes the panel, matching every other chat widget on the web.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function push(message: Omit<Message, 'id'>) {
    setMessages((m) => [...m, { ...message, id: nextId.current++ }]);
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    push({ role: 'user', text });
    setInput('');
    setBusy(true);

    const learned = extractFacts(text);
    const merged: Facts = { ...facts, ...learned };
    setFacts(merged);

    const wasComplete = missingFacts(facts).length === 0;
    const nowComplete = missingFacts(merged).length === 0;
    const built = factsToProfile(merged, profile);

    try {
      if (hasBackend) {
        const history: ChatTurn[] = [
          ...messages
            .filter((m) => m.id !== 0)
            .map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: m.text })),
          { role: 'user', content: text },
        ];
        const id = nextId.current++;
        setMessages((m) => [...m, { id, role: 'fitty', text: '' }]);
        await askFitty(history, merged, {
          onChunk: (chunk) =>
            setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: msg.text + chunk } : msg))),
        });
        if (built && !wasComplete) {
          setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, offer: built } : msg)));
        }
      } else {
        const reply = respond(text, { facts: merged, profile: built ?? profile, isFirstMessage: messages.length <= 1 });
        // Completing the profile is the moment worth celebrating.
        if (built && nowComplete && !wasComplete) {
          push({ role: 'fitty', text: planSummary(built), chips: ['What should I eat today?', "What's my workout today?"], offer: built });
        } else {
          push({ role: 'fitty', ...reply });
        }
      }
    } catch (e) {
      push({
        role: 'fitty',
        text:
          e instanceof BackendError
            ? e.message
            : "Something went wrong reaching my brain. I'll keep going on my own — ask me again.",
      });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      <button
        className={`fitty-launcher${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="fitty-panel"
      >
        <span aria-hidden="true">{open ? '✕' : '💬'}</span>
        <span className="fitty-launcher-label">{open ? 'Close' : 'Ask Fitty'}</span>
      </button>

      <section id="fitty-panel" className={`fitty-panel${open ? ' is-open' : ''}`} aria-label="Fitty, your fitness coach" aria-hidden={!open}>
        <header className="fitty-head">
          <span className="fitty-avatar" aria-hidden="true">
            F
          </span>
          <div>
            <strong>Fitty</strong>
            <span className="fitty-status">
              {busy ? 'typing…' : hasBackend ? 'AI coach · online' : 'your coach · on this device'}
            </span>
          </div>
          <button className="fitty-close" onClick={() => setOpen(false)} aria-label="Close chat">
            ✕
          </button>
        </header>

        <div className="fitty-log" ref={scroller}>
          {messages.map((m) => (
            <div key={m.id} className={`fitty-msg fitty-${m.role}`}>
              <div className="fitty-bubble">
                {m.text ? renderText(m.text) : <span className="fitty-typing" aria-label="Fitty is typing" />}
              </div>

              {m.offer && (
                <button
                  className="fitty-save"
                  onClick={() => {
                    onProfile(m.offer!);
                    push({ role: 'fitty', text: 'Saved — your full plan is on the page behind me, with checkpoints and a PDF you can keep.' });
                    setOpen(false);
                  }}
                >
                  Save this plan to my page
                </button>
              )}

              {m.chips && m.chips.length > 0 && (
                <div className="fitty-chips">
                  {m.chips.map((chip) => (
                    <button key={chip} className="fitty-chip" onClick={() => void send(chip)} disabled={busy}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <form className="fitty-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Fitty anything…"
            aria-label="Message Fitty"
            disabled={busy}
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
            ➤
          </button>
        </form>
        <p className="fitty-fineprint">
          General fitness guidance, not medical advice. {hasBackend ? 'Messages go to your own Claude proxy.' : 'Nothing leaves this device.'}
        </p>
      </section>
    </>
  );
}
