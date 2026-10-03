// netlify/functions/php.mjs
// POST /api/php { code: "echo $x;" } — minimal PHP-like interpreter covering
// echo, $vars, assignment, arithmetic, concat with ".", if/else, foreach, and
// string interpolation "Hello $name". No eval, no fs.

import { preflight, json, error, readBody } from "./_shared.mjs";

const PHP_VERSION = "8.3-sandbox";

function runPhp(src, env) {
  const out = [];
  const vars = { ...env };
  let i = 0;
  const skipWs = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const match = (s) => src.startsWith(s, i);
  const peek = (re) => { skipWs(); const m = src.slice(i).match(re); return m; };

  const parseString = (q) => {
    let j = i + 1;
    let buf = "";
    while (j < src.length && src[j] !== q) {
      if (src[j] === "\\" && j + 1 < src.length) {
        const c = src[j + 1];
        buf += c === "n" ? "\n" : c === "t" ? "\t" : c === "\\" ? "\\" : c;
        j += 2; continue;
      }
      buf += src[j++];
    }
    i = j + 1;
    return buf;
  };

  const interpolate = (raw) =>
    raw.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, n) => (n in vars ? String(vars[n]) : ""));

  const parseQuoted = (q) => interpolate(parseString(q));

  const readVar = () => {
    skipWs();
    if (src[i] !== "$") return null;
    let j = i + 1;
    while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
    const name = src.slice(i + 1, j);
    i = j;
    return name;
  };

  const readNumber = () => {
    skipWs();
    let j = i;
    while (j < src.length && /[0-9.]/.test(src[j])) j++;
    const n = parseFloat(src.slice(i, j));
    i = j;
    return n;
  };

  const evalExpr = (stop) => {
    skipWs();
    // string
    if (src[i] === '"' || src[i] === "'") return parseQuoted(src[i]);
    // number
    if (/[0-9]/.test(src[i])) return readNumber();
    // var
    if (src[i] === "$") {
      const n = readVar();
      return n in vars ? vars[n] : undefined;
    }
    // array literal
    if (src[i] === "[") {
      i++;
      const items = [];
      while (true) {
        skipWs();
        if (src[i] === "]") { i++; break; }
        items.push(evalExpr("].,"));
        skipWs();
        if (src[i] === ",") i++;
      }
      return items;
    }
    // parens
    if (src[i] === "(") {
      i++;
      const v = evalExpr(")");
      skipWs();
      if (src[i] === ")") i++;
      return v;
    }
    if (stop && stop.includes(src[i])) return undefined;
    throw new Error(`unexpected '${src[i] || "EOF"}'`);
  };

  const evalFull = () => {
    skipWs();
    // while / if / foreach / echo
    if (match("echo")) {
      i += 4;
      const parts = [];
      while (i < src.length && src[i] !== ";") {
        skipWs();
        if (src[i] === '"' || src[i] === "'") { parts.push(parseQuoted(src[i])); }
        else if (src[i] === "$") { parts.push(evalExpr(";")); }
        else if (src[i] === ".") { i++; }
        else throw new Error(`unexpected '${src[i]}'`);
      }
      out.push(parts.join(""));
      if (src[i] === ";") i++;
      return;
    }
    if (match("if")) {
      i += 2;
      skipWs();
      if (src[i] !== "(") throw new Error("expected (");
      i++;
      const cond = evalBool();
      skipWs();
      if (src[i] !== ")") throw new Error("expected )");
      i++;
      const block = readBlock();
      let elseBlock = null;
      skipWs();
      if (match("else")) {
        i += 4;
        elseBlock = readBlock();
      }
      if (cond) runPhp(block, vars).forEach((l) => out.push(l));
      else if (elseBlock) runPhp(elseBlock, vars).forEach((l) => out.push(l));
      return;
    }
    if (match("foreach")) {
      i += 7;
      skipWs();
      if (src[i] !== "(") throw new Error("expected (");
      i++;
      const colName = readVar();
      skipWs();
      if (!match("as")) throw new Error("expected as");
      i += 2;
      const itemName = readVar();
      skipWs();
      if (src[i] !== ")") throw new Error("expected )");
      i++;
      const body = readBlock();
      const col = vars[colName] ?? [];
      for (const item of col) {
        vars[itemName] = item;
        runPhp(body, vars).forEach((l) => out.push(l));
      }
      return;
    }
    if (src[i] === "$") {
      const name = readVar();
      skipWs();
      if (src[i] !== "=") throw new Error("expected =");
      i++;
      // Right-hand side may be a string concat chain
      let val = evalExpr(";.");
      while (src[i] === ".") { i++; val += evalExpr(";."); }
      if (src[i] === ";") i++;
      vars[name] = val;
      return;
    }
    if (src[i] === "}") { i++; return; }
    if (src[i] === undefined || src[i] === "<" /* PHP close tag */) {
      if (src.startsWith("?>", i)) i += 2;
      return;
    }
    throw new Error(`unknown statement near '${src.slice(i, i + 10)}'`);
  };

  const evalBool = () => {
    skipWs();
    let l = evalExpr(")");
    skipWs();
    if (src[i] === ">" || src[i] === "<" || src[i] === "=" || src[i] === "!") {
      const op = src[i] + (src[i + 1] === "=" ? src[++i] : "");
      i++;
      const r = evalExpr(")");
      return op === ">" ? l > r : op === "<" ? l < r : op === "==" ? l == r : op === "!=" ? l != r : op === ">=" ? l >= r : l <= r;
    }
    return Boolean(l);
  };

  const readBlock = () => {
    skipWs();
    if (src[i] !== "{") throw new Error("expected {");
    i++;
    let depth = 1;
    let j = i;
    while (j < src.length && depth > 0) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") { depth--; if (depth === 0) break; }
      j++;
    }
    const body = src.slice(i, j);
    i = j + 1;
    return body;
  };

  try {
    while (i < src.length) evalFull();
  } catch (e) {
    out.push("[error] " + (e.message || e));
  }
  return out;
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const { code = "", input = {} } = await readBody(request);
  if (!code.trim()) return error("empty code");
  const lines = runPhp(code, input);
  return json({ ok: true, output: lines.join("\n"), php_version: PHP_VERSION });
};