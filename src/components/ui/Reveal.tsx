import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 26,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that rises word by word out of a mask. */
export function SplitHeadline({
  lines,
  className = "",
  accent,
  as: Tag = "h2",
  delay = 0,
}: {
  lines: string[];
  className?: string;
  accent?: string[];
  as?: "h1" | "h2";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  let idx = 0;
  return (
    <Tag className={className} aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(" ").map((word, wi) => {
            const i = idx++;
            const isAccent = accent?.some((a) => word.replace(/[.,]/g, "") === a);
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className={"inline-block " + (isAccent ? "text-[color:var(--cyan)]" : "")}
                  initial={reduce ? false : { y: "105%" }}
                  whileInView={{ y: "0%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: delay + i * 0.06, ease }}
                >
                  {word}
                  {wi < line.split(" ").length - 1 ? "\u00a0" : ""}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

export function Eyebrow({ layer, children }: { layer: number; children: ReactNode }) {
  return (
    <p className="mono flex items-center gap-3 text-[13px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
      <span className="text-[color:var(--cyan)]">L{String(layer).padStart(2, "0")}</span>
      <span className="h-px w-8 bg-[color:var(--line)]" />
      {children}
    </p>
  );
}
