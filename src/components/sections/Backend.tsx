import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";

type EndpointId = "python" | "php" | "go" | "mysql" | "mongodb" | "aiml";

type Endpoint = {
  id: EndpointId;
  label: string;
  tagline: string;
  color: string;
  ring: string;
  glyph: string;
  defaultPayload: () => Record<string, unknown>;
  formatResult: (r: any) => string;
};

const endpoints: Endpoint[] = [
  {
    id: "python",
    label: "Python",
    tagline: "AST-grade expression sandbox — strings, lists, arithmetic, function calls.",
    color: "#facc15",
    ring: "rgba(250,202,53,0.35)",
    glyph: "Py",
    defaultPayload: () => ({ code: "(7 + 5) * 3 ** 2 % 17" }),
    formatResult: (r) => {
      if (!r?.ok) return String(r?.error ?? "error");
      const v = r.result;
      return typeof v === "number" || typeof v === "string" ? `→ ${JSON.stringify(v)}` : JSON.stringify(v);
    },
  },
  {
    id: "php",
    label: "PHP",
    tagline: "Echo, $vars, foreach, string interpolation — the LAMP building blocks.",
    color: "#7c86ff",
    ring: "rgba(124,134,255,0.35)",
    glyph: "Php",
    defaultPayload: () => ({
      code: "$users = ['Wahid', 'Tasnim', 'Sadia'];\nforeach ($users as $u) {\n  echo \"Hello $u!\\n\";\n}",
    }),
    formatResult: (r) => String(r?.output ?? r?.error ?? ""),
  },
  {
    id: "go",
    label: "Go",
    tagline: "fmt.Println, := assignment, range loops, append/len — small Go subset.",
    color: "#5ff0c8",
    ring: "rgba(95,240,200,0.35)",
    glyph: "Go",
    defaultPayload: () => ({
      code: "package main\nitems := []int{2, 4, 6, 8, 10}\ntotal := 0\nfor _, x := range items {\n  total = total + x\n}\nfmt.Println(\"total =\", total)",
    }),
    formatResult: (r) => String(r?.output ?? r?.error ?? ""),
  },
  {
    id: "mysql",
    label: "MySQL",
    tagline: "CREATE / SELECT / INSERT / UPDATE / DELETE with WHERE, ORDER BY, LIMIT.",
    color: "#4f7dff",
    ring: "rgba(79,125,255,0.35)",
    glyph: "SQL",
    defaultPayload: () => ({
      initial: [
        { name: "Wahid", role: "engineer" },
        { name: "Tasnim", role: "engineer" },
        { name: "Sadia", role: "designer" },
      ],
      sql: "CREATE TABLE users (id INT PRIMARY KEY, name TEXT, role TEXT);\nINSERT INTO users (id, name, role) VALUES (1, 'Wahid', 'engineer'), (2, 'Tasnim', 'engineer'), (3, 'Sadia', 'designer');\nSELECT * FROM users WHERE role = 'engineer' ORDER BY name;",
    }),
    formatResult: (r) => {
      const last = (r?.log ?? []).find((l: any) => l?.rows);
      if (!last) return JSON.stringify(r?.log?.[r.log.length - 1] ?? r, null, 2);
      return `rows: ${last.count}\n` + last.rows.map((x: any) => JSON.stringify(x)).join("\n");
    },
  },
  {
    id: "mongodb",
    label: "MongoDB",
    tagline: "Document store with $match, $set, $inc, $sort, $group, $count.",
    color: "#9a7bff",
    ring: "rgba(154,123,255,0.35)",
    glyph: "M",
    defaultPayload: () => ({
      collection: "scores",
      action: "aggregate",
      pipeline: [
        { $match: { points: { $gte: 50 } } },
        { $sort: { points: -1 } },
        { $group: { _id: "$team", total: { $sum: "$points" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ],
    }),
    formatResult: (r) => JSON.stringify(r?.docs ?? r, null, 2),
  },
  {
    id: "aiml",
    label: "AI / ML",
    tagline: "Sentiment, classify, summarize, embed — deterministic on-device inference.",
    color: "#ff7a59",
    ring: "rgba(255,122,89,0.35)",
    glyph: "AI",
    defaultPayload: () => ({
      task: "sentiment",
      text: "The release was fast, the dashboard is clean and the deploy was painless.",
    }),
    formatResult: (r) => JSON.stringify(r?.result ?? r, null, 2),
  },
];

const DEMO_DOCS = {
  scores: [
    { team: "alpha", points: 92 },
    { team: "alpha", points: 47 },
    { team: "alpha", points: 88 },
    { team: "beta",  points: 73 },
    { team: "beta",  points: 65 },
    { team: "beta",  points: 51 },
    { team: "gamma", points: 38 },
    { team: "gamma", points: 82 },
  ],
};

export function Backend() {
  const ref = useSection("backend");
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Record<EndpointId, "idle" | "loading" | "ok" | "error">>(
    { python: "idle", php: "idle", go: "idle", mysql: "idle", mongodb: "idle", aiml: "idle" },
  );
  const [results, setResults] = useState<Record<EndpointId, string | null>>({
    python: null, php: null, go: null, mysql: null, mongodb: null, aiml: null,
  });
  const [latencies, setLatencies] = useState<Record<EndpointId, number | null>>({
    python: null, php: null, go: null, mysql: null, mongodb: null, aiml: null,
  });

  // Seed MongoDB scores collection on first mount so aggregate demos work.
  useEffect(() => {
    fetch("/api/mongodb", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ collection: "scores", action: "insert", doc: DEMO_DOCS.scores }),
    }).catch(() => {});
  }, []);

  async function run(id: EndpointId, payload: Record<string, unknown>) {
    setStatus((p) => ({ ...p, [id]: "loading" }));
    setResults((p) => ({ ...p, [id]: null }));
    setLatencies((p) => ({ ...p, [id]: null }));
    const t0 = performance.now();
    try {
      const body = id === "mongodb" && payload.collection === "scores" && payload.action === "aggregate"
        ? { ...payload, doc: undefined }
        : payload;
      const r = await fetch(`/api/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { ok: false, error: text.slice(0, 200) }; }
      const ms = Math.round(performance.now() - t0);
      const ep = endpoints.find((e) => e.id === id)!;
      setResults((p) => ({ ...p, [id]: ep.formatResult(data) }));
      setLatencies((p) => ({ ...p, [id]: ms }));
      setStatus((p) => ({ ...p, [id]: data.ok ? "ok" : "error" }));
    } catch (e) {
      setResults((p) => ({ ...p, [id]: String((e as Error).message ?? e) }));
      setStatus((p) => ({ ...p, [id]: "error" }));
    }
  }

  return (
    <section id="backend" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={2}>Backend · Live APIs</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Six endpoints. One edge.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.65] text-[color:var(--muted)]">
            Every card below is a real Netlify Function. Click <strong className="text-[color:var(--ink)]">Run</strong> to
            hit the live endpoint — no fake UI, no mock data outside the function itself.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {endpoints.map((ep, i) => (
            <motion.div
              key={ep.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.6, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <EndpointCard
                ep={ep}
                state={status[ep.id]}
                latency={latencies[ep.id]}
                result={results[ep.id]}
                onRun={(payload) => run(ep.id, payload)}
              />
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mono mt-10 text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
            netlify/functions/ · cold-start ≈ 50–150 ms · runs in V8 isolates
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function EndpointCard({
  ep,
  state,
  latency,
  result,
  onRun,
}: {
  ep: Endpoint;
  state: "idle" | "loading" | "ok" | "error";
  latency: number | null;
  result: string | null;
  onRun: (payload: Record<string, unknown>) => void;
}) {
  const dotColor =
    state === "ok" ? "#5ff0c8" :
    state === "error" ? "#ff7a59" :
    state === "loading" ? "#facc15" :
    "#9aa5c2";

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.55)] p-6 backdrop-blur-sm transition-shadow hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
      style={{ borderColor: state === "ok" ? ep.ring : undefined }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 place-items-center rounded-xl border font-mono text-[12px] font-bold tracking-tight"
            style={{
              background: `linear-gradient(135deg, ${ep.ring}, rgba(6,10,22,0.7))`,
              borderColor: ep.ring,
              color: ep.color,
            }}
          >
            {ep.glyph}
          </span>
          <div>
            <h3 className="text-[18px] font-medium tracking-[-0.01em]">{ep.label}</h3>
            <p className="mono mt-0.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
              POST /api/{ep.id}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="inline-block size-2 rounded-full"
            style={{
              background: dotColor,
              boxShadow: state === "ok" || state === "loading" ? `0 0 10px ${dotColor}` : undefined,
            }}
          />
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
            {state}
            {latency != null ? ` · ${latency}ms` : ""}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[14px] leading-[1.55] text-[color:var(--muted)]">{ep.tagline}</p>

      <pre className="mt-4 max-h-44 overflow-auto rounded-lg border border-[color:var(--line)] bg-[#04060d]/60 p-3 font-mono text-[11px] leading-[1.5] text-[#b8c4dd]">
        <code>{JSON.stringify(ep.defaultPayload(), null, 2)}</code>
      </pre>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onRun(ep.defaultPayload())}
          disabled={state === "loading"}
          className="group inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-all disabled:opacity-60"
          style={{
            background: state === "loading" ? "rgba(255,255,255,0.05)" : ep.color,
            color: state === "loading" ? ep.color : "#060a16",
          }}
        >
          {state === "loading" ? "Running…" : "▶ Run"}
        </button>
        {result != null && (
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
            {state === "ok" ? "200 OK" : "ERR"}
          </span>
        )}
      </div>

      {result != null && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-[color:var(--line)] bg-[#04060d]/80 p-3 font-mono text-[11px] leading-[1.5] text-[#b8c4dd]">
          <code>{result}</code>
        </pre>
      )}
    </article>
  );
}