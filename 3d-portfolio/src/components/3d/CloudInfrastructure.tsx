import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pipeline, pipelinePositions } from "../../data/pipeline";
import { glowTexture } from "./glow";
import { labelEls, layerEls } from "../../lib/store";
import { clamp, presence, stickyProgress } from "../../lib/scroll";

function shapeGeometry(shape: string): THREE.BufferGeometry {
  switch (shape) {
    case "octa":
      return new THREE.OctahedronGeometry(0.62, 0);
    case "ring":
      return new THREE.TorusGeometry(0.5, 0.14, 8, 28);
    case "cube":
      return new THREE.BoxGeometry(0.9, 0.9, 0.9);
    case "stack":
      return new THREE.BoxGeometry(1.1, 0.34, 0.8);
    case "cyl":
      return new THREE.CylinderGeometry(0.5, 0.5, 0.95, 18, 3);
    case "hept":
      return new THREE.CylinderGeometry(0.72, 0.72, 0.24, 7, 1);
    case "dodeca":
      return new THREE.DodecahedronGeometry(0.66, 0);
    default:
      return new THREE.IcosahedronGeometry(0.62, 1);
  }
}

/** Developer → production, laid out in depth. Scrolling flies the camera through each layer. */
export function CloudInfrastructure({ reduced }: { reduced: boolean }) {
  const root = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Group | null)[]>([]);
  const packets = useRef<THREE.Points>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const tex = glowTexture();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const focus = useRef(0);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(pipelinePositions.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.4),
    [],
  );
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 240, 0.012, 6, false), [curve]);
  const geos = useMemo(
    () =>
      pipeline.map((p) => {
        const g = shapeGeometry(p.shape);
        return { g, e: new THREE.EdgesGeometry(g, 1) };
      }),
    [],
  );
  const PACKETS = 44;
  const packetGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PACKETS * 3), 3));
    return g;
  }, []);
  const offsets = useMemo(() => Array.from({ length: PACKETS }, (_, i) => i / PACKETS + Math.random() * 0.01), []);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const w = presence("devops");
    const layer = layerEls.get("devops");
    if (layer) {
      layer.style.opacity = String(w);
      layer.style.visibility = w < 0.02 ? "hidden" : "visible";
    }
    g.visible = w > 0.01;
    if (!g.visible) return;

    const p = stickyProgress("devops");
    const target = clamp(p * 1.08 - 0.02) * (pipeline.length - 1);
    focus.current += (target - focus.current) * (1 - Math.exp(-dt * 4));
    const f = focus.current;
    const i0 = Math.floor(f);
    const i1 = Math.min(pipeline.length - 1, i0 + 1);
    const frac = f - i0;
    const a = pipelinePositions[i0];
    const b = pipelinePositions[i1];
    const fx = a[0] + (b[0] - a[0]) * frac;
    const fy = a[1] + (b[1] - a[1]) * frac;
    const fz = a[2] + (b[2] - a[2]) * frac;

    const mobile = viewport.width < 7;
    const anchorX = mobile ? 0 : viewport.width * 0.17;
    const anchorY = mobile ? 0.9 : -0.1;
    g.position.set(anchorX - fx, anchorY - fy, 0.6 - fz - (1 - w) * 6);

    const halfW = size.width / 2;
    const halfH = size.height / 2;
    nodeRefs.current.forEach((n, i) => {
      if (!n) return;
      const active = Math.max(0, 1 - Math.abs(f - i));
      if (!reduced) {
        n.rotation.y = t * (0.25 + i * 0.03);
        n.rotation.x = Math.sin(t * 0.3 + i) * 0.25;
      }
      n.scale.setScalar(0.8 + active * 0.35);
      n.getWorldPosition(tmp);
      const zFade = clamp((6.5 - tmp.z) / 2.5) * clamp((tmp.z + 26) / 14);
      n.visible = zFade > 0.02;
      const mats = n.userData.mats as { fill: THREE.MeshBasicMaterial; edge: THREE.LineBasicMaterial; glow: THREE.SpriteMaterial };
      if (mats) {
        mats.fill.opacity = (0.05 + active * 0.12) * zFade * w;
        mats.edge.opacity = (0.35 + active * 0.65) * zFade * w;
        mats.glow.opacity = (0.15 + active * 0.7) * zFade * w;
      }
      const el = labelEls.get(`pipe-${i}`);
      if (el) {
        tmp.project(camera);
        const sx = tmp.x * halfW + halfW;
        const sy = -tmp.y * halfH + halfH;
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${(sy + 58 + active * 18).toFixed(1)}px, 0) translate(-50%, 0)`;
        const near = Math.abs(f - i) < 1.15 ? 1 : 0;
        el.style.opacity = String(zFade * w * near * (0.3 + active * 0.7) * (tmp.z < 1 ? 1 : 0));
        el.dataset.active = active > 0.5 ? "true" : "false";
      }
    });

    const pos = packetGeo.getAttribute("position") as THREE.BufferAttribute;
    offsets.forEach((o, i) => {
      const u = (o + (reduced ? 0 : t * 0.045)) % 1;
      curve.getPointAt(u, tmp);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    });
    pos.needsUpdate = true;
    (packets.current!.material as THREE.PointsMaterial).opacity = w;
  });

  return (
    <group ref={root}>
      <mesh geometry={tube}>
        <meshBasicMaterial color="#3d6bff" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <points ref={packets} geometry={packetGeo} frustumCulled={false}>
        <pointsMaterial
          map={tex}
          size={0.32}
          color="#9ff3ff"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {pipeline.map((p, i) => (
        <PipelineNode
          key={p.id}
          position={pipelinePositions[i]}
          geo={geos[i].g}
          edges={geos[i].e}
          tex={tex}
          last={i === pipeline.length - 1}
          refCb={(el) => (nodeRefs.current[i] = el)}
        />
      ))}
    </group>
  );
}

function PipelineNode({
  position,
  geo,
  edges,
  tex,
  last,
  refCb,
}: {
  position: [number, number, number];
  geo: THREE.BufferGeometry;
  edges: THREE.BufferGeometry;
  tex: THREE.Texture;
  last: boolean;
  refCb: (el: THREE.Group | null) => void;
}) {
  const mats = useMemo(
    () => ({
      fill: new THREE.MeshBasicMaterial({ color: last ? "#5ff0c8" : "#4f7dff", transparent: true, opacity: 0.1, depthWrite: false }),
      edge: new THREE.LineBasicMaterial({ color: last ? "#8ff8dc" : "#8fe6ff", transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }),
      glow: new THREE.SpriteMaterial({ map: tex, color: last ? "#5ff0c8" : "#5aa9ff", transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }),
    }),
    [tex, last],
  );
  return (
    <group
      position={position}
      ref={(el) => {
        if (el) el.userData.mats = mats;
        refCb(el);
      }}
    >
      <mesh geometry={geo} material={mats.fill} />
      <lineSegments geometry={edges} material={mats.edge} />
      <sprite material={mats.glow} scale={2.6} />
    </group>
  );
}
