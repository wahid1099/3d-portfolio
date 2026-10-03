import { useEffect, useState } from "react";

/**
 * Top scroll-progress bar — visible only when the user has scrolled past the
 * hero. Updates on a 60 fps rAF loop using scrollY + document height so it
 * stays accurate even during inertia / keyboard nav.
 */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const v = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setP((cur) => (Math.abs(cur - v) < 0.001 ? cur : v));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-[linear-gradient(90deg,rgba(111,220,239,0.95),rgba(154,123,255,0.95))] shadow-[0_0_10px_rgba(111,220,239,0.55)]"
      style={{
        transform: `scaleX(${p})`,
        transition: "transform 80ms linear",
      }}
    />
  );
}