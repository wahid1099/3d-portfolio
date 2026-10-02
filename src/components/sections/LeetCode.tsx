import { useRef } from "react";
import { useInView } from "framer-motion";
import { profile } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Reveal } from "../ui/Reveal";
import { useLeetCodeStats } from "../../hooks/useLeetCodeStats";

const FALLBACK_DAYS = 300;

export function LeetCode() {
  const ref = useSection("leetcode");
  const grid = useRef<HTMLDivElement>(null);
  const inView = useInView(grid, { once: true, margin: "-15% 0px" });
  const { stats, loading, error, source } = useLeetCodeStats();

  const solved = stats?.totalSolved ?? 0;
  const easy = stats?.easySolved ?? 0;
  const medium = stats?.mediumSolved ?? 0;
  const hard = stats?.hardSolved ?? 0;
  const ranking = stats?.ranking ?? 0;
  const days = stats?.streakDays ?? FALLBACK_DAYS;

  // Approx active-day count for the visual grid (300 grid cells, animated).
  // If we know the real streak, stretch the colored cells to cover it; otherwise show 300.
  const activeCells = source === "live" ? Math.max(60, Math.min(DAYS, days)) : days;

  return (
    <section id="leetcode" ref={ref} className="relative pb-24 pt-20 lg:pt-36">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col gap-8 rounded-[22px] border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] p-7 backdrop-blur-sm lg:flex-row lg:items-center lg:gap-12 lg:p-9">
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <p className="mono text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Problem solving</p>
                <span
                  className={`inline-block size-1.5 rounded-full ${
                    source === "live"
                      ? "bg-[color:var(--safe)] shadow-[0_0_8px_rgba(95,240,200,0.7)]"
                      : source === "cache"
                        ? "bg-[color:var(--cyan)]"
                        : "bg-[color:var(--threat)]"
                  }`}
                  title={source === "live" ? "Live LeetCode data" : source === "cache" ? "Cached data" : "Showing fallback"}
                />
              </div>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">
                  {loading && !stats ? "—" : solved}
                </span>
                <span className="text-[17px] text-[color:var(--muted)]">problems solved</span>
              </p>
              <p className="mt-3 text-[16px] text-[color:var(--muted)]">
                {stats ? `${days}+ day LeetCode streak` : "Consistent problem solving and algorithmic thinking."}
              </p>
              <a
                href={profile.leetcode}
                target="_blank"
                rel="noreferrer"
                className="mono mt-4 inline-block text-[13px] text-[color:var(--cyan)] hover:text-white"
              >
                leetcode/{profile.leetcodeUser} ↗
              </a>
              {error && source !== "live" && (
                <p className="mono mt-2 text-[11px] text-[color:var(--threat)]">{error}</p>
              )}
            </div>
            <div
              ref={grid}
              className="grid flex-1 gap-[3px]"
              style={{ gridTemplateColumns: "repeat(50, minmax(0, 1fr))" }}
              role="img"
              aria-label={`${stats?.streakDays ?? 300} consecutive days of solved problems`}
            >
              {Array.from({ length: 300 }, (_, i) => {
                const active = i < activeCells;
                return (
                  <span
                    key={i}
                    className="aspect-square rounded-[2px] transition-[background-color,box-shadow] duration-500"
                    style={{
                      transitionDelay: `${i * 4}ms`,
                      background: inView
                        ? active
                          ? `rgba(111,220,239,${0.28 + ((i * 37) % 11) / 18})`
                          : "rgba(130,165,255,0.05)"
                        : "rgba(130,165,255,0.08)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Difficulty breakdown + ranking — only meaningful when live data is present */}
        {stats && (easy > 0 || medium > 0 || hard > 0) && (
          <Reveal delay={0.1}>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <DifficultyCell label="Easy" solved={easy} total={stats.totalSolved} tint="rgba(95,240,200,1)" />
              <DifficultyCell label="Medium" solved={medium} total={stats.totalSolved} tint="rgba(111,220,239,1)" />
              <DifficultyCell label="Hard" solved={hard} total={stats.totalSolved} tint="rgba(154,123,255,1)" />
              <DifficultyCell label="Total" solved={stats.totalSolved} total={stats.totalSolved} tint="rgba(255,255,255,1)" />
              <RankingCell ranking={ranking} />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

const DAYS = 300;

function DifficultyCell({
  label,
  solved,
  total,
  tint,
}: {
  label: string;
  solved: number;
  total: number;
  tint: string;
}) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] px-4 py-3 backdrop-blur-sm">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--faint)]">{label}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-[22px] font-semibold leading-none" style={{ color: tint }}>
          {solved}
        </span>
        <span className="mono text-[12px] text-[color:var(--faint)]">{pct}%</span>
      </p>
    </div>
  );
}

function RankingCell({ ranking }: { ranking: number }) {
  if (!ranking) {
    return (
      <div className="rounded-xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] px-4 py-3 backdrop-blur-sm">
        <p className="mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--faint)]">Ranking</p>
        <p className="mt-1 text-[14px] text-[color:var(--muted)]">hidden</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] px-4 py-3 backdrop-blur-sm">
      <p className="mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--faint)]">Global rank</p>
      <p className="mt-1 text-[22px] font-semibold leading-none text-[color:var(--cyan)]">
        #{ranking.toLocaleString()}
      </p>
    </div>
  );
}