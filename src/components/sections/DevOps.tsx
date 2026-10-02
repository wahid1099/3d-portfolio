import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { pipeline } from "../../data/pipeline";
import { labelEls, layerEls } from "../../lib/store";
import { registerSection } from "../../lib/scroll";
import { Eyebrow, Reveal } from "../ui/Reveal";

export function DevOps({ has3D }: { has3D: boolean }) {
  return has3D ? <DevOps3D /> : <DevOpsMobile />;
}

function DevOps3D() {
  const el = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: el, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const f = Math.min(1, Math.max(0, p * 1.08 - 0.02)) * (pipeline.length - 1);
    const i = Math.round(f);
    setActive((a) => (a === i ? a : i));
  });
  const stage = pipeline[active];

  return (
    <section
      id="devops"
      ref={(n) => {
        el.current = n;
        registerSection("devops", n);
      }}
      className="relative h-[560vh]"
    >
      <div className="sticky top-0 flex h-screen items-center">
        <div className="shell">
          <div className="max-w-[420px]">
            <Reveal>
              <Eyebrow layer={4}>Cloud / DevOps</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
                From commit
                <br />
                to production.
              </h2>
            </Reveal>

            <div className="glass mt-9 rounded-2xl p-6" aria-live="polite">
              <div className="mono flex items-center justify-between text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
                <span>
                  Stage <span className="text-[color:var(--cyan)]">{String(active + 1).padStart(2, "0")}</span> / {String(pipeline.length).padStart(2, "0")}
                </span>
                <span>{stage.role}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="mt-4 text-[28px] font-semibold tracking-[-0.03em]">{stage.label}</p>
                  <p className="mt-2 min-h-[52px] text-[16px] leading-[1.6] text-[color:var(--muted)]">{stage.desc}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-5 flex gap-1.5" aria-hidden="true">
                {pipeline.map((p, i) => (
                  <span
                    key={p.id}
                    className="h-[3px] flex-1 rounded-full transition-colors duration-500"
                    style={{ background: i <= active ? (i === pipeline.length - 1 ? "var(--safe)" : "var(--cyan)") : "rgba(130,165,255,0.15)" }}
                  />
                ))}
              </div>
            </div>
            <ol className="sr-only">
              {pipeline.map((p) => (
                <li key={p.id}>
                  {p.label}: {p.desc}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <div
        ref={(n) => (n ? layerEls.set("devops", n) : layerEls.delete("devops"))}
        className="pointer-events-none fixed inset-0 z-20"
        style={{ opacity: 0, visibility: "hidden" }}
        aria-hidden="true"
      >
        {pipeline.map((p, i) => (
          <div
            key={p.id}
            ref={(n) => (n ? labelEls.set(`pipe-${i}`, n) : labelEls.delete(`pipe-${i}`))}
            className="pipe-label node-label text-center"
            style={{ opacity: 0 }}
            data-active="false"
          >
            <p className="pipe-name mono text-[13px] uppercase tracking-[0.2em] text-[color:var(--muted)]">{p.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DevOpsMobile() {
  return (
    <section
      id="devops"
      ref={(n) => registerSection("devops", n)}
      className="relative py-28"
    >
      <div className="mx-auto w-full px-5 sm:px-8">
        <Reveal>
          <Eyebrow layer={4}>Cloud / DevOps</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 text-[36px] font-semibold leading-[1.02] tracking-[-0.04em]">From commit to production.</h2>
        </Reveal>
        <ol className="relative mt-10 flex flex-col gap-3">
          <span className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-[rgba(111,220,239,0.6)] to-[rgba(95,240,200,0.5)]" aria-hidden="true">
            <span className="packet" style={{ animationDuration: "5s" }} />
          </span>
          {pipeline.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.04}>
              <li className="relative flex gap-4 pl-0">
                <span className="mono relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-[color:var(--line)] bg-[#070c1a] text-[12px] text-[color:var(--cyan)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="glass flex-1 rounded-xl px-4 py-3">
                  <p className="text-[16px] font-medium">{p.label}</p>
                  <p className="mt-0.5 text-[15px] leading-[1.5] text-[color:var(--muted)]">{p.desc}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
