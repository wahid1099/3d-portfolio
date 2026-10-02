import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { adjacency, edges, groupTitles, groups, nodePositions, tech } from "../../data/tech";
import { glowTexture } from "./glow";
import { labelEls, layerEls, pointer, techHover } from "../../lib/store";
import { presence, smoothstep } from "../../lib/scroll";

const groupColor = Object.fromEntries(groups.map((g) => [g.id, new THREE.Color(g.color)]));
const dim = new THREE.Color("#22325e");
const hot = new THREE.Color("#bff6ff");
const techGroup = Object.fromEntries(tech.map((t) => [t.id, t.group])) as Record<string, string>;

/** Technology constellation. DOM labels are projected onto the nodes every frame. */
export function NetworkGraph({ reduced }: { reduced: boolean }) {
  const root = useRef<THREE.Group>(null);
  const nodeRefs = useRef<Record<string, THREE.Group | null>>({});
  const burst = useRef<THREE.Points>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const tex = glowTexture();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const weightRef = useRef(0);

  const edgeGeo = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    edges.forEach(([a, b]) => {
      pos.push(...nodePositions[a], ...nodePositions[b]);
      col.push(0, 0, 0, 0, 0, 0);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);

  const burstGeo = useMemo(() => {
    const n = 70;
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(Math.random() * 2 - 1);
      const r = 0.25 + Math.random() * 0.45;
      p.set([Math.sin(b) * Math.cos(a) * r, Math.sin(b) * Math.sin(a) * r, Math.cos(b) * r], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);

  const tc = useMemo(() => new THREE.Color(), []);
  const cur = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const w = smoothstep(0.3, 1, presence("stack"));
    weightRef.current = w;
    const layer = layerEls.get("stack");
    if (layer) {
      layer.style.opacity = String(w);
      layer.style.visibility = w < 0.02 ? "hidden" : "visible";
    }
    g.visible = w > 0.01;
    if (!g.visible) return;

    const hovered = techHover.get();
    const linked = hovered ? adjacency[hovered] : null;

    const fit = Math.min(1, viewport.width / 14.5);
    g.scale.setScalar((0.82 + 0.18 * w) * fit);
    g.position.set(viewport.width * 0.13, -0.25, (1 - w) * -3);
    if (!reduced) {
      g.rotation.y = Math.sin(t * 0.12) * 0.07 + pointer.x * 0.06;
      g.rotation.x = Math.cos(t * 0.1) * 0.03 - pointer.y * 0.04;
    }

    // Edge colours: highlight anything touching the hovered node.
    const col = edgeGeo.getAttribute("color") as THREE.BufferAttribute;
    edges.forEach(([a, b], i) => {
      const on = hovered && (a === hovered || b === hovered);
      const target = on ? hot : hovered ? dim : groupColor[techGroup[a]];
      const strength = on ? 1 : hovered ? 0.35 : 0.42;
      tc.copy(target).multiplyScalar(strength * w);
      cur.setRGB(col.getX(i * 2), col.getY(i * 2), col.getZ(i * 2));
      cur.lerp(tc, 1 - Math.exp(-dt * 10));
      col.setXYZ(i * 2, cur.r, cur.g, cur.b);
      col.setXYZ(i * 2 + 1, cur.r, cur.g, cur.b);
    });
    col.needsUpdate = true;

    const halfW = size.width / 2;
    const halfH = size.height / 2;
    tech.forEach((n) => {
      const node = nodeRefs.current[n.id];
      if (!node) return;
      const isHot = hovered === n.id;
      const isLinked = linked?.has(n.id);
      const targetScale = isHot ? 1.7 : isLinked ? 1.25 : hovered ? 0.8 : 1;
      const s = node.scale.x + (targetScale - node.scale.x) * (1 - Math.exp(-dt * 10));
      node.scale.setScalar(s);
      const nm = node.userData.mats as THREE.Material[] | undefined;
      if (nm) {
        (nm[0] as THREE.MeshBasicMaterial).opacity = w;
        (nm[1] as THREE.SpriteMaterial).opacity = 0.85 * w * (hovered && !isHot && !isLinked ? 0.4 : 1);
      }
      node.position.y = nodePositions[n.id][1] + (reduced ? 0 : Math.sin(t * 0.7 + n.id.length) * 0.05);

      node.getWorldPosition(tmp);
      tmp.project(camera);
      const el = labelEls.get(n.id);
      if (el) {
        const sx = tmp.x * halfW + halfW;
        const sy = -tmp.y * halfH + halfH;
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
        el.style.opacity = String((hovered && !isHot && !isLinked ? 0.38 : 1) * w);
        el.style.pointerEvents = w > 0.6 ? "auto" : "none";
        el.dataset.state = isHot ? "hot" : isLinked ? "linked" : hovered ? "dim" : "idle";
      }
    });

    groups.forEach((gr) => {
      const el = labelEls.get(`group-${gr.id}`);
      if (!el) return;
      tmp.set(...groupTitles[gr.id]);
      g.localToWorld(tmp);
      tmp.project(camera);
      const sx = tmp.x * halfW + halfW;
      const sy = -tmp.y * halfH + halfH;
      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = String(w * (hovered ? 0.45 : 0.85));
    });

    if (burst.current) {
      const hn = hovered ? nodeRefs.current[hovered] : null;
      const m = burst.current.material as THREE.PointsMaterial;
      if (hn) {
        burst.current.position.copy(hn.position);
        burst.current.rotation.y += dt * 0.8;
        burst.current.rotation.x += dt * 0.35;
        m.opacity += (0.9 - m.opacity) * 0.1;
      } else m.opacity *= 0.9;
    }
  });

  return (
    <group ref={root}>
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {tech.map((n) => (
        <group
          key={n.id}
          ref={(el) => {
            nodeRefs.current[n.id] = el;
            if (el) el.userData.mats = [(el.children[0] as THREE.Mesh).material, (el.children[1] as THREE.Sprite).material];
          }}
          position={nodePositions[n.id]}
        >
          <mesh>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#e8fbff" transparent opacity={0} />
          </mesh>
          <sprite scale={0.62}>
            <spriteMaterial
              map={tex}
              color={groups.find((x) => x.id === n.group)!.color}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        </group>
      ))}
      <points ref={burst} geometry={burstGeo}>
        <pointsMaterial
          map={tex}
          size={0.07}
          color="#9fefff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
