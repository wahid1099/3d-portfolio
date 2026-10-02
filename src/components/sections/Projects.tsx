import { eduTech, isaraLayers, repos } from "../../data/projects";
import { profile } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";
import { GitHubMark } from "./Hero";

export function Projects() {
  const ref = useSection("projects");
  return (
    <section id="projects" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={3}>Backend · Selected work</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">Systems I've shipped.</h2>
        </Reveal>

        <div className="mt-14 flex flex-col gap-6">
          <IsaraCard />
          <EduSphereCard />
          <RepoGrid />
        </div>
      </div>
    </section>
  );
}

function ProjectMeta({ n, category, title }: { n: string; category: string; title: string }) {
  return (
    <>
      <p className="mono flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
        <span className="text-[color:var(--cyan)]">Project {n}</span>
        <span className="h-px w-6 bg-[color:var(--line)]" />
        {category}
      </p>
      <h3 className="mt-5 text-[clamp(36px,4.4vw,64px)] font-semibold leading-[0.98] tracking-[-0.045em]">{title}</h3>
    </>
  );
}

function IsaraCard() {
  const dur = 4.2;
  return (
    <Reveal>
      <article className="glass glow-edge grid overflow-hidden rounded-[28px] lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col justify-between gap-10 p-8 sm:p-12">
          <div>
            <ProjectMeta n="01" category="Quantum-Safe Security Platform" title="ISARA Advance" />
            <p className="mt-6 max-w-[460px] text-[17px] leading-[1.65] text-[color:var(--muted)]">
              Security-focused platform for understanding cryptographic risk and preparing infrastructure for the
              post-quantum era.
            </p>
          </div>
          <dl className="mono grid max-w-[460px] grid-cols-3 gap-5 text-[13px] uppercase tracking-[0.12em]">
            {[
              ["Domain", "Crypto risk"],
              ["Layer", "Full-stack"],
              ["Runtime", "AWS · K8s"],
            ].map(([k, v]) => (
              <div key={k} className="border-l border-[color:var(--line)] pl-3">
                <dt className="text-[color:var(--faint)]">{k}</dt>
                <dd className="mt-1 text-[color:var(--ink)]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative border-t border-[color:var(--line)] bg-[radial-gradient(80%_60%_at_50%_40%,rgba(79,125,255,0.14),transparent)] p-8 sm:p-12 lg:border-l lg:border-t-0">
          <p className="mono mb-6 text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Request path</p>
          <div className="relative mx-auto max-w-[400px]">
            <div className="absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-gradient-to-b from-[rgba(111,220,239,0.5)] to-[rgba(154,123,255,0.4)]" aria-hidden="true">
              {[0, 1, 2].map((k) => (
                <span key={k} className="packet" style={{ animationDelay: `${-k * (dur / 3)}s` }} />
              ))}
            </div>
            <ol className="relative flex flex-col gap-5">
              {isaraLayers.map((l, i) => (
                <li
                  key={l.label}
                  className="arch-layer relative flex items-center justify-between rounded-xl border bg-[rgba(6,10,22,0.88)] px-5 py-3.5"
                  style={{
                    animationDuration: `${dur / 3}s`,
                    animationDelay: `${(((i + 0.5) / isaraLayers.length) * dur) % (dur / 3)}s`,
                  }}
                >
                  <span className="text-[16px] font-medium">{l.label}</span>
                  <span className="mono text-[13px] text-[color:var(--faint)]">{l.note}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function EduSphereCard() {
  const tenants = ["School", "Madrasa", "Institute"];
  return (
    <Reveal>
      <article className="glass grid overflow-hidden rounded-[28px] lg:grid-cols-[1fr_1.05fr]">
        <div className="order-2 border-t border-[color:var(--line)] p-8 sm:p-12 lg:order-1 lg:border-r lg:border-t-0">
          <p className="mono mb-6 text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Multi-tenant shape</p>
          <div className="grid grid-cols-3 gap-3">
            {tenants.map((t) => (
              <div key={t} className="rounded-xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.7)] px-3 py-4 text-center">
                <p className="text-[15px]">{t}</p>
                <p className="mono mt-1 text-[12px] text-[color:var(--faint)]">tenant</p>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 300 40" className="my-2 h-10 w-full" preserveAspectRatio="none" aria-hidden="true">
            {[50, 150, 250].map((x) => (
              <path key={x} d={`M${x} 0 C ${x} 22, 150 18, 150 40`} fill="none" stroke="rgba(154,123,255,0.55)" className="flow-line" />
            ))}
          </svg>
          <div className="rounded-xl border border-[rgba(154,123,255,0.4)] bg-[rgba(20,16,48,0.55)] px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-medium">Tenant-aware API</p>
              <p className="mono text-[13px] text-[color:var(--faint)]">Node.js · Express</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              ["PostgreSQL", "Prisma"],
              ["Redis", "cache"],
              ["Docker", "deploy"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-[color:var(--line)] bg-[rgba(6,10,22,0.7)] px-3 py-3 text-center">
                <p className="text-[15px]">{a}</p>
                <p className="mono text-[12px] text-[color:var(--faint)]">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 flex flex-col justify-between gap-10 p-8 sm:p-12 lg:order-2">
          <div>
            <ProjectMeta n="02" category="Education Management SaaS" title="EduSphere" />
            <p className="mt-6 max-w-[460px] text-[17px] leading-[1.65] text-[color:var(--muted)]">
              Full-stack school and madrasa management platform designed for organizations in Bangladesh and the Middle
              East.
            </p>
          </div>
          <ul className="flex max-w-[480px] flex-wrap gap-2" aria-label="Technologies">
            {eduTech.map((t) => (
              <li key={t} className="tag">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </Reveal>
  );
}

function RepoGrid() {
  return (
    <Reveal>
      <article className="rounded-[28px] border border-[color:var(--line)] bg-[rgba(6,10,22,0.45)] p-8 backdrop-blur-sm sm:p-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
              <span className="text-[color:var(--cyan)]">Project 03</span>
              <span className="h-px w-6 bg-[color:var(--line)]" />
              Repositories & experiments
            </p>
            <h3 className="mt-4 text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.035em]">Engineering projects</h3>
          </div>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 text-[15px] text-[color:var(--cyan)] hover:text-white"
          >
            <GitHubMark className="size-4" /> View all projects on GitHub
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {repos.map((r) => (
            <li key={r.name}>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-[color:var(--line)] bg-[rgba(10,16,34,0.6)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(111,220,239,0.4)] hover:bg-[rgba(14,24,50,0.7)]"
              >
                <p className="mono flex items-center justify-between text-[12px] uppercase tracking-[0.16em] text-[color:var(--faint)]">
                  {r.kind}
                  <span className="text-[color:var(--muted)] opacity-0 transition-opacity group-hover:opacity-100">↗</span>
                </p>
                <p className="mt-4 text-[19px] font-medium tracking-[-0.01em]">{r.name}</p>
                <p className="mt-2 flex-1 text-[15px] leading-[1.55] text-[color:var(--muted)]">{r.desc}</p>
                <p className="mono mt-5 text-[13px] text-[#8fb4e8]">{r.tech.join(" · ")}</p>
              </a>
            </li>
          ))}
        </ul>
      </article>
    </Reveal>
  );
}
