import { motion, useReducedMotion } from "framer-motion";
import { profileFields } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";
import { Scramble } from "../ui/Scramble";

export function About() {
  const ref = useSection("about");
  const reduce = useReducedMotion();
  return (
    <section id="about" ref={ref} className="relative flex min-h-[115vh] items-center py-32">
      <div className="shell grid lg:grid-cols-12">
        <div className="lg:col-span-6 lg:col-start-7 xl:col-span-5 xl:col-start-7">
          <Reveal>
            <Eyebrow layer={1}>Engineer</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">System profile</h2>
          </Reveal>
          <Reveal delay={0.12} className="mt-10">
            <div className="glass glow-edge overflow-hidden rounded-2xl">
              <div className="mono flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3 text-[13px] text-[color:var(--faint)]">
                <span>~/identity/profile.sys</span>
                <span className="flex items-center gap-2 text-[color:var(--safe)]">
                  <span className="size-1.5 rounded-full bg-[color:var(--safe)]" /> verified
                </span>
              </div>
              <dl className="divide-y divide-[color:var(--line)]">
                {profileFields.map((f, i) => (
                  <motion.div
                    key={f.k}
                    className="grid grid-cols-1 items-baseline gap-1.5 px-5 py-4 sm:grid-cols-[170px_1fr] sm:gap-4"
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <dt className="mono text-[13px] tracking-[0.18em] text-[color:var(--faint)]">{f.k}</dt>
                    <dd className="flex flex-col gap-1">
                      {f.v.map((line, j) => (
                        <Scramble
                          key={line}
                          text={line}
                          delay={0.2 + i * 0.12 + j * 0.08}
                          className={
                            j === 0
                              ? i === 0
                                ? "text-[20px] font-medium tracking-[-0.01em] text-[color:var(--ink)]"
                                : "text-[16px] text-[color:var(--ink)]"
                              : "text-[16px] text-[color:var(--muted)]"
                          }
                        />
                      ))}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-[520px] text-[17px] leading-[1.65] text-[color:var(--muted)]">
              I build reliable software systems across the stack, from modern frontend interfaces and backend APIs to
              cloud infrastructure and security-focused platforms.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
