import * as THREE from "three";

let cached: THREE.Texture | null = null;

/** Soft radial sprite generated once on a canvas: no image assets to download. */
export function glowTexture() {
  if (cached) return cached;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.75)");
  g.addColorStop(0.45, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cached = new THREE.CanvasTexture(c);
  cached.colorSpace = THREE.SRGBColorSpace;
  return cached;
}

export const palette = {
  cyan: new THREE.Color("#6fdcef"),
  blue: new THREE.Color("#4f7dff"),
  violet: new THREE.Color("#9a7bff"),
  ice: new THREE.Color("#d9f6ff"),
  threat: new THREE.Color("#ff7a59"),
  amber: new THREE.Color("#ffb35c"),
};
