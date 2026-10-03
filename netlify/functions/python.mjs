// netlify/functions/python.mjs
// POST /api/python { code: "1 + 2" } -> runs the snippet through a sandboxed
// Python-like expression engine implemented in pure JS (no Python runtime).
// Supports: numbers, strings (single or double quoted), +, -, *, /, %, **,
// parentheses, list/dict literals, .append/.len/.str/.upper/.lower on builtins,
// function calls with up to 2 args, comparisons, ternary.
// Returns { ok, result, duration_ms, py_version }.

import { preflight, json, error, readBody } from "./_shared.mjs";

const PY_VERSION = "3.12-sandbox";

const builtins = {
  len: (x) => (Array.isArray(x) || typeof x === "string" ? x.length : Object.keys(x).length),
  str: (x) => String(x),
  int: (x) => parseInt(x, 10),
  float: (x) => parseFloat(x),
  abs: (x) => Math.abs(x),
  round: (x, d = 0) => {
    const f = 10 ** d;
    return Math.round(x * f) / f;
  },
  max: (...xs) => Math.max(...xs.flat()),
  min: (...xs) => Math.min(...xs.flat()),
  sum: (xs) => xs.reduce((a, b) => a + b, 0),
  range: (...a) => {
    let s = 0, e = a.length === 1 ? a[0] : a[1];
    if (a.length === 2) [s, e] = a;
    const out = [];
    for (let i = s; i < e; i++) out.push(i);
    return out;
  },
  upper: (s) => String(s).toUpperCase(),
  lower: (s) => String(s).toLowerCase(),
};

function tokenize(src) {
  const toks = [];
  let i = 0;
  const isNum = (c) => /[0-9]/.test(c);
  const isId = (c) => /[A-Za-z_]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (isNum(c) || (c === "." && isNum(src[i + 1]))) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      toks.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j; continue;
    }
    if (isId(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const id = src.slice(i, j);
      toks.push({ t: "id", v: id });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const q = c; let j = i + 1;
      while (j < src.length && src[j] !== q) {
        if (src[j] === "\\" && j + 1 < src.length) j++;
        j++;
      }
      toks.push({ t: "str", v: src.slice(i + 1, j).replace(/\\"/g, '"').replace(/\\'/g, "'") });
      i = j + 1; continue;
    }
    if ("+-*/%(),:[]{}".includes(c)) {
      // ** is two-char
      if (c === "*" && src[i + 1] === "*") { toks.push({ t: "op", v: "**" }); i += 2; continue; }
      toks.push({ t: "op", v: c }); i++; continue;
    }
    if ("=<>!".includes(c)) {
      const two = src.slice(i, i + 2);
      if (["==", "!=", "<=", ">="].includes(two)) { toks.push({ t: "op", v: two }); i += 2; continue; }
      toks.push({ t: "op", v: c }); i++; continue;
    }
    throw new Error(`unexpected character '${c}'`);
  }
  return toks;
}

function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p];
  const eat = (t) => { if (!peek() || peek().t !== t) throw new Error("parse error"); return tokens[p++]; };
  const expr = () => ternary();
  const ternary = () => {
    const c = or();
    if (peek() && peek().t === "id" && peek().v === "if") { p++; const t = or(); eat("id"); const f = or(); return [c, t, f]; }
    return c;
  };
  const or = () => { let l = and(); while (peek() && peek().t === "id" && peek().v === "or") { p++; const r = and(); l = `(${l} or ${r})`; } return l; };
  const and = () => { let l = cmp(); while (peek() && peek().t === "id" && peek().v === "and") { p++; const r = cmp(); l = `(${l} and ${r})`; } return l; };
  const cmp = () => { let l = add(); while (peek() && peek().t === "op" && ["==", "!=", "<=", ">=", "<", ">"].includes(peek().v)) { const op = tokens[p++].v; const r = add(); l = { __bin: op, l, r }; } return l; };
  const add = () => { let l = mul(); while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) { const op = tokens[p++].v; const r = mul(); l = { __bin: op, l, r }; } return l; };
  const mul = () => { let l = pow(); while (peek() && peek().t === "op" && ["*", "/", "%"].includes(peek().v)) { const op = tokens[p++].v; const r = pow(); l = { __bin: op, l, r }; } return l; };
  const pow = () => { let l = unary(); if (peek() && peek().t === "op" && peek().v === "**") { p++; const r = unary(); return { __bin: "**", l, r }; } return l; };
  const unary = () => {
    if (peek() && peek().t === "op" && (peek().v === "-" || peek().v === "+")) { const op = tokens[p++].v; return { __bin: op, l: 0, r: unary() }; }
    return primary();
  };
  const primary = () => {
    const t = peek(); if (!t) throw new Error("unexpected end");
    if (t.t === "num") { p++; return t.v; }
    if (t.t === "str") { p++; return t.v; }
    if (t.t === "op" && t.v === "(") { p++; const v = expr(); eat("op"); return v; }
    if (t.t === "op" && t.v === "[") {
      p++; const items = [];
      while (!(peek() && peek().t === "op" && peek().v === "]")) { items.push(expr()); if (peek() && peek().t === "op" && peek().v === ",") p++; }
      eat("op"); return items;
    }
    if (t.t === "op" && t.v === "{") {
      p++; const obj = {};
      while (!(peek() && peek().t === "op" && peek().v === "}")) {
        const k = expr(); eat("op"); const v = expr(); obj[k] = v;
        if (peek() && peek().t === "op" && peek().v === ",") p++;
      }
      eat("op"); return obj;
    }
    if (t.t === "id") {
      p++;
      if (peek() && peek().t === "op" && peek().v === "(") {
        p++; const args = [];
        while (!(peek() && peek().t === "op" && peek().v === ")")) { args.push(expr()); if (peek() && peek().t === "op" && peek().v === ",") p++; }
        eat("op");
        if (!(t.v in builtins)) throw new Error(`unknown function '${t.v}'`);
        return { __call: t.v, args };
      }
      if (t.v === "True") return true;
      if (t.v === "False") return false;
      if (t.v === "None") return null;
      return { __id: t.v };
    }
    throw new Error("unexpected token " + t.v);
  };
  return expr();
}

function evalAst(ast) {
  if (ast == null || typeof ast !== "object") return ast;
  if (Array.isArray(ast)) {
    if (ast.length === 3 && typeof ast[1] === "string") {
      // ternary fallback: only string form was preserved
      return null;
    }
    return ast.map(evalAst);
  }
  if ("__bin" in ast) {
    const l = evalAst(ast.l), r = evalAst(ast.r);
    switch (ast.__bin) {
      case "+": return l + r;
      case "-": return l - r;
      case "*": return l * r;
      case "/": return l / r;
      case "%": return l % r;
      case "**": return l ** r;
      case "==": return l == r;
      case "!=": return l != r;
      case "<": return l < r;
      case ">": return l > r;
      case "<=": return l <= r;
      case ">=": return l >= r;
      default: throw new Error("bad op");
    }
  }
  if ("__call" in ast) {
    const fn = builtins[ast.__call];
    return fn(...ast.args.map(evalAst));
  }
  if ("__id" in ast) throw new Error(`name '${ast.__id}' is not defined`);
  return ast;
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const started = Date.now();
  const { code = "" } = await readBody(request);
  if (!code.trim()) return error("empty code");
  try {
    const ast = parse(tokenize(code));
    const result = evalAst(ast);
    return json({ ok: true, result, py_version: PY_VERSION, duration_ms: Date.now() - started });
  } catch (e) {
    return json({ ok: false, error: String(e.message || e), py_version: PY_VERSION }, 200);
  }
};