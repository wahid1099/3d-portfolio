/**
 * ChatWidget — a floating LinkedIn-style chat bubble that pops up after the
 * visitor has spent some time on the page.  It shows sequential animated
 * messages from Wahid and offers quick-reply options.
 */

import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import avatarUrl from "../../assets/my-pic.png";

// ─── conversation script ──────────────────────────────────────────────────────

type Message = { id: number; text: string; delay: number };
type QuickReply = { label: string; response: string };

const MESSAGES: Message[] = [
  { id: 1, text: "Assalamu alaikum! 👋", delay: 0 },
  {
    id: 2,
    text: "You've spent a moment on my portfolio. Thank you for that.",
    delay: 1400,
  },
  { id: 3, text: "Are you building something these days?", delay: 2900 },
];

const QUICK_REPLIES: QuickReply[] = [
  { label: "Yes, I am!", response: "That's awesome! Let's connect — drop me a message below 🚀" },
  { label: "Not right now", response: "No worries! Feel free to reach out whenever. I'm always open to chat 😊" },
  { label: "Looking to hire", response: "I'd love to hear more! Check my résumé or ping me directly 📬" },
];

const AUTO_OPEN_DELAY_MS = 18_000; // open after 18 s

// ─── helpers ─────────────────────────────────────────────────────────────────

type State = {
  /** how many MESSAGES are visible so far */
  visible: number;
  /** index of chosen quick-reply (null = none yet) */
  chosen: number | null;
};
type Action =
  | { type: "REVEAL" }
  | { type: "CHOOSE"; index: number };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "REVEAL":
      return { ...s, visible: Math.min(s.visible + 1, MESSAGES.length) };
    case "CHOOSE":
      return { ...s, chosen: a.index };
    default:
      return s;
  }
}

// ─── sound ───────────────────────────────────────────────────────────────────

/**
 * Synthesises a soft chat-notification ping using the Web Audio API.
 * Two sine oscillators (fundamental + octave) give a warm, pleasant tone.
 * Safe to call before any user gesture — browsers allow AudioContext creation
 * but will only actually play after a user interaction has occurred.
 *
 * @param pitch  Fundamental frequency in Hz (default 880 — a crisp A5)
 * @param vol    Peak gain, 0–1 (default 0.18 — subtle, not jarring)
 */
function playChatPing(pitch = 880, vol = 0.18) {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.008);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    masterGain.connect(ctx.destination);

    // Fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = pitch;
    osc1.connect(masterGain);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.56);

    // Octave above — adds warmth without harshness
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = pitch * 2;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.35; // quieter blend
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.56);

    // Cleanup after playback
    osc1.addEventListener("ended", () => ctx.close());
  } catch {
    // AudioContext not available (e.g. SSR / older browser) — fail silently
  }
}

/**
 * Hook that fires a chat ping whenever `trigger` changes, but skips the
 * very first render so opening the page never makes a sound.
 */
function useChatPing(trigger: unknown, pitch?: number, vol?: number) {
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    playChatPing(pitch, vol);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
}

