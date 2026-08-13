import { useEffect, useRef, useState, type ReactNode } from 'react';

const REDUCED = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Fades content up the first time it scrolls into view. */
export function Reveal({ children, delay = 0, as = 'div' }: { children: ReactNode; delay?: number; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(REDUCED);

  useEffect(() => {
    if (REDUCED || shown) return;
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [shown]);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal${shown ? ' is-shown' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Counts up to a number when it first appears — used on the headline stats. */
export function Counter({ to, suffix = '', duration = 1100 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(REDUCED ? to : 0);

  useEffect(() => {
    if (REDUCED) return;
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setValue(to);
      return;
    }
    let frame = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // Ease-out so it decelerates into the final number.
          setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
