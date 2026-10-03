import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, useReducedMotion } from "framer-motion";
import { useSection } from "../../hooks/useSection";
import { Eyebrow, Reveal } from "../ui/Reveal";

/**
 * Interactive ML-KEM handshake:
 *   - Drag from the central lattice outward to "shoot" a probe.
 *   - On release the probe orbits back as a handshake stream (cyan dots).
 *   - When the handshake completes the central sphere swaps to a green "SAFE" state.
 *   - All visual; no real crypto. Designed as a recruiter-magnet, not a security claim.
 */

type Phase = "idle" | "probe" | "handshake" | "safe";
type Probe = { id: number; start: THREE.Vector3; end: THREE.Vector3; t: number; alive: boolean };

function LatticeSphere({ safe }: { safe: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const r = 1.4;
  // Fibonacci sphere of nodes
  const nodes = useMemo(() => {
    const out: THREE.Vector3[] = [];
    const n = 80;
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      out.push(new THREE.Vector3(Math.cos(phi * i) * rr, y, Math.sin(phi * i) * rr).multiplyScalar(r));
    }
    return out;
  }, []);
  const edges = useMemo(() => {
    const out: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 0.85) out.push([nodes[i], nodes[j]]);
      }
    }
    return out;
  }, [nodes]);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y += dt * 0.18;
    g.rotation.x = Math.sin(t * 0.3) * 0.1;
    if (core.current) {
      const m = core.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(new THREE.Color(safe ? "#5ff0c8" : "#6fdcef"), 0.06);
      const s = 1 + Math.sin(t * 1.5) * 0.04;
      core.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref}>
      <mesh ref={core}>
        <icosahedronGeometry args={[r * 0.6, 1]} />
        <meshBasicMaterial color="#6fdcef" transparent opacity={0.18} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[r * 0.9, 2]} />
        <meshBasicMaterial color="#6fdcef" transparent opacity={0.08} />
      </mesh>
      {nodes.map((n, i) => (
        <mesh key={i} position={n.toArray()}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={safe ? "#5ff0c8" : "#6fdcef"} />
        </mesh>
      ))}
      {edges.map(([a, b], i) => {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const dir = b.clone().sub(a);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={i} position={mid.toArray()} quaternion={q}>
            <cylinderGeometry args={[0.012, 0.012, len, 4]} />
            <meshBasicMaterial color={safe ? "#5ff0c8" : "#6fdcef"} transparent opacity={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function ProbeBeam({ probe }: { probe: Probe }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m || !probe.alive) return;
    m.position.copy(probe.start).lerp(probe.end, Math.min(probe.t, 1));
    m.lookAt(probe.end);
  });
  if (!probe.alive) return null;
  const dir = probe.end.clone().sub(probe.start);
  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.04, 0.04, dir.length(), 8]} />
      <meshBasicMaterial color="#ff7a59" transparent opacity={0.6} />
    </mesh>
  );
}

