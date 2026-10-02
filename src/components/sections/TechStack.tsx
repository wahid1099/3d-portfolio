import { groups, tech, techById, adjacency } from "../../data/tech";
import { labelEls, layerEls, techHover, useStore } from "../../lib/store";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";

const groupColor = Object.fromEntries(groups.map((g) => [g.id, g.color]));
const groupLabel = Object.fromEntries(groups.map((g) => [g.id, g.label]));

function DetailPanel() {
  const hovered = useStore(techHover);
  const t = hovered ? techById[hovered] : null;
  return (
    <div className="glass min-h-[176px] rounded-2xl p-6" aria-live="polite">
      {t ? (
        <>
          <p className="mono flex items-center gap-2 text-[13px] uppercase tracking-[0.18em]" style={{ color: groupColor[t.group] }}>
            <span className="size-1.5 rounded-full" style={{ background: groupColor[t.group] }} />
            {groupLabel[t.group]}
          </p>
          <p className="mt-3 text-[24px] font-medium tracking-[-0.02em]">{t.label}</p>
          <p className="mt-2 text-[16px] leading-[1.55] text-[color:var(--muted)]">{t.desc}</p>
          <p className="mono mt-4 text-[13px] text-[color:var(--faint)]">
            ↔ {[...adjacency[t.id]].map((id) => techById[id].label).join(" · ")}
          </p>
        </>
      ) : (
        <>
          <p className="mono text-[13px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Trace a node</p>
          <p className="mt-3 text-[18px] leading-[1.5] text-[color:var(--muted)]">
            Hover or focus any technology to light up what it connects to. Nothing here works alone.
          </p>
          <p className="mono mt-5 text-[13px] text-[color:var(--faint)]">
            {tech.length} nodes · {groups.length} clusters
          </p>
        </>
      )}
    </div>
  );
}

function NodeButton({ id, projected }: { id: string; projected: boolean }) {
  const t = techById[id];
  return (
    <button
      type="button"
      ref={projected ? (el) => (el ? labelEls.set(id, el) : labelEls.delete(id)) : undefined}
      onPointerEnter={() => techHover.set(id)}
      onPointerLeave={() => techHover.set(null)}
      onFocus={() => techHover.set(id)}
      onBlur={() => techHover.set(null)}
      onClick={() => techHover.set(id)}
      data-state="idle"
      className={
        (projected ? "node-label opacity-0 " : "") +
        "mono whitespace-nowrap rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.72)] px-3 py-1.5 text-[13px] text-[#c7d3ee] backdrop-blur-sm transition-colors hover:text-white"
      }
    >
      {t.label}
    </button>
  );
}

export function TechStack({ has3D }: { has3D: boolean }) {
  const ref = useSection("stack");
  return (
    <section id="stack" ref={ref} className={has3D ? "relative h-[190vh]" : "relative py-28"}>
      <div className={has3D ? "sticky top-0 flex h-screen items-center" : ""}>
        <div className="shell">
          <div className={has3D ? "max-w-[400px]" : ""}>
            <Reveal>
              <Eyebrow layer={2}>Full-Stack</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
                One connected
                <br />
                system.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-8">
              <DetailPanel />
            </Reveal>
          </div>

          {!has3D && (
            <div className="mt-10 flex flex-col gap-7">
              {groups.map((g) => (
                <div key={g.id}>
                  <p className="mono mb-3 flex items-center gap-2 text-[13px] uppercase tracking-[0.18em] text-[color:var(--ink)]">
                    <span className="size-1.5 rounded-full" style={{ background: g.color }} />
                    {g.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tech
                      .filter((t) => t.group === g.id)
                      .map((t) => (
                        <NodeButton key={t.id} id={t.id} projected={false} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {has3D && (
        <div
          ref={(el) => (el ? layerEls.set("stack", el) : layerEls.delete("stack"))}
          className="pointer-events-none fixed inset-0 z-20"
          style={{ opacity: 0, visibility: "hidden" }}
          role="group"
          aria-label="Technology constellation"
        >
          {tech.map((t) => (
            <NodeButton key={t.id} id={t.id} projected />
          ))}
          <ClusterTitles />
        </div>
      )}
    </section>
  );
}

function ClusterTitles() {
  return (
    <>
      {groups.map((g) => (
        <span
          key={g.id}
          ref={(el) => (el ? labelEls.set(`group-${g.id}`, el) : labelEls.delete(`group-${g.id}`))}
          className="node-label mono text-[12px] uppercase tracking-[0.24em]"
          style={{ color: g.color, opacity: 0 }}
        >
          {g.label}
        </span>
      ))}
    </>
  );
}
