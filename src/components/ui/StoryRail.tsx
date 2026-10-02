import { useEffect, useState } from "react";
import { sectionLayer, storyLayers } from "../../data/profile";
import { getRange, scrollState, stickyProgress } from "../../lib/scroll";

/** The depth gauge: where in the stack the visitor currently is. */
export function StoryRail() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const mid = window.scrollY + window.innerHeight * 0.5;
      let found = 0;
      for (const id of Object.keys(sectionLayer)) {
        const r = getRange(id);
        if (r && mid >= r.top && mid < r.top + r.height) {
          found = sectionLayer[id];
          if (id === "security" && stickyProgress("security", window.scrollY) > 0.78) found = 6;
        }
      }
      setActive((a) => (a === found ? a : found));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    tick();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  void scrollState;

  return (
    <aside
      aria-label="Career depth"
      className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ol className="flex flex-col items-end gap-[14px]">
        {storyLayers.map((l, i) => {
          const on = i === active;
          const past = i < active;
          return (
            <li key={l} className="mono flex items-center gap-3 text-[12px] uppercase tracking-[0.18em]">
              <span
                className="transition-all duration-500"
                style={{
                  color: on ? "var(--ink)" : past ? "var(--faint)" : "rgba(93,104,134,0.55)",
                  opacity: on ? 1 : 0.9,
                  transform: on ? "translateX(0)" : "translateX(4px)",
                }}
              >
                {on ? l : String(i).padStart(2, "0")}
              </span>
              <span
                className="block h-px transition-all duration-500"
                style={{
                  width: on ? 28 : 12,
                  background: on ? "var(--cyan)" : past ? "rgba(111,220,239,0.35)" : "rgba(130,165,255,0.2)",
                  boxShadow: on ? "0 0 10px rgba(111,220,239,0.8)" : "none",
                }}
              />
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