// ─── component ───────────────────────────────────────────────────────────────

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [{ visible, chosen }, dispatch] = useReducer(reducer, { visible: 0, chosen: null });
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Play a ping every time a new message becomes visible (skip first render)
  useChatPing(visible, 880, 0.18);
  // Slightly different tone when the widget pops open
  useChatPing(open, 660, 0.12);

  // Auto-open after a delay — only once per session
  useEffect(() => {
    const autoId = window.setTimeout(() => {
      if (!dismissed) setOpen(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(autoId);
  }, [dismissed]);

  // Reveal messages one-by-one whenever the widget opens
  useEffect(() => {
    if (!open) return;
    // Clear any pending timers from a previous open
    timerRef.current.forEach(window.clearTimeout);
    timerRef.current = [];

    MESSAGES.forEach((msg) => {
      const id = window.setTimeout(
        () => dispatch({ type: "REVEAL" }),
        msg.delay,
      );
      timerRef.current.push(id);
    });

    return () => timerRef.current.forEach(window.clearTimeout);
  }, [open]);

  function handleDismiss() {
    setOpen(false);
    setDismissed(true);
  }

  return (
    <>
      {/* ── Floating avatar trigger (always visible, unless dismissed) ───── */}
      <AnimatePresence>
        {!dismissed && (
          <motion.button
            key="trigger"
            type="button"
            data-cursor="hover"
            aria-label="Open chat with Wahid"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={() => setOpen((v) => !v)}
            className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full border border-[rgba(111,220,239,0.35)] bg-[rgba(8,13,28,0.9)] p-0.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform hover:scale-105"
          >
            {/* avatar */}
            <img
              src={avatarUrl}
              alt="Wahid"
              className="size-full rounded-full object-cover object-top"
            />
            {/* online dot */}
            <span className="absolute bottom-0.5 right-0.5 size-3 rounded-full border-2 border-[rgba(8,13,28,0.9)] bg-[color:var(--safe)] shadow-[0_0_6px_var(--safe)]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="false"
            aria-label="Chat with Wahid"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[320px] overflow-hidden rounded-2xl border border-[rgba(111,220,239,0.18)] bg-[rgba(8,13,28,0.92)] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-4 py-3">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt="Wahid"
                  className="size-10 rounded-full border border-[rgba(111,220,239,0.3)] object-cover object-top"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[rgba(8,13,28,0.92)] bg-[color:var(--safe)] shadow-[0_0_6px_var(--safe)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight">
                  Md. Wahid
                </p>
                <p className="mono text-[11px] text-[color:var(--safe)]">
                  ● Online · just now
                </p>
              </div>
              <button
                type="button"
                data-cursor="hover"
                aria-label="Close chat"
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1.5 text-[color:var(--muted)] transition-colors hover:bg-[rgba(111,220,239,0.08)] hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            {/* messages */}
            <div className="flex flex-col gap-2.5 px-4 py-4">
              <AnimatePresence initial={false}>
                {MESSAGES.slice(0, visible).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[rgba(255,255,255,0.06)] px-3.5 py-2.5 text-[13.5px] leading-[1.45] text-[color:var(--ink)]"
                  >
                    {msg.text}
                  </motion.div>
                ))}

                {/* typing indicator — shown while messages are still loading */}
                {visible < MESSAGES.length && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex w-14 items-center justify-center gap-1 rounded-2xl rounded-tl-sm bg-[rgba(255,255,255,0.06)] py-3"
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1.5 rounded-full bg-[color:var(--muted)]"
                        style={{ animation: `typing-dot 1.2s ${i * 0.2}s ease-in-out infinite` }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* chosen quick-reply response */}
              <AnimatePresence>
                {chosen !== null && (
                  <>
                    {/* user bubble */}
                    <motion.div
                      key="user-reply"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                      className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[rgba(111,220,239,0.15)] px-3.5 py-2.5 text-[13.5px] text-[color:var(--cyan)]"
                    >
                      {QUICK_REPLIES[chosen].label}
                    </motion.div>
                    {/* bot reply */}
                    <motion.div
                      key="bot-response"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: 0.45 }}
                      className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[rgba(255,255,255,0.06)] px-3.5 py-2.5 text-[13.5px] leading-[1.45] text-[color:var(--ink)]"
                    >
                      {QUICK_REPLIES[chosen].response}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* quick replies */}
            <AnimatePresence>
              {visible >= MESSAGES.length && chosen === null && (
                <motion.div
                  key="quick-replies"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="border-t border-[color:var(--line)] px-4 pb-4 pt-3"
                >
                  <p className="mono mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[color:var(--faint)]">
                    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 15L3 9l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                    Pick a quick reply
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((qr, i) => (
                      <button
                        key={qr.label}
                        type="button"
                        data-cursor="hover"
                        onClick={() => dispatch({ type: "CHOOSE", index: i })}
                        className="rounded-full border border-[rgba(111,220,239,0.28)] bg-[rgba(111,220,239,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[color:var(--ink)] transition-colors hover:border-[rgba(111,220,239,0.55)] hover:bg-[rgba(111,220,239,0.12)] hover:text-white"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* contact link — shown after a reply is chosen */}
            <AnimatePresence>
              {chosen !== null && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="border-t border-[color:var(--line)] px-4 py-3 text-center"
                >
                  <a
                    href="mailto:wahidahmed890@gmail.com"
                    data-cursor="hover"
                    className="mono inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[color:var(--cyan)] transition-opacity hover:opacity-80"
                  >
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    wahidahmed890@gmail.com
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* typing-dot keyframes injected once */}
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
