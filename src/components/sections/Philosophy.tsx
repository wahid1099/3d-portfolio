import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { principles } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";

function Glyph({ kind }: { kind: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.2 } as const;
  return (
    <svg viewBox="0 0 48 48" className="size-12 text-[color:var(--cyan)]" aria-hidden="true">
      {kind === "build" && (
        <g {...common}>
          <rect x="8" y="28" width="14" height="12" rx="2" />
          <rect x="26" y="28" width="14" height="12" rx="2" />
          <rect x="17" y="12" width="14" height="12" rx="2" className="origin-center animate-[drift_4s_ease-in-out_infinite]" />
        </g>
      )}
      {kind === "secure" && (
        <g {...common}>
          <path d="M24 6 39 14v20L24 42 9 34V14z" />
          <path d="M24 14 32 18.5v11L24 34l-8-4.5v-11z" opacity="0.6">
            <animate attributeName="opacity" values="0.25;0.9;0.25" dur="3s" repeatCount="indefinite" />
          </path>
        </g>
      )}
      {kind === "automate" && (
        <g {...common}>
          <circle cx="24" cy="24" r="14" strokeDasharray="4 5">
            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="12s" repeatCount="indefinite" />
          </circle>
          <path d="M24 16v8l6 4" />
        </g>
      )}
      {kind === "learn" && (
        <g {...common}>
          <circle cx="24" cy="24" r="3" fill="currentColor" />
          {[8, 13, 18].map((r, i) => (
            <circle key={r} cx="24" cy="24" r={r} opacity={0.7 - i * 0.2}>
              <animate attributeName="r" values={`${r};${r + 2};${r}`} dur="4s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}
    </svg>
  );
}

function Principle({ p, i }: { p: (typeof principles)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(0)`;
  };
  const reset = () => ref.current && (ref.current.style.transform = "");
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={i % 2 ? "lg:mt-16" : ""}
    >
      <div style={reduce ? undefined : { animation: `drift ${6 + i}s ease-in-out ${i * 0.7}s infinite` }}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className="glass glow-edge rounded-[22px] p-7 transition-transform duration-300 ease-out will-change-transform"
      >
        <Glyph kind={p.glyph} />
        <p className="mt-8 text-[30px] font-semibold tracking-[-0.03em]">{p.k}</p>
        <p className="mt-2 text-[16px] leading-[1.55] text-[color:var(--muted)]">{p.v}</p>
      </div>
      </div>
    </motion.div>
  );
}

export function Philosophy() {
  const ref = useSection("philosophy");
  return (
    <section id="philosophy" ref={ref} className="relative py-32 sm:py-40">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={6}>Engineering philosophy</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">Four operating principles.</h2>
        </Reveal>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <Principle key={p.k} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
