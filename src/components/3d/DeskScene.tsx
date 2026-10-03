import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Tier } from "../../hooks/useDeviceTier";

/**
 * Workspace 3D scene: stylized developer at a desk with laptop, plant and floating
 * stack icons (AWS, Kubernetes, Docker, Linux, Quantum-Safe). Lattice-sphere head
 * ties the visual into the global QuantumCore aesthetic.
 *
 * Hover any stack icon → it lifts and brightens.
 * Mobile tier → render a flat illustrated SVG fallback (see DeskSceneFallback).
 */
export default function DeskScene({ tier }: { tier: Tier }) {
  if (tier === "mobile") return <DeskSceneFallback />;
  const dpr: [number, number] = tier === "desktop" ? [1, 1.5] : [1, 1.25];
  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 38, position: [0, 0.4, 6.2], near: 0.1, far: 80 }}
      style={{ width: "100%", height: "100%" }}
    >
      <SceneLights />
      <Desk />
      <Laptop />
      <AvatarHead />
      <Plant />
      <Mug />
      <BooksStack />
      <StackIcons />
    </Canvas>
  );
}

/* ------------------------------------------------------------------ lights */

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.55} color="#a3c5ff" />
      <directionalLight position={[3, 4, 4]} intensity={1.1} color="#ffd4a3" />
      <directionalLight position={[-3, 2, 2]} intensity={0.5} color="#6fdcef" />
      <pointLight position={[0, 0.5, 3]} intensity={0.7} color="#9a7bff" distance={6} />
    </>
  );
}

/* ------------------------------------------------------------------ desk */

function Desk() {
  // top, apron, four legs
  return (
    <group position={[0, -1.1, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5.4, 0.12, 2.6]} />
        <meshStandardMaterial color="#1a1407" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.55, 1.1]}>
        <boxGeometry args={[5.2, 1, 0.08]} />
        <meshStandardMaterial color="#0f0a05" roughness={0.85} />
      </mesh>
      {/* legs */}
      {[
        [-2.5, -0.6, -1.1],
        [2.5, -0.6, -1.1],
        [-2.5, -0.6, 1.1],
        [2.5, -0.6, 1.1],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#0a0703" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ laptop */

function Laptop() {
  // base + screen showing "Build Secure Scalable Solutions"
  return (
    <group position={[0.7, -0.94, 0.2]} rotation={[0, -0.18, 0]}>
      {/* base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.9, 0.06, 1.3]} />
        <meshStandardMaterial color="#0e0e14" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* screen back */}
      <group position={[0, 0.55, -0.62]} rotation={[-1.05, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.85, 1.15, 0.06]} />
          <meshStandardMaterial color="#0a0a12" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* glowing screen face */}
        <mesh position={[0, 0, 0.034]}>
          <planeGeometry args={[1.7, 1.0]} />
          <meshBasicMaterial color="#08111f" />
        </mesh>
        <Text
          position={[0, 0.18, 0.04]}
          fontSize={0.085}
          color="#6fdcef"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.55}
        >
          Build Secure
        </Text>
        <Text
          position={[0, 0.05, 0.04]}
          fontSize={0.085}
          color="#6fdcef"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.55}
        >
          Scalable Solutions
        </Text>
        <mesh position={[0, -0.27, 0.04]}>
          <planeGeometry args={[1.0, 0.04]} />
          <meshBasicMaterial color="#4f7dff" />
        </mesh>
      </group>
      {/* terminal prompt bar */}
      <mesh position={[0, 0.031, 0.3]}>
        <planeGeometry args={[1.2, 0.025]} />
        <meshBasicMaterial color="#6fdcef" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ avatar head */

function AvatarHead() {
  // Photo portrait mounted on a circular plane front-and-center. Behind it a
  // rotating lattice sphere of cyan/violet nodes orbits — ties the photo into
  // the QuantumCore aesthetic without ever obscuring the face.
  const orbitRef = useRef<THREE.Group>(null);
  const photo = useTexture("/avatar.jpg");
  const headNodes = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = 80; // Fibonacci sphere count
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }
    return pts;
  }, []);

  useFrame((s, dt) => {
    if (!orbitRef.current) return;
    orbitRef.current.rotation.y += dt * 0.18;
  });

  return (
    <group position={[-1.0, 0.05, 0.4]}>
      {/* shoulders silhouette (static, behind everything) */}
      <mesh position={[0, -0.95, -0.15]}>
        <coneGeometry args={[1.1, 1.7, 16, 1, true]} />
        <meshStandardMaterial color="#0f1a36" roughness={0.7} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* orbiting lattice — rotates independently, sits BEHIND the photo (z < 0) */}
      <group ref={orbitRef} position={[0, 0, -0.05]}>
        {/* dark sphere halo (transparent so photo stays visible) */}
        <mesh>
          <icosahedronGeometry args={[0.62, 2]} />
          <meshStandardMaterial
            color="#0b1530"
            roughness={0.4}
            metalness={0.7}
            emissive="#0a2240"
            emissiveIntensity={0.3}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
        {/* lattice nodes */}
        {headNodes.map((p, i) => (
          <mesh key={i} position={[p.x * 0.68, p.y * 0.68, p.z * 0.68]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color={i % 7 === 0 ? "#9a7bff" : "#6fdcef"} />
          </mesh>
        ))}
        {/* glowing equatorial ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.66, 64]} />
          <meshBasicMaterial color="#6fdcef" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* photo portrait — static, always faces camera, sits IN FRONT of lattice */}
      <mesh position={[0, 0, 0.0]} renderOrder={10}>
        <circleGeometry args={[0.55, 64]} />
        <meshBasicMaterial map={photo} toneMapped={false} depthWrite={false} />
      </mesh>
      {/* photo dark ring (frame) */}
      <mesh position={[0, 0, 0.005]} renderOrder={11}>
        <ringGeometry args={[0.55, 0.585, 64]} />
        <meshBasicMaterial color="#04060d" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* photo outer cyan ring (glow) */}
      <mesh position={[0, 0, 0.006]} renderOrder={12}>
        <ringGeometry args={[0.585, 0.61, 64]} />
        <meshBasicMaterial color="#6fdcef" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ plant */