function HandshakeStream({ active, color }: { active: boolean; color: string }) {
  const ref = useRef<THREE.Points>(null);
  const N = 96;
  const positions = useMemo(() => new Float32Array(N * 3), []);
  const phases = useMemo(() => {
    const arr = new Float32Array(N);
    for (let i = 0; i < N; i++) arr[i] = i / N;
    return arr;
  }, []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    const speed = active ? 0.4 : 0.05;
    const radius = 1.7;
    for (let i = 0; i < N; i++) {
      const ph = phases[i];
      const a = (ph + t * speed) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * radius;
      positions[i * 3 + 1] = Math.sin(a) * radius;
      positions[i * 3 + 2] = Math.sin(a * 3 + t * 2) * 0.3;
    }
    (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geom} frustumCulled={false}>
      <pointsMaterial
        color={color}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={active ? 0.95 : 0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Scene({ phase }: { phase: Phase }) {
  const safe = phase === "safe";
  const color = safe ? "#5ff0c8" : "#6fdcef";
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} color="#6fdcef" intensity={0.5} />
      <LatticeSphere safe={safe} />
      <HandshakeStream active={phase !== "idle"} color={color} />
    </>
  );
}

export function HandshakeDemo() {
  const ref = useSection("handshake");
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [probe, setProbe] = useState<Probe | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<number | null>(null);
  const probeRef = useRef<Probe | null>(null);
  probeRef.current = probe;

  // Drive the probe animation
  useEffect(() => {
    if (!probe || !probe.alive) return;
    const start = performance.now();
    const dur = 600;
    const step = () => {
      const dt = performance.now() - start;
      const t = dt / dur;
      setProbe({ ...probe, t });
      if (t < 1) tickRef.current = requestAnimationFrame(step);
      else {
        setPhase("handshake");
        setProbe({ ...probe, t: 1, alive: false });
        window.setTimeout(() => setPhase("safe"), 900);
      }
    };
    tickRef.current = requestAnimationFrame(step);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probe?.id]);

  // Allow keyboard interaction
  const fireFrom = (sx: number, sy: number) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r || phase !== "idle") return;
    const cx = r.width / 2;
    const cy = r.height / 2;
    const dx = sx - (r.left + cx);
    const dy = sy - (r.top + cy);
    if (Math.hypot(dx, dy) < 80) return; // must drag outward
    const len = Math.min(6, Math.hypot(dx, dy) / 80);
    const end = new THREE.Vector3(dx / 80, -dy / 80, 0).multiplyScalar(len);
    setProbe({
      id: Date.now(),
      start: new THREE.Vector3(0, 0, 0),
      end,
      t: 0,
      alive: true,
    });
    setPhase("probe");
  };

  const onDragEnd = (e: React.PointerEvent) => {
    fireFrom(e.clientX, e.clientY);
  };

  const reset = () => {
    setPhase("idle");
    setProbe(null);
  };

  return (
    <section id="handshake" ref={ref} className="relative py-24 sm:py-32">
      <div className="shell">
        <Reveal>
          <Eyebrow layer={6}>Try it</Eyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-5 max-w-[820px] text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Probe the perimeter.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-[640px] text-[16px] leading-[1.65] text-[color:var(--muted)]">
            Drag outward from the lattice to send a handshake request. The probe is met with an ML-KEM-768
            encapsulation, the lattice rotates to a new state, and the system flips to{" "}
            <span className="text-[color:var(--safe)]">quantum-safe</span>.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div
            ref={wrapRef}
            onPointerUp={onDragEnd}
            data-cursor="drag"
            className="glass relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl sm:aspect-[2/1]"
            role="button"
            tabIndex={0}
            aria-label="Drag outward to probe the perimeter"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fireFrom(window.innerWidth / 2 + 200, window.innerHeight / 2);
              } else if (e.key === "r" || e.key === "R") {
                reset();
              }
            }}
          >
            <Canvas
              camera={{ position: [0, 0, 5], fov: 45 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <Scene phase={phase} />
                {probe && probe.alive && <ProbeBeam probe={probe} />}
              </Suspense>
            </Canvas>
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={reduce ? undefined : { scale: phase === "idle" ? [1, 1.06, 1] : 1 }}
              transition={{ duration: 2, repeat: phase === "idle" ? Infinity : 0 }}
            >
              <div className="size-2 rounded-full bg-[color:var(--cyan)] shadow-[0_0_18px_rgba(111,220,239,0.85)]" />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <PhaseBadge phase={phase} />
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
              <span className="mono">
                {phase === "idle" ? "awaiting probe" : phase === "probe" ? "probe in flight" : phase === "handshake" ? "ML-KEM-768 encapsulation" : "safe · migrated"}
              </span>
              <button
                type="button"
                data-cursor="hover"
                onClick={reset}
                className="mono rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.6)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink)] hover:border-[rgba(111,220,239,0.5)]"
              >
                reset
              </button>
            </div>
          </div>
        </Reveal>
        <p className="mono mt-3 text-[11px] text-[color:var(--faint)]">
          Keyboard: <kbd className="rounded border border-[color:var(--line)] px-1.5">Space</kbd> to probe, <kbd className="rounded border border-[color:var(--line)] px-1.5">R</kbd> to reset.
        </p>
      </div>
    </section>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  const map: Record<Phase, { text: string; color: string }> = {
    idle: { text: "IDLE", color: "rgba(154,165,200,0.85)" },
    probe: { text: "PROBE", color: "rgba(255,122,89,0.95)" },
    handshake: { text: "ML-KEM-768", color: "rgba(111,220,239,0.95)" },
    safe: { text: "QUANTUM-SAFE", color: "rgba(95,240,200,1)" },
  };
  const { text, color } = map[phase];
  return (
    <div
      className="mono absolute right-4 top-4 rounded-full bg-[rgba(8,13,28,0.7)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] backdrop-blur-md"
      style={{ color, boxShadow: `0 0 18px ${color}33`, border: `1px solid ${color}55` }}
      aria-live="polite"
    >
      {text}
    </div>
  );
}