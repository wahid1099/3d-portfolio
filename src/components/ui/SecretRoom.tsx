import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { profile } from "../../data/profile";

const LORE = [
  "You're early. This room isn't indexed.",
  "If you're reading this, you're the kind of person I want to work with.",
  "— Md. Wahid",
];

const LAST_COMMITS = [
  "feat(quantum): add ML-KEM keypair rotation API",
  "fix(devops): reduce cold-start latency on Lambda edges",
  "chore(security): rotate service account credentials",
  "feat(backend): stream LeetCode submissions to OpenSearch",
  "docs(readme): add runbook for incident response",
];

export function SecretRoom({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Secret dev-room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-10"
        >
          <button
            type="button"
            aria-label="Close secret room"
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(2,5,12,0.86)] backdrop-blur-xl"
          />
          <motion.div
            initial={reduce ? false : { rotateX: 18, opacity: 0, scale: 0.95 }}
            animate={{ rotateX: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { rotateX: -18, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass relative z-10 grid max-h-[88vh] w-full max-w-[940px] overflow-y-auto rounded-[24px] border border-[rgba(111,220,239,0.4)] p-7 sm:p-10"
            style={{ transformStyle: "preserve-3d", perspective: 1200 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] p-2 text-[color:var(--muted)] transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
            <p className="mono text-[12px] uppercase tracking-[0.22em] text-[color:var(--cyan)]">
              ▍ SECRET · UNINDEXED · DEV-ROOM
            </p>
            <h3 className="mt-3 text-[clamp(28px,4vw,48px)] font-semibold leading-[1.02] tracking-[-0.04em]">
              You found the dev-room.
            </h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mono mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Lore</p>
                <ol className="flex flex-col gap-3 text-[15px] leading-[1.65] text-[color:var(--muted)]">
                  {LORE.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="mono mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Latest commits</p>
                <ul className="mono flex flex-col gap-1 text-[13px] text-[color:var(--muted)]">
                  {LAST_COMMITS.map((c, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[color:var(--faint)]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[color:var(--ink)]">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--ink)] px-5 text-[14px] font-medium text-[#060a16] transition-colors hover:bg-white"
              >
                Open GitHub →
              </a>
              <a
                href={profile.resume}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.6)] px-5 text-[14px] text-[color:var(--ink)] transition-colors hover:border-[rgba(154,123,255,0.5)]"
              >
                Grab the résumé
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect } from "react";