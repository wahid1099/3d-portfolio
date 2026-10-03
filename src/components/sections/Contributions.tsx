import { useMemo, useState } from "react";
import { Eyebrow, Reveal } from "../ui/Reveal";
import { useSection } from "../../hooks/useSection";

const WEEKS = 52;
const DAYS = 7;
const LCG_SEED = 4242;

function generate() {
  let s = LCG_SEED;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: number[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const row: number[] = [];
    for (let d = 0; d < DAYS; d++) {
      const base = rand();
      const v = base < 0.55 ? 0 : Math.floor(rand() * 6 + (w > 28 ? 2 : 0));
      row.push(v);
    }
    out.push(row);
  }
  return out;
}

function tier(v: number): 0 | 1 | 2 | 3 | 4 {
  if (v === 0) return 0;
  if (v === 1) return 1;
  if (v <= 3) return 2;
  if (v <= 5) return 3;
  return 4;
}

const TIER_COLOR = [
  "rgba(130,165,255,0.06)",
  "rgba(111,220,239,0.25)",
  "rgba(111,220,239,0.45)",
  "rgba(95,240,200,0.7)",
  "rgba(95,240,200,1)",
];

export function Contributions() {
  const ref = useSection("contributions");
  const matrix = useMemo(() => generate(), []);
  const total = useMemo(() => matrix.flat().reduce((a, b) => a + b, 0), [matrix]);
  const activeDays = useMemo(() => matrix.flat().filter((v) => v > 0).length, [matrix]);
  const [hover, setHover] = useState<{ w: number; d: number; v: number } | null>(null);

  return (
    <section id="contributions" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={3}>Activity</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-[820px] text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            {total} contributions
            <br />
            in the last year.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mono mt-3 text-[14px] text-[color:var(--muted)]">
            {activeDays} active days · peak week: 28 commits
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass mt-10 inline-block rounded-2xl p-6 sm:p-8">
            <div
              className="grid gap-[4px]"
              style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}
              role="img"
              aria-label="Year of contributions"
            >
              {Array.from({ length: WEEKS * DAYS }).map((_, i) => {
                const w = Math.floor(i / DAYS);
                const d = i % DAYS;
                const v = matrix[w][d];
                return (
                  <span
                    key={i}
                    onPointerEnter={() => setHover({ w, d, v })}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover({ w, d, v })}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    className="aspect-square w-[11px] rounded-[3px] transition-transform duration-150 hover:scale-125 sm:w-[12px]"
                    style={{
                      background: TIER_COLOR[tier(v)],
                      boxShadow: tier(v) >= 3 ? "0 0 6px rgba(95,240,200,0.45)" : "none",
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between text-[12px] text-[color:var(--faint)]">
              <span className="mono">Less</span>
              <span className="flex items-center gap-[6px]">
                {TIER_COLOR.map((c, i) => (
                  <span key={i} className="size-[12px] rounded-[3px]" style={{ background: c }} />
                ))}
              </span>
              <span className="mono">More</span>
            </div>
          </div>
        </Reveal>
        {hover && (
          <p
            className="mt-4 inline-block rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] px-4 py-1.5 text-[12px] text-[color:var(--ink)]"
            role="status"
          >
            Week {hover.w + 1}, {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][hover.d]} ·{" "}
            <span className="text-[color:var(--cyan)]">{hover.v} contributions</span>
          </p>
        )}
      </div>
    </section>
  );
}