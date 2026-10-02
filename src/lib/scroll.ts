/**
 * Scroll store shared by the DOM and the WebGL scene.
 * Nothing here triggers React renders: the 3D scene reads it inside useFrame.
 */
type Range = { top: number; height: number };

const elements = new Map<string, HTMLElement>();
const ranges = new Map<string, Range>();

export const scrollState = {
  y: 0,
  smoothY: 0,
  vh: typeof window !== "undefined" ? window.innerHeight : 1,
  velocity: 0,
};

export function measureSections() {
  if (typeof window === "undefined") return;
  scrollState.vh = window.innerHeight;
  const sy = window.scrollY;
  elements.forEach((el, id) => {
    const r = el.getBoundingClientRect();
    ranges.set(id, { top: r.top + sy, height: r.height });
  });
}

export function registerSection(id: string, el: HTMLElement | null) {
  if (el) elements.set(id, el);
  else elements.delete(id);
  measureSections();
}

export function getRange(id: string): Range | undefined {
  return ranges.get(id);
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 when the section top meets the viewport bottom, 1 when its bottom leaves the top. */
export function pass(id: string, y = scrollState.smoothY) {
  const r = ranges.get(id);
  if (!r) return -1;
  return (y + scrollState.vh - r.top) / (r.height + scrollState.vh);
}

/** Progress through a sticky section (0 at pin start, 1 at pin end). */
export function stickyProgress(id: string, y = scrollState.smoothY) {
  const r = ranges.get(id);
  if (!r) return 0;
  const span = Math.max(1, r.height - scrollState.vh);
  return clamp((y - r.top) / span);
}

/** How much of the viewport a section occupies, eased to 0..1. */
export function presence(id: string, y = scrollState.smoothY) {
  const r = ranges.get(id);
  if (!r) return 0;
  const vh = scrollState.vh;
  const overlap = Math.min(y + vh, r.top + r.height) - Math.max(y, r.top);
  const frac = overlap / Math.min(vh, r.height);
  return smoothstep(0.12, 0.72, frac);
}

if (typeof window !== "undefined") {
  scrollState.y = window.scrollY;
  scrollState.smoothY = window.scrollY;
  window.addEventListener("scroll", () => (scrollState.y = window.scrollY), { passive: true });
  window.addEventListener("resize", measureSections);
  window.addEventListener("load", measureSections);
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => measureSections());
    queueMicrotask(() => ro.observe(document.body));
  }
}
