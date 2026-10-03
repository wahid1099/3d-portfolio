import { Suspense, lazy, useEffect, useState } from "react";
import "./styles.css";
import { useDeviceTier, useReducedMotionPref } from "./hooks/useDeviceTier";
import { measureSections } from "./lib/scroll";
import { Nav } from "./components/ui/Nav";
import { StoryRail } from "./components/ui/StoryRail";
import { AudioOrb } from "./components/ui/AudioOrb";
import { useKonami } from "./components/ui/Konami";
import { SecretRoom } from "./components/ui/SecretRoom";
import { Hero } from "./components/sections/Hero";
import { Workspace } from "./components/sections/Workspace";
import { About } from "./components/sections/About";
import { Backend } from "./components/sections/Backend";
import { TechStack } from "./components/sections/TechStack";
import { Experience } from "./components/sections/Experience";
import { Projects } from "./components/sections/Projects";
import { DevOps } from "./components/sections/DevOps";
import { Security } from "./components/sections/Security";
import { Philosophy } from "./components/sections/Philosophy";
import { LeetCode } from "./components/sections/LeetCode";
import { Contact, Footer } from "./components/sections/Contact";
import { Now } from "./components/sections/Now";
import { Testimonials } from "./components/sections/Testimonials";
import { Contributions } from "./components/sections/Contributions";
import { Cursor } from "./components/ui/Cursor";

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
      <StoryRail />
      <main className="relative z-10">
        <Hero />
        <Workspace />
        <About />
        <Backend />
        <TechStack has3D={full3D} />
        <Experience />
        <Projects />
        <DevOps has3D={full3D} />
        <Security />
        <Philosophy />
        <LeetCode />
        <Contributions />
        <Now />
        <Testimonials />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <AudioOrb />
      <SecretRoomGate />
      <Cursor />
    </>
  );
}

function SecretRoomGate() {
  const { open, setOpen } = useKonami();
  return <SecretRoom open={open} onClose={() => setOpen(false)} />;
}
