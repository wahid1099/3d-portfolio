import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./styles.css";
import { useDeviceTier, useReducedMotionPref } from "./hooks/useDeviceTier";
import { measureSections } from "./lib/scroll";
import { Nav } from "./components/ui/Nav";
import { StoryRail } from "./components/ui/StoryRail";
import { AudioOrb } from "./components/ui/AudioOrb";
import { useKonami } from "./components/ui/Konami";
import { SecretRoom } from "./components/ui/SecretRoom";
import { SystemLog } from "./components/ui/SystemLog";
import { ResumeCard } from "./components/ui/ResumeCard";
import { HandshakeDemo } from "./components/sections/HandshakeDemo";
import { Cursor } from "./components/ui/Cursor";
import { ScrollProgress } from "./components/ui/ScrollProgress";
import { DailyQuote } from "./components/ui/DailyQuote";

// Section code-splitting: every section except MissionControl and FAQ is
// lazy + Suspense. This keeps the initial JS small while letting heavy
// modules (WebGL, QuranPlayer, CaseStudyModal) load on demand.
const Hero = lazy(() => import("./components/sections/Hero").then((m) => ({ default: m.Hero })));
const Workspace = lazy(() => import("./components/sections/Workspace").then((m) => ({ default: m.Workspace })));
const About = lazy(() => import("./components/sections/About").then((m) => ({ default: m.About })));
const Backend = lazy(() => import("./components/sections/Backend").then((m) => ({ default: m.Backend })));
const TechStack = lazy(() => import("./components/sections/TechStack").then((m) => ({ default: m.TechStack })));
const Experience = lazy(() => import("./components/sections/Experience").then((m) => ({ default: m.Experience })));
const Projects = lazy(() => import("./components/sections/Projects").then((m) => ({ default: m.Projects })));
const DevOps = lazy(() => import("./components/sections/DevOps").then((m) => ({ default: m.DevOps })));
const Security = lazy(() => import("./components/sections/Security").then((m) => ({ default: m.Security })));
const Philosophy = lazy(() => import("./components/sections/Philosophy").then((m) => ({ default: m.Philosophy })));
const LeetCode = lazy(() => import("./components/sections/LeetCode").then((m) => ({ default: m.LeetCode })));
const Contact = lazy(() => import("./components/sections/Contact").then((m) => ({ default: m.Contact })));
const Footer = lazy(() => import("./components/sections/Contact").then((m) => ({ default: m.Footer })));
const Now = lazy(() => import("./components/sections/Now").then((m) => ({ default: m.Now })));
const Testimonials = lazy(() => import("./components/sections/Testimonials").then((m) => ({ default: m.Testimonials })));
const Contributions = lazy(() => import("./components/sections/Contributions").then((m) => ({ default: m.Contributions })));

// The 3D scene is code-split so text paints first.
const Scene = lazy(() => import("./components/3d/Scene"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Portfolio() {
  const tier = useDeviceTier();
  const reduced = useReducedMotionPref();
  const [gl] = useState(hasWebGL);
  const [mountScene, setMountScene] = useState(false);
  const full3D = gl && tier !== "mobile";

  useEffect(() => {
    // Let first paint happen, then wake the scene.
    const id = window.setTimeout(() => setMountScene(true), 60);
    const m = window.setTimeout(measureSections, 300);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(m);
    };
  }, []);

  useEffect(() => {
    measureSections();
  }, [tier]);

  return (
    <>
      <div className="atmosphere" aria-hidden="true" />
      {gl && mountScene && (
        <Suspense fallback={null}>
          <Scene tier={tier} reduced={reduced} />
        </Suspense>
      )}
      <div className="vignette" aria-hidden="true" />
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
        Skip to content
      </a>
      <Nav />
      <DailyQuote />
      <ScrollProgress />
      <StoryRail />
      <main className="relative z-10">
        <Suspense fallback={<SectionSkeleton />}>
          <Hero />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Workspace />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <About />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Backend />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <TechStack has3D={full3D} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Experience />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Projects />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <DevOps has3D={full3D} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Security />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Philosophy />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <LeetCode />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Contributions />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Now />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Contact />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <HandshakeDemo />
        </Suspense>
      </main>
      <div className="relative z-10">
        <Suspense fallback={<SectionSkeleton />}>
          <Footer />
        </Suspense>
      </div>
      <AudioOrb />
      <ResumeCardLauncher />
      <SystemLog />
      <SecretRoomGate />
      <Cursor />
    </>
  );
}

function ResumeCardLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-cursor="hover"
        onClick={() => setOpen(true)}
        aria-label="Open résumé card"
        className="mono fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted)] backdrop-blur-md transition-colors hover:text-[color:var(--ink)]"
      >
        <span className="size-1.5 rounded-full bg-[color:var(--cyan)] shadow-[0_0_8px_rgba(111,220,239,0.7)]" />
        résumé
      </button>
      <AnimatePresence>
        {open && (
          <ResumeCardOverlay onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function ResumeCardOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Résumé card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 grid place-items-center"
    >
      <button
        type="button"
        aria-label="Close résumé overlay"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(2,5,12,0.7)] backdrop-blur-md"
      />
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <ResumeCard />
      </motion.div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] p-2 text-[color:var(--muted)] hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
    </motion.div>
  );
}

function SecretRoomGate() {
  const { open, setOpen } = useKonami();
  return <SecretRoom open={open} onClose={() => setOpen(false)} />;
}

function SectionSkeleton() {
  return (
    <div className="shell py-12" aria-hidden="true">
      <div className="h-6 w-32 animate-pulse rounded bg-[rgba(111,220,239,0.08)]" />
      <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-[rgba(111,220,239,0.05)]" />
    </div>
  );
}
