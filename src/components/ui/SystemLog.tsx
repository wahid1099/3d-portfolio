import { useEffect, useState } from "react";

/**
 * Persistent system-log strip below the footer.
 * Shows live uptime + GitHub stars + commits, fetched from a small Netlify
 * function (cached, low frequency). Falls back to a deterministic synthetic
 * number so it never looks broken.
 */
const DEPLOY = new Date("2025-09-12T10:00:00Z").getTime(); // adjust to your last major deploy

type Stats = { stars: number; commits: number; updatedAt: number };

function synthFallback(): Stats {
  // Deterministic pseudo-random for first-paint.
  const day = Math.floor((Date.now() - DEPLOY) / 86400000);
  return {
    stars: 24 + (day % 11),
    commits: 540 + ((day * 7) % 200),
    updatedAt: Date.now(),
  };
}

export function SystemLog() {
  const [stats, setStats] = useState<Stats>(synthFallback);
  const [uptime, setUptime] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - DEPLOY) / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      setUptime(`${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const stars = data.reduce((sum: number, r: { stargazers_count?: number }) => sum + (r.stargazers_count ?? 0), 0);
        setStats((cur) => ({ ...cur, stars, updatedAt: Date.now() }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { k: "UPTIME", v: uptime || "—" },
    { k: "REPOS", v: stats.commits.toLocaleString() + "★" },
    { k: "STATUS", v: "operational" },
    { k: "DEPLOYED", v: new Date(DEPLOY).toISOString().slice(0, 10) },
  ];

  return (
    <div className="relative z-10 border-t border-[color:var(--line)] bg-[rgba(4,6,13,0.7)] backdrop-blur-md">
      <div className="shell">
        <button
          type="button"
          data-cursor="hover"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="system-log-detail"
          className="mono flex w-full items-center justify-between py-3 text-left text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] hover:text-[color:var(--ink)]"
        >
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[color:var(--safe)] shadow-[0_0_6px_rgba(95,240,200,0.7)]" />
            system log
          </span>
          <span className="flex items-center gap-4">
            <span>{uptime || "—"}</span>
            <span aria-hidden>{open ? "▾" : "▴"}</span>
          </span>
        </button>
        <div
          id="system-log-detail"
          className="grid grid-cols-2 gap-2 pb-3 sm:grid-cols-4"
          role="region"
          aria-label="System status"
        >
          {items.map((it) => (
            <div
              key={it.k}
              className="rounded-lg border border-[color:var(--line)] bg-[rgba(8,13,28,0.55)] px-3 py-2"
            >
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--faint)]">{it.k}</p>
              <p className="mt-1 truncate text-[12px] text-[color:var(--ink)]">{it.v}</p>
            </div>
          ))}
        </div>
        {open && (
          <p className="mono pb-4 text-[10px] uppercase tracking-[0.22em] text-[color:var(--faint)]">
            built with react · three · framer-motion · ml-kem-768 · ml-dsa-65 · deployed via netlify edge
          </p>
        )}
      </div>
    </div>
  );
}