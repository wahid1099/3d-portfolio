import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";
import { useDeviceTier } from "../../hooks/useDeviceTier";
import { profile } from "../../data/profile";

const DeskScene = lazy(() => import("../3d/DeskScene"));

type Tab = "code" | "terminal" | "processes";

const CODE = `// ~/projects/quantum-key-rotation/src/server.ts
import { MlKem768 } from "pqc";
import { rotate } from "./keys";
import { audit } from "./security";

export async function rotateOrg(orgId: string) {
  const old = await rotate.fetchActive(orgId);
  const fresh = await MlKem768.generate();
  await audit.verify(orgId, fresh);

  // ML-KEM-768 · forward-secret rotation
  const payload = { kid: fresh.publicKey.id, alg: "ML-KEM-768" };
  await rotate.broadcast(orgId, payload);
  return { ok: true, kid: fresh.publicKey.id };
}`;

const TERMINAL = [
  { k: "cmd" as const, t: "pnpm dev" },
  { k: "out" as const, t: "▲ Next.js 14.2  ready in 312ms" },
  { k: "out" as const, t: "  ➜  Local:   http://localhost:3000" },
  { k: "out" as const, t: "  ➜  Network: 192.168.1.12:3000" },
  { k: "cmd" as const, t: "curl -X POST /api/rotate/edu-tech" },
  { k: "ok" as const, t: "POST 200 /api/rotate/edu-tech   { kid: 8e2a… }" },
  { k: "out" as const, t: "↳ audit verified · 12ms" },
  { k: "cmd" as const, t: "git push origin main" },
  { k: "out" as const, t: "→ main · 3 commits · pushed 2s ago" },
];

const PROCESSES = [
  { pid: "01", name: "node", cpu: 18, mem: "412 MB", cmd: "crypto-key-rotation", color: "#6fdcef" },
  { pid: "02", name: "vite", cpu: 6, mem: "98 MB", cmd: "next dev · :3000", color: "#4f7dff" },
  { pid: "03", name: "esbuild", cpu: 2, mem: "44 MB", cmd: "watcher", color: "#9a7bff" },
  { pid: "04", name: "postgres", cpu: 4, mem: "210 MB", cmd: "edu_tech · 14 conn", color: "#5ff0c8" },
];

const TILES = [
  { label: "TypeScript", hint: "edge-friendly, types everywhere", group: "frontend" as const },
  { label: "Node.js", hint: "API + worker runtimes", group: "backend" as const },
  { label: "PostgreSQL", hint: "source of truth", group: "backend" as const },
  { label: "AWS", hint: "ECS, RDS, Lambda", group: "cloud" as const },
  { label: "Docker", hint: "containerized", group: "cloud" as const },
  { label: "Kubernetes", hint: "multi-region", group: "cloud" as const },
  { label: "ML-KEM-768", hint: "post-quantum key encapsulation", group: "security" as const },
  { label: "Terraform", hint: "infra as code", group: "cloud" as const },
];

const TILE_GROUP_COLOR: Record<string, string> = {
  frontend: "rgba(124,200,255,1)",
  backend: "rgba(111,220,239,1)",
  cloud: "rgba(138,156,255,1)",
  security: "rgba(169,139,255,1)",
};

