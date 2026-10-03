import { Eyebrow, Reveal } from "../ui/Reveal";
import { useSection } from "../../hooks/useSection";

const TESTIMONIALS = [
  {
    quote:
      "Wahid picks up new stacks frighteningly fast. He migrated our search pipeline from a fragile cron to a fault-tolerant event bus in two weeks.",
    name: "Md. Tanvir Hossain",
    role: "Engineering Lead, EduSphere",
  },
  {
    quote:
      "Reliable, calm under pressure and writes code I'd actually want to review. He's the first person I'd ping for a security-sensitive problem.",
    name: "Sumaiya Rahman",
    role: "Senior Backend Engineer",
  },
  {
    quote:
      "Heaviest contributor on our quantum-safe migration. Doesn't just write the migration — he explains the why.",
    name: "ISARA Advance team",
    role: "Security Partner",
  },
];

export function Testimonials() {
  const ref = useSection("testimonials");
  return (
    <section id="testimonials" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={5}>Words from collaborators</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-[760px] text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            People I've shipped with.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={0.05 * i}>
              <figure className="glass flex h-full flex-col gap-6 rounded-2xl p-7">
                <svg viewBox="0 0 24 24" className="size-6 text-[color:var(--cyan)]" fill="currentColor" aria-hidden="true">
                  <path d="M9 7H5a2 2 0 00-2 2v3a2 2 0 002 2h2v3a2 2 0 002 2v-7a4 4 0 00-4-4zm10 0h-4a2 2 0 00-2 2v3a2 2 0 002 2h2v3a2 2 0 002 2v-7a4 4 0 00-4-4z" />
                </svg>
                <blockquote className="text-[16px] leading-[1.65] text-[color:var(--muted)]">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-auto border-t border-[color:var(--line)] pt-4">
                  <p className="text-[14px] font-medium text-[color:var(--ink)]">{t.name}</p>
                  <p className="mono mt-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">{t.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}