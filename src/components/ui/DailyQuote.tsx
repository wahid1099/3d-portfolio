import { useEffect, useState } from "react";

type Quote = { text: string; author: string };

const QUOTES: Quote[] = [
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Premature optimization is the root of all evil.", author: "Donald Knuth" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
  { text: "First do it, then do it right, then do it better.", author: "Addy Osmani" },
  { text: "Programs must be written for people to read.", author: "Harold Abelson" },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { text: "Make it work. Make it ship. Make it scale.", author: "Wahid" },
  { text: "Security is not a feature — it's a foundation.", author: "Wahid" },
  { text: "If you can't measure it, you can't secure it.", author: "CISO maxim" },
  { text: "There are two hard things: cache invalidation and naming things.", author: "Phil Karlton" },
  { text: "Optimism is an occupational hazard of programming.", author: "Alan Kay" },
  { text: "It's not a bug, it's an undocumented feature.", author: "Anon" },
  { text: "Code never lies, comments sometimes do.", author: "Ron Jeffries" },
  { text: "Walking on water and developing software from a specification are easy if both are frozen.", author: "Edward V. Berard" },
  { text: "A ship in port is safe, but that's not what ships are built for.", author: "Grace Hopper" },
  { text: "Move fast and fix things.", author: "GitHub SRE" },
];

/** Stable per-day selection: same quote all day, rotates at midnight local. */
function quoteForToday(): Quote {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = Math.floor(start.getTime() / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function DailyQuote() {
  const [q, setQ] = useState<Quote>(() => quoteForToday());
  const [open, setOpen] = useState(false);

  // Roll over at midnight if the page stays open
  useEffect(() => {
    const id = window.setInterval(() => setQ(quoteForToday()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] flex justify-center pt-[68px]">
      <button
        type="button"
        data-cursor="hover"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="daily-quote-detail"
        className="mono pointer-events-auto inline-flex max-w-[90vw] items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.75)] px-3.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)] backdrop-blur-md transition-colors hover:text-[color:var(--ink)]"
      >
        <span className="size-1.5 rounded-full bg-[color:var(--cyan)] shadow-[0_0_6px_rgba(111,220,239,0.7)]" />
        <span className="truncate">QotD · {q.text}</span>
        <span aria-hidden className="text-[color:var(--faint)]">{open ? "▾" : "▴"}</span>
      </button>
      {open && (
        <div
          id="daily-quote-detail"
          role="note"
          className="mono pointer-events-auto absolute top-9 mt-1 flex max-w-[420px] flex-col gap-1 rounded-2xl border border-[color:var(--line)] bg-[rgba(8,13,28,0.92)] p-4 text-[12px] text-[color:var(--ink)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md"
        >
          <p className="text-[14px] leading-[1.5]">“{q.text}”</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">— {q.author}</p>
        </div>
      )}
    </div>
  );
}