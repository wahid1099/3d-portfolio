import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../lib/scroll";
import { pointer } from "../../lib/store";

/** Owns the smoothed scroll value and gives the camera a slow, weighted drift. */
export function CameraRig({ reduced }: { reduced: boolean }) {
  const target = new THREE.Vector3();
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const prev = scrollState.smoothY;
    scrollState.smoothY = reduced
      ? scrollState.y
      : THREE.MathUtils.damp(scrollState.smoothY, scrollState.y, 5.5, d);
    scrollState.velocity = (scrollState.smoothY - prev) / Math.max(d, 0.001);

    const cam = state.camera;
    const px = reduced ? 0 : pointer.x * 0.45;
    const py = reduced ? 0 : pointer.y * 0.28;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, px, 2.2, d);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, py, 2.2, d);
    cam.position.z = 10;
    target.set(0, 0, 0);
    cam.lookAt(target);
    const roll = THREE.MathUtils.clamp(scrollState.velocity / 30000, -0.025, 0.025);
    cam.rotation.z = THREE.MathUtils.damp(cam.rotation.z, reduced ? 0 : roll, 3, d);
  });
  return null;
}
