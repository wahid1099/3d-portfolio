import { useEffect, useState } from "react";

export type Tier = "desktop" | "tablet" | "mobile";

export function detectTier(): Tier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (w < 768) return "mobile";
  if (w < 1180 || coarse) return "tablet";
  return "desktop";
}

export function useDeviceTier() {
  const [tier, setTier] = useState<Tier>(detectTier);
  useEffect(() => {
    let t: number;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(() => setTier(detectTier()), 200);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return tier;
}

export function useReducedMotionPref() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}
