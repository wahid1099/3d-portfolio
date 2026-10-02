// scripts/build-assets.mjs
// Convert source SVG assets into the PNGs that OG/Apple crawlers need.
// Uses @resvg/resvg-js — pure JS, no native build step.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const jobs = [
  { src: "public/og-image.svg", out: "public/og-image.png", w: 1200, h: 630 },
  { src: "public/favicon.svg", out: "public/apple-touch-icon.png", w: 180, h: 180 },
  { src: "public/favicon.svg", out: "public/favicon-32.png", w: 32, h: 32 },
];

for (const { src, out, w, h } of jobs) {
  const svgPath = resolve(root, src);
  const pngPath = resolve(root, out);
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: w },
    background: "#04060d",
  });
  const png = resvg.render().asPng();
  mkdirSync(dirname(pngPath), { recursive: true });
  writeFileSync(pngPath, png);
  console.log(`✓ ${src} → ${out} (${w}×${h})`);
}