function Plant() {
  const leafs = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  return (
    <group position={[2.2, -1.0, 0.2]}>
      {/* pot */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.24, 0.4, 16]} />
        <meshStandardMaterial color="#3b2a16" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.34, 0.32, 0.06, 16]} />
        <meshStandardMaterial color="#1d140a" roughness={0.95} />
      </mesh>
      {/* leaves */}
      {leafs.map((i) => {
        const angle = (i / leafs.length) * Math.PI * 2;
        const tilt = 0.35 + (i % 2) * 0.2;
        return (
          <group key={i} position={[0, 0.25, 0]} rotation={[tilt, angle, 0]}>
            <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.06, 0.7, 6]} />
              <meshStandardMaterial color={i % 2 ? "#3a8a4f" : "#4ea765"} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ mug */

function Mug() {
  return (
    <group position={[0.7, -0.83, -0.4]}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.16, 0.36, 16]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.4} />
      </mesh>
      <mesh position={[0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.025, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.4} />
      </mesh>
      {/* coffee fill */}
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.005, 16]} />
        <meshBasicMaterial color="#2a1408" />
      </mesh>
      <Text
        position={[0, 0, 0.18]}
        fontSize={0.05}
        color="#1a1407"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.3}
      >
        ck.
      </Text>
    </group>
  );
}

/* ------------------------------------------------------------------ books */

