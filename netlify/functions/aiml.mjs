// netlify/functions/aiml.mjs
// POST /api/aiml — deterministic on-device inference (no external calls).
// Supports three mini-tasks:
//   { task: "sentiment", text }               -> { label, score, tokens }
//   { task: "classify", text, labels: [...] } -> { label, scores: {label: p} }
//   { task: "summarize", text, max: 30 }      -> { summary }
//   { task: "embed", text }                   -> { vector: [..384], norm }

import { preflight, json, error, readBody } from "./_shared.mjs";

const POS = new Set(["good", "great", "excellent", "amazing", "love", "loved", "awesome", "fantastic", "wonderful", "perfect", "best", "happy", "fast", "easy", "smooth", "reliable", "secure", "fast", "stable", "solid", "elegant", "clean", "clear", "intuitive"]);
const NEG = new Set(["bad", "terrible", "awful", "hate", "hated", "broken", "slow", "crash", "crashes", "bug", "bugs", "buggy", "unstable", "unreliable", "confusing", "ugly", "poor", "worst", "sad", "angry", "frustrated", "disappointed", "slow", "laggy", "memory", "leak", "crashed", "panic", "fails"]);

const HASH = 5381;
function tokenize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter(Boolean);
}

function sentiment(text) {
  const tokens = tokenize(text);
  let pos = 0, neg = 0;
  for (const t of tokens) { if (POS.has(t)) pos++; if (NEG.has(t)) neg++; }
  const score = (pos - neg) / Math.max(1, tokens.length);
  const label = score > 0.05 ? "positive" : score < -0.05 ? "negative" : "neutral";
  return { label, score: Number(score.toFixed(3)), pos, neg, tokens: tokens.length };
}

function classify(text, labels) {
  const tokens = tokenize(text);
  const scores = {};
  for (const lab of labels) {
    const labelTokens = tokenize(lab);
    let overlap = 0;
    for (const t of tokens) if (labelTokens.includes(t)) overlap++;
    scores[lab] = overlap;
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(scores)) scores[k] = total ? Number((scores[k] / total).toFixed(3)) : 0;
  const label = labels.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
  return { label, scores };
}

function summarize(text, max) {
  const sents = String(text).split(/(?<=[.!?])\s+/);
  const tokens = sents.map((s) => ({ s, score: tokenize(s).reduce((a, t) => a + (POS.has(t) ? 1 : 0) + (NEG.has(t) ? -1 : 0), 0) }));
  tokens.sort((a, b) => b.score - a.score);
  const out = tokens.slice(0, Math.max(1, Math.floor(max / 30))).map((s) => s.s).join(" ");
  return { summary: out.length > max ? out.slice(0, max - 1) + "…" : out };
}

// Tiny 64-dim "semantic" embedding built from letter-trigram hashing — purely
// deterministic. Useful for cosine-similarity demos. Norm = 1.
function embed(text) {
  const dim = 64;
  const v = new Array(dim).fill(0);
  const tokens = tokenize(text);
  for (const t of tokens) {
    let h = HASH;
    for (const ch of t) { h = (h * 33 + ch.charCodeAt(0)) >>> 0; }
    const idx = h % dim;
    v[idx] += 1;
    v[(idx + 1) % dim] += 0.5;
  }
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return { vector: v.map((x) => Number((x / norm).toFixed(4))), norm: 1 };
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const body = await readBody(request);
  const task = body.task ?? "sentiment";
  const started = Date.now();
  if (task === "sentiment") return json({ ok: true, task, result: sentiment(body.text ?? ""), duration_ms: Date.now() - started });
  if (task === "classify") {
    if (!Array.isArray(body.labels) || body.labels.length < 2) return error("labels[] required");
    return json({ ok: true, task, result: classify(body.text ?? "", body.labels), duration_ms: Date.now() - started });
  }
  if (task === "summarize") return json({ ok: true, task, result: summarize(body.text ?? "", body.max ?? 80), duration_ms: Date.now() - started });
  if (task === "embed") return json({ ok: true, task, result: embed(body.text ?? ""), duration_ms: Date.now() - started });
  return error("unknown task");
};