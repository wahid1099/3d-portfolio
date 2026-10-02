import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { profile } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal, SplitHeadline } from "../ui/Reveal";

const script = [
  { kind: "cmd", text: "./open-channel --to md.wahid" },
  { kind: "out", text: "negotiating key exchange … ML-KEM-768 ✓" },
  { kind: "out", text: "channel established · quantum-safe" },
];

const links = [
  { k: "github", label: profile.githubLabel, href: profile.github },
  { k: "linkedin", label: profile.linkedinLabel, href: profile.linkedin },
  { k: "email", label: profile.email, href: `mailto:${profile.email}` },
];

export function Contact() {
  const ref = useSection("contact");
  const term = useRef<HTMLDivElement>(null);
  const inView = useInView(term, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? script.length + links.length : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      setShown(n);
      if (n >= script.length + links.length) window.clearInterval(id);
    }, 380);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  return (
    <section id="contact" ref={ref} className="relative flex min-h-[100vh] items-center py-32">
      <div className="shell">
        <div className="max-w-[660px]">
          <Reveal>
            <Eyebrow layer={6}>Contact</Eyebrow>
          </Reveal>
          <SplitHeadline
            lines={["Let's Build", "Something Secure."]}
            accent={["Secure."]}
            className="mt-5 text-[clamp(40px,5.6vw,84px)] font-semibold leading-[0.98] tracking-[-0.045em]"
          />

          <div ref={term} className="glass glow-edge mono mt-12 overflow-hidden rounded-2xl text-[14px] sm:text-[15px]">
            <div className="flex items-center gap-2 border-b border-[color:var(--line)] px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#2a3556]" />
              <span className="size-2.5 rounded-full bg-[#2a3556]" />
              <span className="size-2.5 rounded-full bg-[#2a3556]" />
              <span className="ml-3 text-[13px] text-[color:var(--faint)]">wahid@secure-core: ~</span>
            </div>
            <div className="flex min-h-[260px] flex-col gap-2 p-5 sm:p-6">
              {script.slice(0, shown).map((l, i) => (
                <p key={i} className={l.kind === "cmd" ? "text-[color:var(--ink)]" : "text-[color:var(--muted)]"}>
                  {l.kind === "cmd" ? <span className="text-[color:var(--cyan)]">$ </span> : <span className="text-[color:var(--faint)]">› </span>}
                  {l.text}
                </p>
              ))}
              <ul className="mt-2 flex flex-col gap-2">
                {links.slice(0, Math.max(0, shown - script.length)).map((l) => (
                  <li key={l.k}>
                    <a
                      href={l.href}
                      target={l.k === "email" ? undefined : "_blank"}
                      rel="noreferrer"
                      className="group flex items-baseline gap-3 break-all"
                    >
                      <span className="w-[86px] shrink-0 text-[color:var(--faint)]">{l.k}</span>
                      <span className="text-[color:var(--ink)] underline decoration-[rgba(111,220,239,0.3)] underline-offset-4 transition-colors group-hover:text-[color:var(--cyan)] group-hover:decoration-[color:var(--cyan)]">
                        {l.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              {shown < script.length + links.length && <span className="inline-block h-[1.1em] w-2 animate-pulse bg-[color:var(--cyan)]" />}
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${profile.email}?subject=Let's%20build%20something%20secure`}
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-[color:var(--ink)] px-8 text-[16px] font-medium text-[#060a16] transition-all hover:bg-white hover:shadow-[0_0_50px_rgba(111,220,239,0.35)]"
              >
                Start a Conversation
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href={profile.resume}
                download={profile.resumeFileName}
                className="group inline-flex h-14 items-center gap-3 rounded-full border border-[color:var(--line)] bg-[rgba(10,16,34,0.5)] px-7 text-[15px] text-[color:var(--ink)] backdrop-blur-md transition-all hover:border-[rgba(154,123,255,0.5)]"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                Download Résumé
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-[color:var(--line)]">
      <div className="shell flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[18px] font-semibold tracking-[-0.02em]">Md. Wahid</p>
          <p className="mt-1 text-[15px] text-[color:var(--muted)]">Software Engineer</p>
          <p className="mono mt-3 text-[13px] tracking-[0.06em] text-[color:var(--faint)]">Backend • Cloud • DevOps • Quantum-Safe Security</p>
        </div>
        <div className="mono flex flex-wrap gap-5 text-[13px] text-[color:var(--muted)]">
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)]">GitHub</a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)]">LinkedIn</a>
          <a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)]">Previous portfolio</a>
          <span className="text-[color:var(--faint)]">Dhaka · {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
