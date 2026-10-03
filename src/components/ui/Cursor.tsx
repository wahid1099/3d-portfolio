import { useEffect, useRef, useState } from "react";

/**
 * Dual-layer cursor: a sharp dot that snaps to the pointer, and a soft ring
 * that follows with a slight lag. Auto-disabled on touch + coarse pointers
 * and when prefers-reduced-motion is set (we still show the dot, just no lag).
 *
 * Hover state is read from a CSS class on interactive elements, plus a
 * `[data-cursor="…"]` attribute so authors can hint (e.g. "view", "drag").
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [variant, setVariant] = useState<"default" | "hover" | "drag" | "view">("default");
  const reduced = useRef(false);
  const isTouch = useRef(false);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLDivElement | null>(null);
  const points = useRef<{ x: number; y: number; a: number }[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: coarse)");
    isTouch.current = mq.matches || "ontouchstart" in window;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = rm.matches;
    if (isTouch.current) return;

    const canvas = trailCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    fit();
    window.addEventListener("resize", fit);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      points.current.push({ x: mx, y: my, a: 1 });
      if (points.current.length > 28) points.current.shift();
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
      }
      // Find nearest interactive ancestor for hover variant
      const el = (e.target as HTMLElement | null)?.closest?.('[data-cursor], a, button, [role="button"], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (el) {
        const v = (el.getAttribute("data-cursor") as typeof variant) ?? "hover";
        setVariant((cur) => (cur === v ? cur : v));
        targetRef.current = el as HTMLDivElement;
      } else if (variant !== "default") {
        setVariant("default");
        targetRef.current = null;
      }
    };
    const onDown = () => setVariant((v) => (v === "hover" ? "view" : v));
    const onUp = () => setVariant((v) => (v === "view" ? "hover" : v));

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const ease = reduced.current ? 1 : 6;
      rx += (mx - rx) * Math.min(1, dt * ease);
      ry += (my - ry) * Math.min(1, dt * ease);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`;
      }
      // Trail fade
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = points.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.a = Math.max(0, p.a - dt * 3.2);
        const size = (i / pts.length) * 3.5 + 1.5;
        ctx.fillStyle = `rgba(111,220,239,${p.a * 0.55})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", fit);
    };
  }, []);

  if (isTouch.current) return null;
  const size = variant === "default" ? 36 : variant === "hover" ? 56 : variant === "view" ? 64 : 80;
  return (
    <>
      <canvas
        ref={trailCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[80] mix-blend-screen"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[81] rounded-full border transition-[width,height,opacity,border-color] duration-200"
        style={{
          width: size,
          height: size,
          borderColor:
            variant === "drag"
              ? "rgba(154,123,255,0.9)"
              : variant === "view"
                ? "rgba(95,240,200,0.9)"
                : variant === "hover"
                  ? "rgba(111,220,239,0.85)"
                  : "rgba(231,238,248,0.55)",
          boxShadow:
            variant === "default"
              ? "0 0 12px rgba(111,220,239,0.35)"
              : variant === "hover"
                ? "0 0 28px rgba(111,220,239,0.65)"
                : variant === "view"
                  ? "0 0 30px rgba(95,240,200,0.7)"
                  : "0 0 36px rgba(154,123,255,0.7)",
          background:
            variant === "drag"
              ? "rgba(154,123,255,0.06)"
              : variant === "view"
                ? "rgba(95,240,200,0.06)"
                : "transparent",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[82] size-2 rounded-full bg-[color:var(--cyan)] mix-blend-screen"
        style={{ boxShadow: "0 0 8px rgba(111,220,239,0.85)" }}
      />
      {/* Click ripple */}
      <RippleLayer />
    </>
  );
}

function RippleLayer() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;
    let id = 0;
    const onClick = (e: PointerEvent) => {
      id++;
      const r = { id, x: e.clientX, y: e.clientY };
      setRipples((cur) => [...cur, r]);
      window.setTimeout(() => setRipples((cur) => cur.filter((x) => x.id !== id)), 700);
    };
    window.addEventListener("pointerdown", onClick);
    return () => window.removeEventListener("pointerdown", onClick);
  }, []);
  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[79] size-0 rounded-full border border-[color:var(--cyan)]"
          style={{
            transform: `translate3d(${r.x}px, ${r.y}px, 0)`,
            animation: "cursor-ripple 700ms ease-out forwards",
          }}
        />
      ))}
      <style>{`
        @keyframes cursor-ripple {
          0% { width: 0; height: 0; opacity: 0.85; transform: translate3d(var(--rx,0), var(--ry,0),0); }
          100% { width: 80px; height: 80px; opacity: 0; }
        }
      `}</style>
    </>
  );
}