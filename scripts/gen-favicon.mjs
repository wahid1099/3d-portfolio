// scripts/gen-favicon.mjs
// Generate circular photo-based favicons from public/avatar.jpg
// Uses @resvg/resvg-js (already installed as devDependency).

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const avatarBuf = readFileSync(resolve(root, "public/avatar.jpg"));
const b64 = avatarBuf.toString("base64");
const mime = "image/jpeg";

function makeCircularSvg(size) {
  const half = size / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
    ` width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<defs><clipPath id="c"><circle cx="${half}" cy="${half}" r="${half}"/></clipPath></defs>`,
    `<circle cx="${half}" cy="${half}" r="${half}" fill="#04060d"/>`,
    `<image href="data:${mime};base64,${b64}" x="0" y="0" width="${size}" height="${size}"`,
    ` preserveAspectRatio="xMidYMin slice" clip-path="url(#c)"/>`,
    `<circle cx="${half}" cy="${half}" r="${half - 1.5}" fill="none"`,
    ` stroke="rgba(111,220,239,0.55)" stroke-width="2"/>`,
    `</svg>`,
  ].join("");
}

const jobs = [
  { svg: makeCircularSvg(32),  out: "public/favicon-32.png",       w: 32  },
  { svg: makeCircularSvg(180), out: "public/apple-touch-icon.png", w: 180 },
];

for (const { svg, out, w } of jobs) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: w } });
  writeFileSync(resolve(root, out), resvg.render().asPng());
  console.log(`✓ Written ${out} (${w}×${w})`);
}

// Write the inline-SVG version (browsers with SVG favicon support pick this first)
writeFileSync(resolve(root, "public/favicon.svg"), makeCircularSvg(48));
console.log("✓ Written public/favicon.svg (48×48)");
