import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { glowTexture, palette } from "./glow";
import { layerEls } from "../../lib/store";
import { lerp, presence, smoothstep, stickyProgress } from "../../lib/scroll";
import type { Tier } from "../../hooks/useDeviceTier";

/** Voxel positions for a classical padlock. */
function lockShape(step: number) {
  const pts: THREE.Vector3[] = [];
  const cols = 9;
  const rows = 7;
  for (let x = 0; x < cols; x++)
    for (let y = 0; y < rows; y++)
      for (let z = 0; z < 2; z++) {
        const cx = x - (cols - 1) / 2;
        const cy = y - (rows - 1) / 2;
        // keyhole
        const keyhole = (Math.abs(cx) < 0.6 && cy > -2.2 && cy < 1.2) || (Math.hypot(cx, cy - 0.7) < 1.1 && cy > 0);
        if (keyhole) continue;
        pts.push(new THREE.Vector3(cx * step, cy * step - 0.55, (z - 0.5) * step));
      }
  // shackle: half torus plus legs
  const R = 0.62;
  const around = 3;
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    for (let k = 0; k < around; k++) {
      const off = (k - 1) * step * 0.9;
      pts.push(new THREE.Vector3(Math.cos(a) * (R + off * 0.3), 0.45 + Math.sin(a) * R + 0.35, off * 0.5));
    }
  }
  for (let leg = -1; leg <= 1; leg += 2)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < around; k++) {
        const off = (k - 1) * step * 0.9;
        pts.push(new THREE.Vector3(leg * (R + off * 0.3), 0.3 + j * step * 0.7, off * 0.5));
      }
  return pts;
}

/** Points filling a heater-shield silhouette on a hex lattice, sized to exactly n voxels. */
function shieldShape(n: number) {
  const inside = (x: number, y: number) => {
    if (y > 1.4 || y < -1.8) return false;
    const half = y > 0.25 ? 1.3 : 1.3 * Math.pow(Math.cos(((0.25 - y) / 2.05) * (Math.PI / 2)), 0.75);
    return Math.abs(x) <= half;
  };
  const step = 0.235;
  const pts: THREE.Vector3[] = [];
  {
    const h = step * 0.87;
    for (let r = 0; r * h < 3.3; r++) {
      const y = 1.4 - r * h;
      for (let c = -14; c <= 14; c++) {
        const x = c * step + (r % 2 ? step / 2 : 0);
        if (inside(x, y)) pts.push(new THREE.Vector3(x, y, -0.22 * x * x));
      }
    }
  }
  void n;
  return pts;
}

