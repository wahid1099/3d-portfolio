import { useEffect, useMemo, useRef, useState } from "react";
import type { Repo } from "../../hooks/useGitHubRepos";

/**
 * Snake that "eats" the GitHub repos. A real snake (head + body + tail) lives
 * on a grid sized to the live repo list. The head moves every tick in a random
 * non-reverse direction. When it lands on a cell that has a repo, the repo is
 * "consumed" — its card collapses into a glowing node that becomes food, and
 * the snake grows by one segment. When all repos are eaten, the loop resets.
 *
 * Implementation:
 *  - Single <canvas> for the snake trail (low-poly grid, glow, gradient).
 *  - DOM repo cards underneath; CSS handles their collapse animation.
 *  - requestAnimationFrame with a fixed tick (160 ms per step) so the snake
 *    reads as alive without being frantic.
 *  - Respects prefers-reduced-motion: shows a static "consumed" grid only.
 */
export function SnakeEatsRepos({ repos }: { repos: Repo[] }) {
  const cellsPerRow = 8;
  const totalCells = useMemo(() => {
    const n = Math.max(cellsPerRow, repos.length);
    // round up to multiple of cellsPerRow
    return Math.ceil(n / cellsPerRow) * cellsPerRow;
  }, [repos.length]);
  const rowCount = totalCells / cellsPerRow;

  const [consumed, setConsumed] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset when repos change.
  useEffect(() => {
    setConsumed(new Set());
    setScore(0);
    setLength(4);
  }, [repos.length]);

  const allConsumed = consumed.size >= repos.length && repos.length > 0;

  // Main loop. Snake state is kept in refs so the canvas redraws without
  // re-rendering React.
  const snakeRef = useRef<{ x: number; y: number; dir: 0 | 1 | 2 | 3; body: { x: number; y: number }[] }>({
    x: 0,
    y: 0,
    dir: 1, // right
    body: [],
  });
  const stepRef = useRef(0);

  useEffect(() => {
    if (allConsumed) return; // pause when loop is done; React restart will tick again
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrap = containerRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let lastStep = 0;
    const stepMs = reduce ? 1e9 : 170;

    // initial snake: center, length 4, heading right
    snakeRef.current = {
      x: Math.floor(cellsPerRow / 2) - 2,
      y: 0,
      dir: 1,
      body: [],
    };

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = rect.width;
      const H = rect.height;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const pad = 16;
      const gridW = W - pad * 2;
      const gridH = H - pad * 2;
      const cell = Math.min(gridW / cellsPerRow, gridH / rowCount);
      const ox = (W - cell * cellsPerRow) / 2;
      const oy = (H - cell * rowCount) / 2;

      // grid dots
      ctx.fillStyle = "rgba(111,220,239,0.18)";
      for (let y = 0; y < rowCount; y++) {
        for (let x = 0; x < cellsPerRow; x++) {
          ctx.beginPath();
          ctx.arc(ox + cell * (x + 0.5), oy + cell * (y + 0.5), Math.max(1, cell * 0.06), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // snake
      const head = snakeRef.current;
      const body = [head, ...head.body];
      body.forEach((seg, i) => {
        const isHead = i === 0;
        const radius = cell * (isHead ? 0.42 : 0.34);
        const cx = ox + cell * (seg.x + 0.5);
        const cy = oy + cell * (seg.y + 0.5);
        // glow
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.4);
        grd.addColorStop(0, isHead ? "rgba(154,123,255,0.85)" : "rgba(95,240,200,0.55)");
        grd.addColorStop(1, "rgba(95,240,200,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.fillStyle = isHead ? "#9a7bff" : "#5ff0c8";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        // eyes
        if (isHead) {
          ctx.fillStyle = "#04060d";
          const eyeOff = cell * 0.12;
          const eyeR = cell * 0.06;
          ctx.beginPath();
          ctx.arc(cx + eyeOff, cy - eyeOff, eyeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx + eyeOff, cy + eyeOff, eyeR, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const tick = (now) => {
      if (now - lastStep >= stepMs) {
        lastStep = now;
        const s = snakeRef.current;
        // 90% straight, 10% turn
        const r = Math.random();
        if (r < 0.1) {
          const turn = Math.random() < 0.5 ? -1 : 1;
          s.dir = (((s.dir + turn) % 4) + 4) % 4;
        }
        const dx = [0, 1, 0, -1][s.dir];
        const dy = [1, 0, -1, 0][s.dir];
        // wrap
        let nx = s.x + dx;
        let ny = s.y + dy;
        if (nx < 0) nx = cellsPerRow - 1;
        if (nx >= cellsPerRow) nx = 0;
        if (ny < 0) ny = rowCount - 1;
        if (ny >= rowCount) ny = 0;

        s.body.unshift({ x: s.x, y: s.y });
        while (s.body.length > length - 1) s.body.pop();
        s.x = nx;
        s.y = ny;

        // check if consumed a repo cell
        const idx = ny * cellsPerRow + nx;
        if (idx < repos.length && !consumed.has(idx)) {
          setConsumed((prev) => {
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
          setScore((p) => p + 1);
          setLength((p) => Math.min(p + 1, rowCount * cellsPerRow));
        }
        stepRef.current++;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // we intentionally don't depend on `consumed` here; we read via setState callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, length, allConsumed]);

  return (
    <div
      ref={containerRef}
      className="relative isolate overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[linear-gradient(180deg,#0a1226,#04060d)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      {/* Repo cards sit on top, dimmed as they get consumed */}
      <div
        className="relative grid gap-3 p-6 sm:p-8"
        style={{
          gridTemplateColumns: `repeat(${cellsPerRow}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => {
          const repo = repos[i];
          const isConsumed = consumed.has(i);
          return (
            <RepoSlot key={i} repo={repo} index={i} consumed={isConsumed} />
          );
        })}
      </div>

      {/* HUD */}
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <span className="mono rounded-full border border-[color:var(--line)] bg-[rgba(6,10,22,0.7)] px-3 py-1.5 text-[12px] uppercase tracking-[0.16em] text-[color:var(--ink)] backdrop-blur">
          ★ {score}
        </span>
        <span className="mono rounded-full border border-[color:var(--line)] bg-[rgba(6,10,22,0.7)] px-3 py-1.5 text-[12px] uppercase tracking-[0.16em] text-[color:var(--ink)] backdrop-blur">
          len {length}
        </span>
      </div>

      {allConsumed && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-[#04060d] via-[rgba(4,6,13,0.7)] to-transparent p-6">
          <button
            type="button"
            onClick={() => {
              setConsumed(new Set());
              setScore(0);
              setLength(4);
            }}
            className="mono inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-5 py-2.5 text-[13px] uppercase tracking-[0.18em] text-[#060a16] hover:bg-white"
          >
            ↻ replay
          </button>
          <p className="mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
            all {repos.length} repos consumed
          </p>
        </div>
      )}
    </div>
  );
}

function RepoSlot({
  repo,
  index,
  consumed,
}: {
  repo: Repo | undefined;
  index: number;
  consumed: boolean;
}) {
  if (!repo) {
    return <div className="aspect-square rounded-lg border border-dashed border-[color:var(--line)]/40" />;
  }
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className="group aspect-square rounded-lg border border-[color:var(--line)] bg-[rgba(6,10,22,0.55)] p-2 transition-all duration-500 hover:border-[rgba(111,220,239,0.5)]"
      style={{
        opacity: consumed ? 0 : 1,
        transform: consumed ? "scale(0.4) rotate(8deg)" : "scale(1)",
        filter: consumed ? "blur(2px)" : "blur(0)",
        pointerEvents: consumed ? "none" : "auto",
      }}
      aria-label={`Repo ${repo.name}`}
    >
      <p className="mono text-[9px] uppercase tracking-[0.12em] text-[color:var(--faint)]">
        {String(index + 1).padStart(2, "0")}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-[color:var(--ink)]">{repo.name}</p>
      <p className="mono mt-0.5 truncate text-[9px] text-[color:var(--cyan)]">
        {languageLabel(repo.language)}
      </p>
    </a>
  );
}

function languageLabel(lang: string | null): string {
  if (!lang) return "—";
  const map: Record<string, string> = {
    TypeScript: "TS",
    JavaScript: "JS",
    Python: "Py",
    Go: "Go",
    Rust: "Rs",
    Dart: "Dart",
    Shell: "sh",
  };
  return map[lang] ?? lang;
}