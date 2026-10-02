import { useRef } from "react";
import { useInView } from "framer-motion";
import { profile } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Reveal } from "../ui/Reveal";

const DAYS = 300;

export function LeetCode() {
  const ref = useSection("leetcode");
  const grid = useRef<HTMLDivElement>(null);
  const inView = useInView(grid, { once: true, margin: "-15% 0px" });
  return (
    <section id="leetcode" ref={ref} className="relative pb-24 pt-20 lg:pt-36">
      <div className="shell">
        <Reveal>
          <div className="flex flex-col gap-8 rounded-[22px] border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] p-7 backdrop-blur-sm lg:flex-row lg:items-center lg:gap-12 lg:p-9">
            <div className="shrink-0">
              <p className="mono text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Problem solving</p>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">300+</span>
                <span className="text-[17px] text-[color:var(--muted)]">day LeetCode streak</span>
              </p>
              <p className="mt-3 text-[16px] text-[color:var(--muted)]">Consistent problem solving and algorithmic thinking.</p>
              <a
                href={profile.leetcode}
                target="_blank"
                rel="noreferrer"
                className="mono mt-4 inline-block text-[13px] text-[color:var(--cyan)] hover:text-white"
              >
                leetcode/{profile.leetcodeUser} ↗
              </a>
            </div>
            <div
              ref={grid}
              className="grid flex-1 gap-[3px]"
              style={{ gridTemplateColumns: "repeat(50, minmax(0, 1fr))" }}
              role="img"
              aria-label="300 consecutive days of solved problems"
            >
              {Array.from({ length: DAYS }, (_, i) => (
                <span
                  key={i}
                  className="aspect-square rounded-[2px] transition-[background-color,box-shadow] duration-500"
                  style={{
                    transitionDelay: `${i * 4}ms`,
                    background: inView
                      ? `rgba(111,220,239,${0.28 + ((i * 37) % 11) / 18})`
                      : "rgba(130,165,255,0.08)",
                  }}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