export function LockShield({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const root = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const swarm = useRef<THREE.Points>(null);
  const halo = useRef<THREE.Mesh>(null);
  const viewport = useThree((s) => s.viewport);
  const tex = glowTexture();
  const step = 0.23;

  const { lock, shield, scatter, count } = useMemo(() => {
    const lockBase = lockShape(step);
    const shieldBase = shieldShape(0);
    const count = Math.max(lockBase.length, shieldBase.length);
    // pad the shorter form by stacking duplicates in place (invisible overlap)
    const lock = Array.from({ length: count }, (_, i) => lockBase[i % lockBase.length]);
    const shield = Array.from({ length: count }, (_, i) => shieldBase[i % shieldBase.length]);
    const scatter = lock.map((p) => {
      const dir = p.clone().normalize();
      if (dir.lengthSq() < 0.01) dir.set(Math.random() - 0.5, Math.random() - 0.5, 1).normalize();
      return p
        .clone()
        .add(dir.multiplyScalar(1.0 + Math.random() * 1.3))
        .add(new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2));
    });
    return { lock, shield, scatter, count };
  }, []);

  const swarmCount = tier === "mobile" ? 160 : 420;
  const swarmData = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(swarmCount * 3);
    const seeds = Array.from({ length: swarmCount }, () => ({
      a: Math.random() * Math.PI * 2,
      b: Math.random() * Math.PI,
      r: 2.2 + Math.random() * 2.2,
      s: 0.3 + Math.random() * 0.8,
    }));
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return { g, seeds };
  }, [swarmCount]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => new THREE.Color(), []);
  const lockColor = useMemo(() => new THREE.Color("#a9c4ff"), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = root.current;
    const m = mesh.current;
    if (!g || !m) return;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const w = presence("security");
    const layer = layerEls.get("security");
    if (layer) layer.style.opacity = String(w);
    g.visible = w > 0.01;
    if (!g.visible) return;

    const p = stickyProgress("security");
    const mobile = viewport.width < 7;
    g.position.set(mobile ? 0 : viewport.width * 0.2, mobile ? viewport.height * 0.3 : 0, 0);
    g.scale.setScalar((mobile ? 0.48 : 1.05) * (0.7 + 0.3 * w));
    g.rotation.y = Math.sin(t * 0.25) * 0.25 + lerp(0, Math.PI * 2, smoothstep(0.42, 0.82, p));

    const threat = smoothstep(0.12, 0.27, p); // quantum particles converge
    const crack = smoothstep(0.32, 0.5, p); // lock breaks apart
    const form = smoothstep(0.55, 0.8, p); // shield assembles
    const safe = smoothstep(0.8, 0.95, p);

    for (let i = 0; i < count; i++) {
      const L = lock[i];
      const S = scatter[i];
      const H = shield[i];
      const jitter = threat * (1 - form) * 0.04;
      pos.copy(L).lerp(S, crack);
      pos.lerp(H, form);
      pos.x += Math.sin(t * 9 + i) * jitter;
      pos.y += Math.cos(t * 7 + i * 1.7) * jitter;
      dummy.position.copy(pos);
      dummy.rotation.set(crack * (1 - form) * i, crack * (1 - form) * i * 0.5, 0);
      const sc = 1 - crack * (1 - form) * 0.35 + safe * 0.05 * Math.sin(t * 2 + pos.y * 3);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      // colour: cool steel → threat amber → quantum-safe cyan
      c.copy(lockColor).lerp(palette.threat, threat * (1 - form));
      c.lerp(palette.cyan, form);
      if (safe > 0) c.lerp(palette.ice, safe * 0.25 * (0.5 + 0.5 * Math.sin(t * 2 - pos.y * 4)));
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    (m.material as THREE.MeshStandardMaterial).opacity = w;

    // quantum swarm
    const sp = swarmData.g.getAttribute("position") as THREE.BufferAttribute;
    const pull = threat * (1 - crack * 0.6);
    swarmData.seeds.forEach((s, i) => {
      const a = s.a + t * s.s;
      const r = lerp(s.r + 1.5, 1.4 + s.r * 0.25, pull);
      sp.setXYZ(i, Math.cos(a) * Math.sin(s.b) * r, Math.cos(s.b) * r * 0.8, Math.sin(a) * Math.sin(s.b) * r);
    });
    sp.needsUpdate = true;
    if (swarm.current) {
      const sm = swarm.current.material as THREE.PointsMaterial;
      sm.opacity = w * threat * (1 - form * 0.9);
    }
    if (halo.current) {
      const hm = halo.current.material as THREE.MeshBasicMaterial;
      hm.opacity = w * safe * 0.35;
      halo.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
      halo.current.rotation.z = t * 0.1;
    }
  });

  return (
    <group ref={root}>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 5]} intensity={40} color="#8fd8ff" />
      <pointLight position={[-4, -2, 3]} intensity={25} color="#9a7bff" />
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[step * 0.82, step * 0.82, step * 0.82]} />
        <meshStandardMaterial
          roughness={0.35}
          metalness={0.55}
          emissive="#0b1a3a"
          transparent
        />
      </instancedMesh>
      <points ref={swarm} geometry={swarmData.g} frustumCulled={false}>
        <pointsMaterial
          map={tex}
          size={0.13}
          color="#a98bff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh ref={halo} position={[0, -0.15, -0.6]}>
        <ringGeometry args={[2.25, 2.29, 6, 1]} />
        <meshBasicMaterial color="#6fdcef" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
