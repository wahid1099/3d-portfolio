import { useEffect, useRef } from "react";

/**
 * Magnetic pull — the element leans a few px toward the cursor when nearby.
 * Keeps everything tiny so it composes well with the rest of the motion.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.25, range = 90) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > range) {
        tx = 0;
        ty = 0;
      } else {
        const k = (1 - dist / range) * strength;
        tx = dx * k;
        ty = dy * k;
      }
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      raf = 0;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, range]);
  return ref;
}

/**
 * Cursor parallax — shifts the element by a fraction of the pointer offset.
 * Cheap on the GPU: uses translate3d only.
 */
export function useParallax<T extends HTMLElement>(amount = 8) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const apply = (x: number, y: number) => {
      el.style.transform = `translate3d(${(x * amount).toFixed(2)}px, ${(y * amount).toFixed(2)}px, 0)`;
      raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      const px = (e.clientX / window.innerWidth) * 2 - 1;
      const py = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(() => apply(px, py));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [amount]);
  return ref;
}