import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { profile } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal, SplitHeadline } from "../ui/Reveal";

type TermLine = { k: "cmd" | "out" | "err" | "html"; text: string; href?: string };

const intro: TermLine[] = [
  { k: "cmd", text: "./open-channel --to md.wahid" },
  { k: "out", text: "negotiating key exchange … ML-KEM-768 ✓" },
  { k: "out", text: "channel established · quantum-safe" },
];

const links = [
  { k: "github", label: profile.githubLabel, href: profile.github },
  { k: "linkedin", label: profile.linkedinLabel, href: profile.linkedin },
  { k: "email", label: profile.email, href: `mailto:${profile.email}` },
];

const HELP = [
  "Available: help · whoami · skills · ls · cat resume · cat links · clear · echo <msg> · neofetch · ask <question>",
];

export function Contact() {
  const ref = useSection("contact");
  const term = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inView = useInView(term, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [history, setHistory] = useState<TermLine[]>(intro);
  const [shown, setShown] = useState(reduce ? intro.length + links.length : 0);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number>(-1);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!inView || reduce) return;
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      setShown(n);
      if (n >= intro.length + links.length) window.clearInterval(id);
    }, 380);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  // After intro finishes, populate history once.
  useEffect(() => {
    if (shown >= intro.length + links.length && history.length === intro.length) {
      const linkLines: TermLine[] = links.map((l) => ({ k: "html", text: `${l.k}  ${l.label}`, href: l.href }));
      setHistory([...intro, ...linkLines]);
    }
  }, [shown, history.length]);

  const run = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    const newHist = [...history, { k: "cmd" as const, text: line }];
    const [cmd, ...args] = line.split(/\s+/);
    const arg = args.join(" ");
    const out: TermLine[] = [];
    switch (cmd) {
      case "help":
        out.push(...HELP.map((t) => ({ k: "out" as const, text: t })));
        break;
      case "whoami":
        out.push({ k: "out", text: "md.wahid — backend & cloud engineer, building quantum-safe systems." });
        break;
      case "skills":
        out.push({ k: "out", text: "Node.js · TypeScript · PostgreSQL · AWS · Docker · K8s · Post-Quantum Crypto" });
        break;
      case "ls":
        out.push({ k: "out", text: "resume.pdf  github/  linkedin/  email  projects/" });
        break;
      case "cat":
        if (arg === "resume") {
          out.push({ k: "html", text: "↗ Opening résumé …", href: profile.resume });
        } else if (arg === "links") {
          links.forEach((l) => out.push({ k: "html", text: `${l.k}  ${l.label}`, href: l.href }));
        } else {
          out.push({ k: "err", text: `cat: ${arg || "(no file)"}: No such file or directory` });
        }
        break;
      case "echo":
        out.push({ k: "out", text: arg });
        break;
      case "neofetch":
        out.push({ k: "out", text: "OS: secure-core · Uptime: since 2003 · Shell: zsh · Editor: VS Code" });
        break;
      case "ask":
        if (!arg) {
          out.push({ k: "err", text: "ask: provide a question, e.g. `ask what stack do you prefer?`" });
        } else {
          setPending(arg);
          out.push({ k: "out", text: "› thinking…" });
        }
        break;
      case "clear":
        setHistory([]);
        setInput("");
        return;
      default:
        out.push({ k: "err", text: `zsh: command not found: ${cmd}` });
    }
    setHistory([...newHist, ...out]);
    setCmdHistory((c) => [...c, line]);
    setHistIdx(-1);
    setInput("");
  };

  // Fire /api/ask when an `ask` command is queued
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question: pending }),
        });
        const data = await r.json();
        if (cancelled) return;
        const ans: string = data?.answer ?? "Sorry — I couldn't reach the assistant.";
        const src = data?.source === "live" ? "" : " (cached)";
        setHistory((h) => [
          ...h,
          { k: "out", text: `md.wahid: ${ans}${src}` },
        ]);
      } catch (e) {
        if (cancelled) return;
        setHistory((h) => [
          ...h,
          { k: "err", text: `ask: ${e instanceof Error ? e.message : "network error"}` },
        ]);
      } finally {
        if (!cancelled) setPending(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pending]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      requestAnimationFrame(() => term.current?.scrollTo({ top: term.current.scrollHeight, behavior: "smooth" }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const idx = histIdx < 0 ? cmdHistory.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(cmdHistory[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= cmdHistory.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(cmdHistory[next]);
      }
    }
  };

  return (
    <section id="contact" ref={ref} className="relative flex min-h-[100vh] items-center py-32">
      <div className="shell">
        <div className="max-w-[660px]">
          <Reveal>
            <Eyebrow layer={6}>Contact</Eyebrow>
          </Reveal>
          <SplitHeadline
            lines={["Let's Build", "Something Secure."]}
            accent={["Secure."]}
            className="mt-5 text-[clamp(40px,5.6vw,84px)] font-semibold leading-[0.98] tracking-[-0.045em]"
          />

          <div
            ref={term}
            onClick={() => inputRef.current?.focus()}
            className="glass glow-edge mono mt-12 cursor-text overflow-hidden rounded-2xl text-[14px] sm:text-[15px]"
          >
            <div className="flex items-center gap-2 border-b border-[color:var(--line)] px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#2a3556]" />
              <span className="size-2.5 rounded-full bg-[#2a3556]" />
              <span className="size-2.5 rounded-full bg-[#2a3556]" />
              <span className="ml-3 text-[13px] text-[color:var(--faint)]">wahid@secure-core: ~</span>
            </div>
            <div className="flex min-h-[260px] flex-col gap-1 p-5 sm:p-6">
              {history.slice(0, Math.max(shown - intro.length, 0) + intro.length).map((l, i) => (
                <Line key={i} l={l} shown={i < shown} />
              ))}
              {shown >= intro.length + links.length && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(input);
                  }}
                  className="mt-1 flex items-center gap-2"
                >
                  <span className="text-[color:var(--cyan)]">$</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder='try "help", "cat resume", "whoami"'
                    spellCheck={false}
                    autoCapitalize="off"
                    className="w-full bg-transparent text-[color:var(--ink)] outline-none placeholder:text-[color:var(--faint)]"
                  />
                </form>
              )}
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${profile.email}?subject=Let's%20build%20something%20secure`}
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-[color:var(--ink)] px-8 text-[16px] font-medium text-[#060a16] transition-all hover:bg-white hover:shadow-[0_0_50px_rgba(111,220,239,0.35)]"
              >
                Start a Conversation
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href={profile.resume}
                download={profile.resumeFileName}
                className="group inline-flex h-14 items-center gap-3 rounded-full border border-[color:var(--line)] bg-[rgba(10,16,34,0.5)] px-7 text-[15px] text-[color:var(--ink)] backdrop-blur-md transition-all hover:border-[rgba(154,123,255,0.5)]"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                Download Résumé
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Line({ l, shown }: { l: TermLine; shown: boolean }) {
  if (!shown) return null;
  if (l.k === "html") {
    return (
      <p>
        {l.href ? (
          <a
            href={l.href}
            target={l.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            className="text-[color:var(--cyan)] underline decoration-[rgba(111,220,239,0.3)] underline-offset-4 hover:decoration-[color:var(--cyan)]"
          >
            ↗ {l.text}
          </a>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: l.text }} />
        )}
      </p>
    );
  }
  return (
    <p className={l.k === "cmd" ? "text-[color:var(--ink)]" : l.k === "err" ? "text-[color:var(--threat)]" : "text-[color:var(--muted)]"}>
      {l.k === "cmd" ? <span className="text-[color:var(--cyan)]">$ </span> : <span className="text-[color:var(--faint)]">› </span>}
      {l.text}
    </p>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-[color:var(--line)]">
      <div className="shell flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[18px] font-semibold tracking-[-0.02em]">Md. Wahid</p>
          <p className="mt-1 text-[15px] text-[color:var(--muted)]">Software Engineer</p>
          <p className="mono mt-3 text-[13px] tracking-[0.06em] text-[color:var(--faint)]">Backend • Cloud • DevOps • Quantum-Safe Security</p>
        </div>
        <div className="mono flex flex-wrap gap-5 text-[13px] text-[color:var(--muted)]">
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)]">GitHub</a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)]">LinkedIn</a>
          <a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-[color:var(--ink)]">Previous portfolio</a>
          <span className="text-[color:var(--faint)]">Dhaka · {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
