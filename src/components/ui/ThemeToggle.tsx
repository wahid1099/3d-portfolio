import { useEffect, useState } from "react";

type Theme = "dark" | "safelight";
const KEY = "theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "safelight" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "quantum-safelight" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "quantum-safelight" : "dark"} theme`}
      className="mono inline-flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.6)] px-3 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)] transition-colors hover:border-[rgba(111,220,239,0.5)] hover:text-[color:var(--ink)]"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{
          background: theme === "dark" ? "var(--cyan)" : "var(--violet)",
          boxShadow: theme === "dark" ? "0 0 6px var(--cyan)" : "0 0 6px var(--violet)",
        }}
      />
      {theme === "dark" ? "dark" : "safe·light"}
    </button>
  );
}