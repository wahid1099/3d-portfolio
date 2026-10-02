import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { glowTexture, palette } from "./glow";
import { streamFragment, streamVertex } from "../../shaders/particles";
import { clamp, getRange, lerp, presence, scrollState, smoothstep } from "../../lib/scroll";
import type { Tier } from "../../hooks/useDeviceTier";

/** Points evenly spread on a sphere: the lattice the core is woven from. */
function fibonacciSphere(n: number, r: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const t = golden * i;
    pts.push(new THREE.Vector3(Math.cos(t) * rad * r, y * r, Math.sin(t) * rad * r));
  }
  return pts;
}

function Stream({ radius, count, speed, color }: { radius: number; count: number; speed: number; color: THREE.Color }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geometry, uniforms } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const phase = new Float32Array(count);
    const jitter = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      phase[i] = i / count;
      jitter[i] = Math.random() * 2 - 1;
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aJitter", new THREE.BufferAttribute(jitter, 1));
    return {
      geometry: g,
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: radius },
        uSpeed: { value: speed },
        uPixelRatio: { value: Math.min(dpr, 2) },
        uColor: { value: color },
        uOpacity: { value: 1 },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, radius, speed]);
  useFrame((s) => {
    uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <points geometry={geometry} frustumCulled={false} userData={{ uniforms }}>
      <shaderMaterial
        vertexShader={streamVertex}
        fragmentShader={streamFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const RINGS = [
  { r: 2.05, tube: 0.006, tilt: [1.2, 0.2, 0], spin: 0.12, color: palette.cyan, opacity: 0.75 },
  { r: 2.45, tube: 0.004, tilt: [0.4, 1.1, 0.3], spin: -0.08, color: palette.blue, opacity: 0.6 },
  { r: 2.85, tube: 0.005, tilt: [1.9, -0.6, 0.8], spin: 0.05, color: palette.violet, opacity: 0.55 },
];

export function QuantumCore({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const root = useRef<THREE.Group>(null);
  const lattice = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const ringRefs = useRef<(THREE.Group | null)[]>([]);
  const ticks = useRef<THREE.Points>(null);
  const viewport = useThree((s) => s.viewport);
  const mobile = tier === "mobile";

  const nodeCount = tier === "desktop" ? 64 : tier === "tablet" ? 48 : 32;
  const { nodeGeo, edgeGeo } = useMemo(() => {
    const pts = fibonacciSphere(nodeCount, 1.45);
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const segs: number[] = [];
    const seen = new Set<string>();
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({ j, d: p.distanceToSquared(q) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      near.forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        segs.push(p.x, p.y, p.z, pts[j].x, pts[j].y, pts[j].z);
      });
    });
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    return { nodeGeo, edgeGeo };
  }, [nodeCount]);

  const tickGeo = useMemo(() => {
    const n = 160;
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 10 === 0 ? 3.42 : 3.3;
      arr.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(arr);
  }, []);

  const tex = glowTexture();
  const mats = useRef<THREE.Material[]>([]);
  const baseOpacity = useRef<number[]>([]);
  const collect = (m: THREE.Material | null, base: number) => {
    if (m && !mats.current.includes(m)) {
      mats.current.push(m);
      baseOpacity.current.push(base);
    }
  };

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const y = scrollState.smoothY;
    const about = getRange("about");
    const aboutMix = about ? smoothstep(0, 1, y / Math.max(1, about.top + about.height * 0.15)) : 0;
    const region = Math.max(presence("hero"), presence("about"), y < 40 ? 1 : 0);
    const contact = smoothstep(0.45, 1, presence("contact"));
    const contactMode = contact > region;
    const w = Math.max(region, contact);

    g.visible = w > 0.01;
    if (!g.visible) return;

    const vw = viewport.width;
    let x: number, yy: number, s: number;
    if (contactMode) {
      x = mobile ? 0 : vw * 0.27;
      yy = mobile ? 2.2 : 0;
      s = mobile ? 0.42 : 0.62;
    } else if (mobile) {
      x = 0;
      yy = lerp(1.9, 0.6, aboutMix);
      s = lerp(0.52, 0.42, aboutMix);
    } else {
      x = lerp(vw * 0.215, -vw * 0.25, aboutMix);
      yy = lerp(0.05, -0.1, aboutMix);
      s = lerp(tier === "desktop" ? 0.88 : 0.72, 0.8, aboutMix);
    }
    const k = 1 - Math.exp(-dt * 5);
    g.position.x += (x - g.position.x) * k;
    g.position.y += (yy - g.position.y) * k;
    const sc = s * (0.55 + 0.45 * w);
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * k);
    g.rotation.y = t * 0.06 + aboutMix * 0.9;
    g.rotation.x = Math.sin(t * 0.2) * 0.06;

    // The core "unfolds" as the profile is read: lattice opens, rings separate.
    const expand = contactMode ? 0.15 : aboutMix;
    if (lattice.current) {
      lattice.current.scale.setScalar(1 + expand * 0.32 + Math.sin(t * 0.8) * 0.012);
      lattice.current.rotation.y = -t * 0.1;
      lattice.current.rotation.z = t * 0.03;
    }
    if (inner.current) {
      inner.current.rotation.x = t * 0.35;
      inner.current.rotation.y = -t * 0.25;
      inner.current.scale.setScalar(1 - expand * 0.25);
    }
    ringRefs.current.forEach((r, i) => {
      if (!r) return;
      const cfg = RINGS[i];
      r.rotation.x = lerp(cfg.tilt[0], Math.PI / 2 + (i - 1) * 0.12, expand * 0.85);
      r.rotation.y = cfg.tilt[1] * (1 - expand * 0.6);
      r.rotation.z = cfg.tilt[2] + t * cfg.spin;
      r.scale.setScalar(1 + expand * 0.22 * (i + 1));
    });
    if (ticks.current) ticks.current.rotation.z = -t * 0.02;
    if (glow.current) {
      const pulse = 0.85 + Math.sin(t * 1.4) * 0.08;
      glow.current.scale.setScalar(3.4 * pulse);
    }
    const fade = clamp(w * (mobile && !contactMode ? 0.75 : 1));
    mats.current.forEach((m, i) => {
      const anyM = m as THREE.Material & { opacity: number; uniforms?: { uOpacity: { value: number } } };
      if (anyM.uniforms?.uOpacity) anyM.uniforms.uOpacity.value = baseOpacity.current[i] * fade;
      else anyM.opacity = baseOpacity.current[i] * fade;
    });
  });

  return (
    <group ref={root}>
      <sprite ref={glow}>
        <spriteMaterial
          ref={(m) => collect(m, 0.55)}
          map={tex}
          color="#3fa8ff"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* nucleus */}
      <mesh>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshBasicMaterial ref={(m) => collect(m, 0.95)} color="#e6fbff" transparent />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.72, 0]} />
        <meshBasicMaterial
          ref={(m) => collect(m, 0.65)}
          color="#9a7bff"
          wireframe
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <group ref={lattice}>
        <lineSegments geometry={edgeGeo}>
          <lineBasicMaterial
            ref={(m) => collect(m, 0.38)}
            color="#6fdcef"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
        <points geometry={nodeGeo}>
          <pointsMaterial
            ref={(m) => collect(m, 1)}
            map={tex}
            size={0.2}
            color="#bff3ff"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      </group>
      {RINGS.map((cfg, i) => (
        <group key={i} ref={(el) => (ringRefs.current[i] = el)}>
          <mesh>
            <torusGeometry args={[cfg.r, cfg.tube, 8, 200]} />
            <meshBasicMaterial
              ref={(m) => collect(m, cfg.opacity)}
              color={cfg.color}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {!reduced && (
            <StreamWithCollect
              radius={cfg.r}
              count={mobile ? 90 : 220}
              speed={0.25 + i * 0.08 * (i % 2 ? -1 : 1)}
              color={i === 2 ? palette.violet : palette.ice}
              collect={collect}
            />
          )}
        </group>
      ))}
      <points ref={ticks} geometry={tickGeo}>
        <pointsMaterial
          ref={(m) => collect(m, 0.5)}
          size={0.035}
          color="#6f8fd8"
          transparent
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function StreamWithCollect(props: {
  radius: number;
  count: number;
  speed: number;
  color: THREE.Color;
  collect: (m: THREE.Material | null, base: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const pts = ref.current?.children[0] as THREE.Points | undefined;
    if (pts && pts.material) props.collect(pts.material as THREE.Material, 1);
  });
  return (
    <group ref={ref}>
      <Stream radius={props.radius} count={props.count} speed={props.speed} color={props.color} />
    </group>
  );
}
