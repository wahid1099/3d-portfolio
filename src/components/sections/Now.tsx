import { Reveal } from "../ui/Reveal";
import { useSection } from "../../hooks/useSection";
import { QuranPlayer } from "../ui/QuranPlayer";

const NOW = [
  {
    k: "BUILDING",
    v: "A quantum-safe key rotation service using ML-KEM-768.",
  },
  {
    k: "LEARNING",
    v: "Rust for systems programming and Cloudflare Workers edge compute.",
  },
  {
    k: "READING",
    v: "“Cryptography Engineering” by Ferguson, Schneier & Kohno.",
  },
  {
    k: "WRITING",
    v: "A short series on migrating from RSA to ML-KEM in production.",
  },
];

const TALKS = [
  {
    title: "Designing for Post-Quantum Cryptography in 2025",
    venue: "DevSecOps Community · Dhaka",
    year: "2025",
    href: "#",
  },
  {
    title: "Why your serverless cold-starts are slow",
    venue: "Backend Bangladesh Meetup",
    year: "2024",
    href: "#",
  },
];

export function Now() {
  const ref = useSection("now");
  return (
    <section id="now" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell grid gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
        <Reveal>
          <div>
            <p className="mono flex items-center gap-3 text-[13px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              <span className="text-[color:var(--cyan)]">Now</span>
              <span className="h-px w-8 bg-[color:var(--line)]" />
              live status
            </p>
            <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
              What I'm into
              <br />
              right now.
            </h2>
            <ul className="mt-8 flex flex-col gap-5">
              {NOW.map((n) => (
                <li key={n.k} className="grid grid-cols-[120px_1fr] gap-6 border-b border-[color:var(--line)] pb-5 last:border-0">
                  <span className="mono text-[12px] uppercase tracking-[0.22em] text-[color:var(--cyan)]">{n.k}</span>
                  <span className="text-[17px] leading-[1.55] text-[color:var(--muted)]">{n.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-10">
            <p className="mono flex items-center gap-3 text-[13px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              <span className="text-[color:var(--cyan)]">Listen</span>
              <span className="h-px w-8 bg-[color:var(--line)]" />
              Qur'an
            </p>
            <h2 className="mt-5 text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Recitation for the day.
            </h2>
            <div className="mt-6">
              <QuranPlayer />
            </div>
          </div>
        </Reveal>
        </div>
        <Reveal delay={0.1}>
          <div>
            <p className="mono flex items-center gap-3 text-[13px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              <span className="text-[color:var(--cyan)]">Writing</span>
              <span className="h-px w-8 bg-[color:var(--line)]" />
              talks &amp; posts
            </p>
            <h2 className="mt-5 text-[clamp(28px,3.4vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              On stage &amp; on paper.
            </h2>
            <ul className="mt-8 flex flex-col gap-3">
              {TALKS.map((t) => (
                <li key={t.title}>
                  <a
                    href={t.href}
                    className="group block rounded-2xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] p-5 transition-colors hover:border-[rgba(111,220,239,0.45)]"
                  >
                    <p className="text-[17px] font-medium text-[color:var(--ink)] group-hover:text-[color:var(--cyan)]">{t.title}</p>
                    <p className="mono mt-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
                      {t.venue} · {t.year}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}