function BooksStack() {
  const books = [
    { label: "AWS",       color: "#ff9900", emissive: "#3a1e00" },
    { label: "Kubernetes", color: "#326ce5", emissive: "#0c1733" },
    { label: "Docker",    color: "#2496ed", emissive: "#0a2236" },
    { label: "Linux",     color: "#f5c542", emissive: "#3a2a05" },
  ];
  return (
    <group position={[-2.0, -1.1, 0.4]}>
      {books.map((b, i) => (
        <group key={b.label} position={[0, i * 0.16, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.13, 0.65]} />
            <meshStandardMaterial color={b.color} roughness={0.6} emissive={b.emissive} emissiveIntensity={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0.33]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {b.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ stack icons */

type IconDef = {
  label: string;
  sub: string;
  color: string;
  glow: string;
  pos: [number, number, number];
};

const ICONS: IconDef[] = [
  { label: "</>",        sub: "Backend",      color: "#6fdcef", glow: "#1a3a4a", pos: [-2.4,  1.4,  0.6] },
  { label: "<>",         sub: "Frontend",     color: "#4f7dff", glow: "#0c1c4a", pos: [-1.0,  1.8,  0.4] },
  { label: "DevOps",     sub: "Cloud",        color: "#9a7bff", glow: "#2a1a4a", pos: [ 1.0,  1.7,  0.6] },
  { label: "Q-Safe",     sub: "Crypto",       color: "#5ff0c8", glow: "#0a3a2a", pos: [ 2.4,  1.3,  0.4] },
];

function StackIcons() {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <>
      {ICONS.map((icon, i) => (
        <FloatingIcon
          key={icon.label}
          icon={icon}
          hovered={hover === i}
          onEnter={() => setHover(i)}
          onLeave={() => setHover(null)}
        />
      ))}
    </>
  );
}

function FloatingIcon({
  icon,
  hovered,
  onEnter,
  onLeave,
}: {
  icon: IconDef;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onEnter();
  };
  useFrame((s, dt) => {
    if (!ref.current) return;
    const target = hovered ? 0.35 : 0;
    ref.current.position.y += (icon.pos[1] + target - ref.current.position.y) * Math.min(1, dt * 6);
    ref.current.rotation.y += dt * 0.25;
  });
  return (
    <group ref={ref} position={icon.pos}>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
        <group
          onPointerOver={handleMove}
          onPointerOut={onLeave}
          onPointerLeave={onLeave}
        >
          {/* tile */}
          <mesh>
            <boxGeometry args={[0.85, 0.85, 0.18]} />
            <meshStandardMaterial
              color={hovered ? icon.color : "#0e1530"}
              emissive={icon.glow}
              emissiveIntensity={hovered ? 1.2 : 0.5}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* glowing edge */}
          <mesh position={[0, 0, 0.095]}>
            <planeGeometry args={[0.78, 0.78]} />
            <meshBasicMaterial color={icon.color} transparent opacity={hovered ? 0.35 : 0.12} />
          </mesh>
          {/* label */}
          <Text
            position={[0, 0.18, 0.1]}
            fontSize={0.13}
            color={icon.color}
            anchorX="center"
            anchorY="middle"
          >
            {icon.label}
          </Text>
          <Text
            position={[0, -0.18, 0.1]}
            fontSize={0.06}
            color="#b8c4dd"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.05}
          >
            {icon.sub.toUpperCase()}
          </Text>
        </group>
      </Float>
    </group>
  );
}

/* ------------------------------------------------------------------ fallback (mobile) */

function DeskSceneFallback() {
  return (
    <div className="relative h-[440px] w-full overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[linear-gradient(180deg,#0a1226,#04060d)]">
      <svg viewBox="0 0 600 440" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="rim" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(111,220,239,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6fdcef" />
            <stop offset="100%" stopColor="#4f7dff" />
          </linearGradient>
        </defs>
        <rect width="600" height="440" fill="url(#rim)" />
        {/* avatar */}
        <g transform="translate(150 130)">
          <circle r="60" fill="#0b1530" stroke="#6fdcef" strokeWidth="1" />
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * 50} cy={Math.sin(a) * 50} r="2.5" fill="#6fdcef" />;
          })}
          <path d="M-80 160 Q 0 60 80 160 Z" fill="#0f1a36" />
        </g>
        {/* desk */}
        <rect x="60" y="290" width="480" height="14" rx="3" fill="#1a1407" />
        {/* laptop */}
        <g transform="translate(330 230)">
          <rect x="0" y="0" width="160" height="80" rx="4" fill="#0e0e14" />
          <rect x="6" y="6" width="148" height="68" rx="2" fill="url(#screen)" opacity="0.85" />
          <text x="80" y="46" textAnchor="middle" fill="#04060d" fontFamily="ui-monospace" fontSize="11" fontWeight="700">
            Build · Secure · Scale
          </text>
        </g>
        {/* stack icons */}
        {[
          { x: 60,  y: 60,  label: "</>",  color: "#6fdcef" },
          { x: 170, y: 40,  label: "<>",   color: "#4f7dff" },
          { x: 380, y: 60,  label: "DevOps", color: "#9a7bff" },
          { x: 480, y: 100, label: "Q-Safe", color: "#5ff0c8" },
        ].map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y})`}>
            <rect width="80" height="60" rx="10" fill="#0e1530" stroke={b.color} strokeWidth="1" />
            <text x="40" y="38" textAnchor="middle" fill={b.color} fontFamily="ui-monospace" fontSize="14" fontWeight="600">
              {b.label}
            </text>
          </g>
        ))}
        {/* books */}
        <g transform="translate(80 304)">
          {["#ff9900", "#326ce5", "#2496ed", "#f5c542"].map((c, i) => (
            <rect key={i} y={-i * 14} width="100" height="12" rx="2" fill={c} />
          ))}
        </g>
        {/* plant */}
        <g transform="translate(520 240)">
          <ellipse cx="0" cy="50" rx="22" ry="8" fill="#3b2a16" />
          <path d="M0 50 L 0 10" stroke="#4ea765" strokeWidth="2" />
          <circle cx="-12" cy="20" r="10" fill="#4ea765" />
          <circle cx="12" cy="14" r="10" fill="#3a8a4f" />
          <circle cx="0" cy="6" r="9" fill="#4ea765" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#04060d] to-transparent p-6">
        <p className="mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
          static fallback · your device skips WebGL
        </p>
      </div>
    </div>
  );
}