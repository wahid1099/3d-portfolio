import { motion, useReducedMotion } from "framer-motion";
import { profile } from "../../data/profile";
import { useSection } from "../../hooks/useSection";
import { SplitHeadline } from "../ui/Reveal";
import { useMagnetic } from "../../hooks/magnetic";

// Public-folder assets: served at <baseUrl>/<filename>. import.meta.env.BASE_URL
// is "/" in dev and the configured base in production, which makes this work
// whether the site is hosted at root or under a subpath.
const avatarUrl = `${import.meta.env.BASE_URL}my-pic.png`.replace(/\/+/g, "/");

export function Hero() {
  const ref = useSection("hero");
  const reduce = useReducedMotion();
  const exploreRef = useMagnetic<HTMLAnchorElement>(0.3, 110);
  const githubRef = useMagnetic<HTMLAnchorElement>(0.25, 100);
  const resumeRef = useMagnetic<HTMLAnchorElement>(0.25, 100);
  const fade = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: d, ease: [0.16, 1, 0.3, 1] as const },
  });
  return (
    <section id="hero" ref={ref} className="relative flex min-h-[100svh] items-end pb-28 pt-28 md:items-center md:pb-0">
      {/* Holographic portrait — pure CSS parallax, sits behind the headline */}
      <HoloPortrait />
      <div className="shell">
        <div className="max-w-[760px]">
          <motion.div
            {...fade(0.1)}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-[color:var(--line)] bg-[rgba(8,14,30,0.6)] py-1.5 pl-3 pr-4 backdrop-blur-md"
          >
            <span className="status-dot" aria-hidden="true" />
            <span className="text-[14px] text-[color:var(--muted)]">
              Currently building secure technology at <span className="text-[color:var(--ink)]">ISARA</span>
            </span>
          </motion.div>
          <SplitHeadline
            as="h1"
            lines={["Engineering Secure", "Systems for the", "Post-Quantum Era."]}
            accent={["Post-Quantum"]}
            delay={0.2}
            className="text-[36px] sm:text-[clamp(42px,5.7vw,92px)] font-semibold leading-[0.98] tracking-[-0.045em]"
          />
          <motion.p
            {...fade(0.75)}
            className="mt-7 max-w-[560px] text-[17px] leading-[1.6] text-[color:var(--muted)] sm:text-[19px]"
          >
            Software Engineer building scalable backend systems, cloud infrastructure, and quantum-safe security
            solutions.
          </motion.p>
          <motion.div {...fade(0.9)} className="mt-10 flex flex-wrap items-center gap-3">
            <a
              ref={exploreRef}
              href="#projects"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--ink)] px-6 text-[15px] font-medium text-[#060a16] transition-transform duration-200 will-change-transform hover:bg-white hover:shadow-[0_0_40px_rgba(111,220,239,0.35)]"
            >
              Explore My Work
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a
              ref={githubRef}
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(10,16,34,0.5)] px-6 text-[15px] text-[color:var(--ink)] backdrop-blur-md transition-[transform,border-color] duration-200 will-change-transform hover:border-[rgba(111,220,239,0.45)]"
            >
              <GitHubMark />
              View GitHub
            </a>
            <a
              ref={resumeRef}
              href={profile.resume}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(10,16,34,0.5)] px-6 text-[15px] text-[color:var(--ink)] backdrop-blur-md transition-[transform,border-color] duration-200 will-change-transform hover:border-[rgba(154,123,255,0.45)]"
            >
              <DownloadMark />
              Resume
            </a>
          </motion.div>
          
        </div>
      </div>
      <a
        href="#about"
        className="mono absolute bottom-8 left-1/2 -translate-x-1/2 text-[12px] tracking-[0.3em] text-[color:var(--muted)] hover:text-[color:var(--ink)]"
      >
        <span className="scroll-cue inline-block whitespace-nowrap">SCROLL TO EXPLORE ↓</span>
      </a>
    </section>
  );
}

export function GitHubMark({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function DownloadMark({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Holographic portrait: a tinted avatar with subtle CSS rotation + cursor parallax. */
function HoloPortrait() {
  const ref = useMagnetic<HTMLDivElement>(0.18, 220);
  const reduce = useReducedMotion();
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute right-[-2vw] top-1/2 z-0 hidden h-[460px] w-[360px] -translate-y-1/2 will-change-transform md:block"
      style={{
        transform: reduce ? undefined : "perspective(1200px) rotateY(-12deg) rotateX(6deg)",
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[28px] border border-[rgba(111,220,239,0.25)] bg-[rgba(8,14,30,0.4)] shadow-[0_30px_120px_-20px_rgba(111,220,239,0.25)]"
        style={{
          backgroundImage: `url(${avatarUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center 18%",
        }}
      >
        {/* Cyan scanlines overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(180deg, rgba(111,220,239,0.08) 0px, rgba(111,220,239,0.08) 1px, transparent 1px, transparent 3px)",
            mixBlendMode: "screen",
          }}
        />
        {/* Side gradient mask to feel like a hologram */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,6,13,0.4) 0%, transparent 30%, transparent 70%, rgba(4,6,13,0.55) 100%), linear-gradient(90deg, rgba(111,220,239,0.18), transparent 30%)",
          }}
        />
        {/* Bottom mono label */}
        <div className="mono absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[rgba(191,246,255,0.7)]">
          <span>md.wahid</span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[var(--safe)] shadow-[0_0_6px_rgba(95,240,200,0.8)]" />
            online
          </span>
        </div>
      </div>
      {/* Holo edge glow */}
      <div className="absolute -inset-px rounded-[28px] bg-[linear-gradient(135deg,rgba(111,220,239,0.45),transparent_35%,transparent_65%,rgba(154,123,255,0.4))] opacity-50 blur-sm" />
    </div>
  );
}
