import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const GLYPHS = "ABCDEF0123456789#$%&*+=<>/\\";
const scramble = (s: string) =>
  s
    .split("")
    .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
    .join("");

/** Text that "decrypts" into place when scrolled into view. */
export function Scramble({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(() => (reduce ? text : scramble(text)));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setOut(text);
      return;
    }
    const duration = 800;
    let id: number;
    const start = window.setTimeout(() => {
      const t0 = performance.now();
      id = window.setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / duration);
        const settled = Math.floor(k * text.length);
        setOut(
          text
            .split("")
            .map((c, i) => (c === " " || i < settled ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(""),
        );
        if (k >= 1) {
          window.clearInterval(id);
          setOut(text);
        }
      }, 34);
    }, delay * 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [inView, reduce, text, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}
