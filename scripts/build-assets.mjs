// scripts/build-assets.mjs
// Convert source SVG assets into the PNGs that OG/Apple crawlers need.
// Also generates photo-based favicons (favicon-32.png, apple-touch-icon.png,
// favicon.svg) from public/avatar.jpg via gen-favicon.mjs.
// Uses @resvg/resvg-js — pure JS, no native build step.
//
// Skip rules:
//   - og-image.png: only regenerated from SVG if photo derivatives don't exist
//                   (the photo-based OG image is richer, so it wins).
//   - favicon-32.png / apple-touch-icon.png: never overwritten here; the
//                   resize-photo.ps1 local script (Windows-only) produces
//                   the photo-based versions that get committed instead.

import { Resvg } from "@resvg/resvg-js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const hasPhoto = existsSync(resolve(root, "public/avatar.png"));

const jobs = [
  {
    src: "public/og-image.svg",
    out: "public/og-image.png",
    w: 1200,
    h: 630,
    skipIf: () => hasPhoto,
  },
];

for (const { src, out, w, h, skipIf } of jobs) {
  if (skipIf && skipIf()) {
    console.log(`  ↪ skipped (photo OG image present) ${out}`);
    continue;
  }
  const svgPath = resolve(root, src);
  const pngPath = resolve(root, out);
  if (!existsSync(svgPath)) {
    console.log(`  ↪ missing source ${src}`);
    continue;
  }
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

if (hasPhoto) {
  console.log("photo derivatives present — using photo-based OG and icons");
}

// Always regenerate the photo-based favicons.
import("./gen-favicon.mjs").catch((e) =>
  console.warn("favicon generation skipped:", e.message),
);