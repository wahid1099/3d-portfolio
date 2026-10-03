import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

export type CaseStudy = {
  id: string;
  n: string;
  category: string;
  title: string;
  tagline: string;
  problem: string;
  approach: string[];
  outcome: string;
  stack: string[];
  links?: { label: string; href: string }[];
};

export function CaseStudyModal({
  open,
  onClose,
  study,
}: {
  open: boolean;
  onClose: () => void;
  study: CaseStudy | null;
}) {
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
      {open && study && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${study.title} case study`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Close case study"
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(2,5,12,0.78)] backdrop-blur-md"
          />
          <motion.div
            initial={reduce ? false : { rotateY: -25, opacity: 0, scale: 0.94 }}
            animate={{ rotateY: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { rotateY: 25, opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: "preserve-3d", perspective: 1200 }}
            className="glass glow-edge relative z-10 max-h-[88vh] w-full max-w-[760px] overflow-y-auto rounded-[24px] p-7 sm:p-10"
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
            <p className="mono flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-[color:var(--faint)]">
              <span className="text-[color:var(--cyan)]">Project {study.n}</span>
              <span className="h-px w-6 bg-[color:var(--line)]" />
              {study.category}
            </p>
            <h3 className="mt-4 text-[clamp(28px,4vw,44px)] font-semibold leading-[1.02] tracking-[-0.04em]">
              {study.title}
            </h3>
            <p className="mt-3 text-[16px] leading-[1.6] text-[color:var(--muted)]">{study.tagline}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mono mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">Problem</p>
                <p className="text-[15px] leading-[1.65] text-[color:var(--muted)]">{study.problem}</p>
              </div>
              <div>
                <p className="mono mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">Outcome</p>
                <p className="text-[15px] leading-[1.65] text-[color:var(--muted)]">{study.outcome}</p>
              </div>
            </div>

            <div className="mt-8">
              <p className="mono mb-3 text-[12px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">Approach</p>
              <ol className="flex flex-col gap-2">
                {study.approach.map((a, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-[1.6] text-[color:var(--muted)]">
                    <span className="mono shrink-0 text-[color:var(--faint)]">{String(i + 1).padStart(2, "0")}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8">
              <p className="mono mb-3 text-[12px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">Stack</p>
              <ul className="flex flex-wrap gap-2">
                {study.stack.map((s) => (
                  <li key={s} className="tag">{s}</li>
                ))}
              </ul>
            </div>

            {study.links && study.links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {study.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.6)] px-5 text-[14px] text-[color:var(--ink)] transition-colors hover:border-[rgba(111,220,239,0.5)]"
                  >
                    {l.label} <span>↗</span>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}