import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { profile } from "../../data/profile";
import avatarUrl from "../../assets/my-pic.png";

/**
 * Flippable résumé card. Front: avatar + identity + headline.
 * Back: skill chips + "Open résumé" CTA.
 * Keyboard: Space/Enter when focused flips.
 */
export function ResumeCard() {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-flip back after 6s so the front face remains the canonical state
  useEffect(() => {
    if (!flipped) return;
    const id = window.setTimeout(() => setFlipped(false), 7000);
    return () => window.clearTimeout(id);
  }, [flipped]);

  // Accessibility: trap focus inside the flipped card and announce state
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("keydown", trapFocus);
    return () => el.removeEventListener("keydown", trapFocus);
  }, []);

  const trapFocus = (e: KeyboardEvent) => {
    if (e.key !== "Tab" || !wrapperRef.current) return;
    const focusables = wrapperRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={wrapperRef}
      data-cursor="view"
      onClick={() => setFlipped((v) => !v)}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`Résumé card · ${profile.name}. Click to flip and reveal skills and download link.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((v) => !v);
        } else if (e.key === "Escape" && flipped) {
          setFlipped(false);
        }
      }}
      className="relative h-[280px] w-[200px] cursor-pointer select-none rounded-2xl [perspective:1200px] focus:outline-none focus:ring-2 focus:ring-[rgba(111,220,239,0.6)] sm:h-[320px] sm:w-[228px]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduce ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-[rgba(111,220,239,0.3)] bg-[rgba(8,13,28,0.92)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          style={{ backfaceVisibility: "hidden" }}
          aria-hidden={flipped}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${avatarUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center 18%",
              filter: "saturate(0.85)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 35%, rgba(4,6,13,0.85) 78%, rgba(4,6,13,0.95) 100%), linear-gradient(90deg, rgba(111,220,239,0.15), transparent 35%)",
            }}
          />
          <div className="absolute inset-x-4 bottom-4">
            <p className="mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--cyan)]">// résumé</p>
            <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">{profile.name}</p>
            <p className="mt-1 text-[12px] text-[color:var(--muted)]">{profile.title}</p>
            <p className="mono mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[color:var(--faint)]">
              <span className="size-1.5 rounded-full bg-[color:var(--safe)] shadow-[0_0_6px_var(--safe)]" />
              tap to flip
            </p>
          </div>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-[rgba(154,123,255,0.3)] bg-[rgba(8,13,28,0.95)] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-hidden={!flipped}
        >
          <p className="mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--violet)]">// core</p>
          <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">What I bring</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {["TypeScript", "Node.js", "Postgres", "AWS", "Docker", "K8s", "ML-KEM-768", "Terraform"].map((s) => (
              <li
                key={s}
                className="rounded-full border border-[color:var(--line)] bg-[rgba(111,220,239,0.06)] px-2 py-0.5 text-[10px] text-[color:var(--muted)]"
              >
                {s}
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1.5 text-[11px] text-[color:var(--muted)]">
            <li className="flex items-center gap-2"><Dot /> Backend &amp; APIs</li>
            <li className="flex items-center gap-2"><Dot /> Cloud &amp; DevOps</li>
            <li className="flex items-center gap-2"><Dot /> Post-Quantum Crypto</li>
          </ul>
          <a
            href={profile.resume}
            target="_blank"
            rel="noreferrer"
            data-cursor="hover"
            className="absolute inset-x-5 bottom-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] text-[12px] font-medium text-[#060a16] transition-transform hover:scale-[1.02]"
            onClick={(e) => e.stopPropagation()}
          >
            Open résumé
            <span>↗</span>
          </a>
        </div>
      </motion.div>

      <AnimatePresence>
        {flipped && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mono absolute -bottom-7 left-0 right-0 text-center text-[10px] uppercase tracking-[0.22em] text-[color:var(--faint)]"
          >
            press <kbd className="rounded border border-[color:var(--line)] px-1.5">Esc</kbd> to flip back
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dot() {
  return <span className="size-1.5 shrink-0 rounded-full bg-[color:var(--cyan)]" aria-hidden />;
}