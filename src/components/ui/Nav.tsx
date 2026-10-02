import { profile } from "../../data/profile";

const links = [
  { href: "#workspace", label: "Workspace" },
  { href: "#stack", label: "Stack" },
  { href: "#projects", label: "Work" },
  { href: "#devops", label: "Infra" },
  { href: "#security", label: "Security" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-[rgba(4,6,13,0.92)] via-[rgba(4,6,13,0.55)] to-transparent">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a href="#hero" className="mono flex items-center gap-3 text-[14px] tracking-[0.08em] text-[color:var(--ink)]">
          <span className="grid size-7 place-items-center rounded-md border border-[color:var(--line)] bg-[rgba(14,22,46,0.6)] text-[12px] text-[color:var(--cyan)]">
            MW
          </span>
          <span className="hidden sm:inline">md.wahid</span>
        </a>
        <nav aria-label="Primary" className="flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-[rgba(6,10,22,0.55)] px-1.5 py-1 backdrop-blur-md">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hidden rounded-full px-3.5 py-1.5 text-[14px] text-[color:var(--muted)] transition-colors hover:bg-white/5 hover:text-[color:var(--ink)] md:block"
            >
              {l.label}
            </a>
          ))}
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-3.5 py-1.5 text-[14px] text-[color:var(--ink)] transition-colors hover:bg-white/5 md:border-l md:border-[color:var(--line)] md:rounded-l-none"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
