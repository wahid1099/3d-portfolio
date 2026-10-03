import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { sectionLayer, storyLayers } from "../../data/profile";
import { getRange, scrollState, stickyProgress } from "../../lib/scroll";
import { ProgressOrb } from "../3d/ProgressOrb";

/** Each story layer is anchored to the first section id that appears under it. */
const LAYER_TO_SECTION: Record<(typeof storyLayers)[number], string> = {
  Person: "about",
  Engineer: "experience",
  "Full-Stack": "stack",
  Backend: "backend",
  "Cloud / DevOps": "devops",
  Security: "security",
  "Quantum-Safe": "security",
};

/** The depth gauge: where in the stack the visitor currently is. */
export function StoryRail() {
  const [active, setActive] = useState(0);
  const total = storyLayers.length;
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

  const jump = (label: (typeof storyLayers)[number]) => {
    const id = LAYER_TO_SECTION[label];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <aside
      aria-label="Career depth"
      className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <div className="mb-4 ml-auto flex flex-col items-end gap-2">
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--faint)]">
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <div className="h-[68px] w-[68px]">
          <Canvas
            camera={{ position: [0, 0, 2.6], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            aria-hidden="true"
          >
            <ProgressOrb />
          </Canvas>
        </div>
      </div>

      <nav aria-label="Jump to story layer">
        <ol className="flex flex-col items-end gap-[10px]">
          {storyLayers.map((l, i) => {
            const on = i === active;
            const past = i < active;
            return (
              <li key={l}>
                <button
                  type="button"
                  data-cursor="hover"
                  onClick={() => jump(l)}
                  aria-current={on ? "true" : undefined}
                  aria-label={`Jump to ${l}`}
                  className="mono group flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] transition-opacity"
                  style={{ opacity: past || on ? 1 : 0.7 }}
                >
                  <span
                    className="transition-all duration-500"
                    style={{
                      color: on ? "var(--ink)" : past ? "var(--faint)" : "rgba(93,104,134,0.85)",
                      transform: on ? "translateX(0)" : "translateX(4px)",
                    }}
                  >
                    {on ? l : String(i).padStart(2, "0")}
                  </span>
                  <span
                    className="block h-px transition-all duration-500"
                    style={{
                      width: on ? 28 : 12,
                      background: on
                        ? "var(--cyan)"
                        : past
                          ? "rgba(111,220,239,0.35)"
                          : "rgba(130,165,255,0.25)",
                      boxShadow: on ? "0 0 10px rgba(111,220,239,0.8)" : "none",
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}