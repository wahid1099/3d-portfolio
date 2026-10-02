import { lazy, Suspense } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";
import { useDeviceTier } from "../../hooks/useDeviceTier";

const DeskScene = lazy(() => import("../3d/DeskScene"));

export function Workspace() {
  const ref = useSection("workspace");
  const tier = useDeviceTier();
  const reduce = useReducedMotion();

  return (
    <section id="workspace" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <Eyebrow layer={0}>Workspace</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
              The desk I code at.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-[540px] text-[17px] leading-[1.65] text-[color:var(--muted)]">
              Late-night sessions run on coffee, a lattice-sphere head, and a stack that takes ideas from interface to
              infrastructure. Hover any tile to bring it closer.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-10 space-y-3 text-[15px]">
              {[
                ["Build", "Fast feedback loops in a local-friendly terminal."],
                ["Secure", "Quantum-safe defaults at the transport, not bolted on."],
                ["Repeat", "Reproducible infra, sane rollbacks, no mystery deploys."],
              ].map(([k, v], i) => (
                <motion.li
                  key={k}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.6, delay: 0.25 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3"
                >
                  <span className="mono mt-[3px] text-[12px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[color:var(--ink)]">
                    <strong className="font-medium">{k}.</strong>{" "}
                    <span className="text-[color:var(--muted)]">{v}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[#060a16]/40 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <div className="mono flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3 text-[13px] text-[color:var(--faint)]">
                <span className="flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-[color:var(--cyan)] shadow-[0_0_8px_rgba(111,220,239,0.7)]" />
                  workspace.live
                </span>
                <span>md-wahid · dev</span>
              </div>
              <div className="relative aspect-[4/3] w-full">
                <Suspense fallback={<DeskFallbackShell />}>
                  <DeskScene tier={tier} />
                </Suspense>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#04060d] to-transparent" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function DeskFallbackShell() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#04060d]">
      <div className="flex items-center gap-2 text-[color:var(--faint)]">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-[color:var(--cyan)]" />
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-[color:var(--cyan)] [animation-delay:120ms]" />
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-[color:var(--cyan)] [animation-delay:240ms]" />
      </div>
    </div>
  );
}