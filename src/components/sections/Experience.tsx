import { motion, useReducedMotion } from "framer-motion";
import { experienceModules, experienceTags } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";

/** Career drawn as an architecture diagram: education feeds the org, the org feeds the client, the role fans out into systems. */
export function Experience() {
  const ref = useSection("experience");
  const reduce = useReducedMotion();
  return (
    <section id="experience" ref={ref} className="relative py-32 sm:py-40">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={3}>Backend · Experience</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-[720px] text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Career, as a system diagram.
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_56px_minmax(0,1.6fr)_56px_minmax(0,1fr)] lg:items-center lg:gap-0">
          {/* Upstream: education */}
          <Reveal>
            <div className="glass rounded-2xl p-6">
              <p className="mono text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Upstream · 2025</p>
              <p className="mt-3 text-[18px] font-medium">B.Sc. Computer Science & Engineering</p>
              <p className="mt-1 text-[16px] text-[color:var(--muted)]">Daffodil International University</p>
              <p className="mono mt-4 text-[13px] text-[color:var(--cyan)]">CGPA 3.75</p>
            </div>
          </Reveal>
          <Connector />

          {/* Core node: current role */}
          <Reveal delay={0.1}>
            <div className="glass glow-edge relative rounded-2xl p-7 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="mono flex items-center gap-2 text-[13px] uppercase tracking-[0.18em] text-[color:var(--safe)]">
                  <span className="status-dot" aria-hidden="true" /> Current role
                </p>
                <p className="mono text-[13px] tracking-[0.12em] text-[color:var(--muted)]">2025 — PRESENT</p>
              </div>
              <h3 className="mt-5 text-[clamp(26px,2.6vw,34px)] font-semibold leading-[1.1] tracking-[-0.03em]">
                Junior Software Engineer
              </h3>
              <p className="mt-2 text-[17px] text-[color:var(--ink)]">
                Automation Solutionz <span className="text-[color:var(--faint)]">/</span> ISARA
              </p>
              <p className="mt-5 text-[16px] leading-[1.65] text-[color:var(--muted)]">
                Developing cybersecurity and quantum-safe technology products with a focus on backend systems, cloud
                infrastructure, CI/CD, data processing, and modern web applications.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Technologies">
                {experienceTags.map((t, i) => (
                  <motion.li
                    key={t}
                    className="tag"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                  >
                    {t}
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Connector />

          {/* Downstream: the systems the role touches */}
          <div className="flex flex-col gap-2.5">
            {experienceModules.map((m, i) => (
              <Reveal key={m.label} delay={0.15 + i * 0.06}>
                <div className="group flex items-center gap-4 rounded-xl border border-[color:var(--line)] bg-[rgba(8,13,28,0.5)] px-4 py-3 backdrop-blur-sm transition-colors hover:border-[rgba(111,220,239,0.4)]">
                  <span className="size-2 shrink-0 rounded-[2px] border border-[color:var(--cyan)] transition-colors group-hover:bg-[color:var(--cyan)]" />
                  <div className="min-w-0">
                    <p className="text-[16px] text-[color:var(--ink)]">{m.label}</p>
                    <p className="mono text-[13px] text-[color:var(--faint)]">{m.detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Connector() {
  return (
    <div className="flex h-10 items-center justify-center lg:h-auto" aria-hidden="true">
      <svg className="hidden h-6 w-full lg:block" viewBox="0 0 56 24" preserveAspectRatio="none">
        <line x1="0" y1="12" x2="56" y2="12" stroke="rgba(111,220,239,0.55)" strokeWidth="1" className="flow-line" />
        <circle cx="52" cy="12" r="2.5" fill="#6fdcef" />
      </svg>
      <svg className="h-10 w-6 lg:hidden" viewBox="0 0 24 40" preserveAspectRatio="none">
        <line x1="12" y1="0" x2="12" y2="40" stroke="rgba(111,220,239,0.55)" strokeWidth="1" className="flow-line" />
      </svg>
    </div>
  );
}