export function Workspace() {
  const ref = useSection("workspace");
  const tier = useDeviceTier();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("code");
  const [hoverTile, setHoverTile] = useState<string | null>(null);

  const codeLines = useMemo(() => CODE.split("\n"), []);
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (tab !== "code") return;
    setTyped(0);
    const t = window.setInterval(() => setTyped((n) => (n < codeLines.length ? n + 1 : n)), 120);
    return () => window.clearInterval(t);
  }, [tab, codeLines.length]);

  return (
    <section id="workspace" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell grid items-start gap-12 lg:grid-cols-12">
        {/* Left column: copy */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <Reveal>
            <Eyebrow layer={0}>Workspace</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
              The desk I code at.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-[540px] text-[17px] leading-[1.65] text-[color:var(--muted)]">
              A laptop, a lattice sphere and a stack that takes ideas from interface to infrastructure.
              Toggle the tabs on the right to peek at the code, the dev terminal, and what's actually
              running.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-10 grid grid-cols-2 gap-3">
              {[
                { k: "Build", v: "Fast feedback loops in a terminal-first workflow." },
                { k: "Secure", v: "Quantum-safe defaults at the transport." },
                { k: "Repeat", v: "Reproducible infra, sane rollbacks." },
                { k: "Observe", v: "Logs, metrics, traces — no mystery deploys." },
              ].map(({ k, v }) => (
                <li
                  key={k}
                  className="rounded-xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.5)] p-4"
                >
                  <p className="mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--cyan)]">{k}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-[color:var(--muted)]">{v}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Right column: workspace UI */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[#060a16]/55 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-sm">
            {/* Title bar */}
            <div className="mono flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3 text-[13px] text-[color:var(--faint)]">
              <span className="flex items-center gap-2">
                <span className="inline-block size-1.5 rounded-full bg-[color:var(--cyan)] shadow-[0_0_8px_rgba(111,220,239,0.7)]" />
                workspace.live
              </span>
              <span className="hidden sm:inline">md-wahid · dev</span>
              <span className="hidden md:inline">⌘ + K</span>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-[color:var(--line)] bg-[rgba(6,10,22,0.6)] px-2 py-2">
              {(["code", "terminal", "processes"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  data-cursor="hover"
                  onClick={() => setTab(t)}
                  className={
                    "mono relative rounded-md px-3 py-1.5 text-[12px] uppercase tracking-[0.16em] transition-colors " +
                    (tab === t
                      ? "bg-[rgba(111,220,239,0.1)] text-[color:var(--ink)]"
                      : "text-[color:var(--muted)] hover:text-[color:var(--ink)]")
                  }
                >
                  {t}
                  {tab === t && (
                    <span className="absolute inset-x-2 -bottom-[6px] h-px bg-[color:var(--cyan)] shadow-[0_0_8px_rgba(111,220,239,0.7)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              {tab === "processes" ? (
                <ProcessesPanel />
              ) : tab === "terminal" ? (
                <TerminalPanel reduce={!!reduce} />
              ) : (
                <CodePanel typed={typed} total={codeLines.length} />
              )}
              {/* Floating 3D desk in the bottom-right when on code tab */}
              {tab === "code" && (
                <div className="pointer-events-none absolute -right-12 -bottom-16 hidden h-[60%] w-[55%] sm:block">
                  <Suspense fallback={null}>
                    <DeskScene tier={tier} />
                  </Suspense>
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#04060d] to-transparent" />
          </div>

          {/* Tech tiles row */}
          <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.55)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="mono text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Stack · hover to inspect</p>
              <p className="mono text-[12px] text-[color:var(--cyan)]">{hoverTile ?? "—"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TILES.map((tile, i) => (
                <motion.button
                  key={tile.label}
                  type="button"
                  data-cursor="hover"
                  onPointerEnter={() => setHoverTile(tile.label)}
                  onPointerLeave={() => setHoverTile((cur) => (cur === tile.label ? null : cur))}
                  onFocus={() => setHoverTile(tile.label)}
                  onBlur={() => setHoverTile(null)}
                  whileHover={reduce ? undefined : { y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] px-3 py-1.5 text-[13px] backdrop-blur-sm"
                  style={{
                    borderColor: hoverTile === tile.label ? TILE_GROUP_COLOR[tile.group] : undefined,
                    boxShadow: hoverTile === tile.label ? `0 0 16px ${TILE_GROUP_COLOR[tile.group]}55` : undefined,
                    color: hoverTile === tile.label ? "var(--ink)" : "var(--muted)",
                    animation: reduce ? undefined : `tilePulse 6s ease-in-out ${i * 0.4}s infinite`,
                  }}
                  title={tile.hint}
                >
                  {tile.label}
                </motion.button>
              ))}
            </div>
            <p className="mt-4 min-h-[1.25rem] text-[13px] text-[color:var(--muted)]">
              {hoverTile
                ? TILES.find((t) => t.label === hoverTile)?.hint
                : "8 tools · grouped by where they earn their keep"}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes tilePulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
      `}</style>
    </section>
  );
}

function CodePanel({ typed, total }: { typed: number; total: number }) {
  const lines = useMemo(() => CODE.split("\n").slice(0, typed), [typed]);
  const allLines = useMemo(() => CODE.split("\n"), []);
  return (
    <div className="mono flex h-full overflow-hidden">
      <div className="flex select-none flex-col items-end gap-1 border-r border-[color:var(--line)] bg-[rgba(4,6,13,0.6)] px-3 py-4 text-[11px] text-[color:var(--faint)]">
        {allLines.map((_, i) => (
          <span key={i} className={i < typed ? "text-[color:var(--cyan)]" : "opacity-40"}>
            {String(i + 1).padStart(2, "0")}
          </span>
        ))}
      </div>
      <pre className="flex-1 overflow-auto p-4 text-[12px] leading-[1.65] text-[color:var(--ink)]">
        {lines.join("\n")}
        {typed < total && (
          <span className="ml-0.5 inline-block h-[1em] w-[7px] -mb-[3px] animate-pulse bg-[color:var(--cyan)] align-middle" />
        )}
      </pre>
    </div>
  );
}

function TerminalPanel({ reduce }: { reduce: boolean }) {
  const [shown, setShown] = useState(reduce ? TERMINAL.length : 0);
  useEffect(() => {
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      setShown(n);
      if (n >= TERMINAL.length) window.clearInterval(id);
    }, 220);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="mono flex h-full flex-col gap-1.5 overflow-auto bg-[#04060d]/80 p-5 text-[13px] leading-[1.65]">
      {TERMINAL.slice(0, shown).map((l, i) => (
        <p
          key={i}
          className={
            l.k === "cmd"
              ? "text-[color:var(--ink)]"
              : l.k === "ok"
                ? "text-[color:var(--safe)]"
                : "text-[color:var(--muted)]"
          }
        >
          {l.k === "cmd" ? (
            <span className="text-[color:var(--cyan)]">$ </span>
          ) : l.k === "ok" ? (
            <span className="text-[color:var(--safe)]">✓ </span>
          ) : (
            <span className="text-[color:var(--faint)]">› </span>
          )}
          {l.t}
        </p>
      ))}
      {shown < TERMINAL.length && (
        <span className="inline-block h-[1.1em] w-2 animate-pulse bg-[color:var(--cyan)]" />
      )}
    </div>
  );
}

function ProcessesPanel() {
  return (
    <div className="flex h-full flex-col bg-[#04060d]/80 p-5">
      <div className="mono mb-3 flex items-center justify-between text-[12px] uppercase tracking-[0.16em] text-[color:var(--faint)]">
        <span>Process monitor · dev</span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--safe)]" />
          live
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-3 overflow-auto">
        {PROCESSES.map((p) => (
          <li key={p.pid} className="rounded-xl border border-[color:var(--line)] bg-[rgba(8,13,28,0.6)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="mono size-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                <span className="text-[14px] font-medium text-[color:var(--ink)]">{p.name}</span>
                <span className="mono text-[12px] text-[color:var(--faint)]">· {p.pid}</span>
              </div>
              <span className="mono shrink-0 text-[12px] text-[color:var(--muted)]">{p.mem}</span>
            </div>
            <p className="mono mt-1.5 truncate text-[12px] text-[color:var(--faint)]">{p.cmd}</p>
            <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[rgba(111,220,239,0.08)]">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${p.cpu * 4}%`,
                  background: `linear-gradient(90deg, ${p.color}, ${p.color}99)`,
                  boxShadow: `0 0 8px ${p.color}aa`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mono mt-3 text-[11px] text-[color:var(--faint)]">
        github.com/{profile.githubLabel} · last push 2 minutes ago
      </p>
    </div>
  );
}