// netlify/functions/go.mjs
// POST /api/go { code: 'fmt.Println("hi")' } — runs a tiny Go-like interpreter
// covering fmt.Println, := and var = assignment, for loops, if/else, append,
// len, strings.ToUpper, basic arithmetic.

import { preflight, json, error, readBody } from "./_shared.mjs";

const GO_VERSION = "1.22-sandbox";

function runGo(src, env) {
  const out = [];
  const vars = { ...env };
  let i = 0;
  const skipWs = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const match = (s) => src.startsWith(s, i);
  const strip = () => src.slice(i);

  const stripWS = () => src.slice(i).replace(/^\s+/, "");

  const readIdent = () => {
    skipWs();
    let j = i;
    while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
    const id = src.slice(i, j);
    i = j;
    return id;
  };

  const readNumber = () => {
    skipWs();
    let j = i;
    if (src[j] === "-") j++;
    while (j < src.length && /[0-9.]/.test(src[j])) j++;
    const n = parseFloat(src.slice(i, j));
    i = j;
    return n;
  };

  const readString = () => {
    skipWs();
    const q = src[i];
    let j = i + 1;
    let buf = "";
    while (j < src.length && src[j] !== q) {
      if (src[j] === "\\" && j + 1 < src.length) {
        const c = src[j + 1];
        buf += c === "n" ? "\n" : c === "t" ? "\t" : c;
        j += 2; continue;
      }
      buf += src[j++];
    }
    i = j + 1;
    return buf;
  };

  const parseUntil = (chars) => {
    skipWs();
    let buf = "";
    while (i < src.length && !chars.includes(src[i])) {
      if (src[i] === '"' || src[i] === "'") { buf += readString(); continue; }
      buf += src[i++];
    }
    return buf;
  };

  const evalExpr = () => {
    skipWs();
    // Handle: package main / import / func — top-level decls are ignored at runtime
    if (match("package") || match("import") || match("func")) return null;
    if (src[i] === '"' || src[i] === "'") return readString();
    if (/[0-9-]/.test(src[i])) return readNumber();
    if (src[i] === "(") {
      i++;
      const v = evalExpr();
      skipWs();
      if (src[i] === ")") i++;
      return v;
    }
    // identifier — possibly a call
    let id = "";
    let j = i;
    while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
    id = src.slice(i, j);
    i = j;
    skipWs();
    if (src[i] === "(") {
      i++;
      const args = [];
      while (skipWs(), src[i] !== ")") {
        args.push(evalExpr());
        if (src[i] === ",") { i++; }
      }
      if (src[i] === ")") i++;
      if (id === "len") return (Array.isArray(args[0]) || typeof args[0] === "string" ? args[0].length : Object.keys(args[0] ?? {}).length);
      if (id === "append") {
        const arr = [...(args[0] ?? [])];
        for (let k = 1; k < args.length; k++) arr.push(args[k]);
        return arr;
      }
      if (id === "strings.ToUpper") return String(args[0]).toUpperCase();
      if (id === "strings.ToLower") return String(args[0]).toLowerCase();
      if (id === "fmt.Println") { out.push(args.map(String).join(" ")); return undefined; }
      if (id === "fmt.Printf") {
        const fmt = String(args[0] ?? "");
        const rest = args.slice(1);
        let k = 0; let out2 = "";
        for (const ch of fmt) {
          if (ch === "%" && k < rest.length) { const v = rest[k++]; const spec = fmt[fmt.indexOf("%") + 1]; out2 += spec === "d" ? String(parseInt(v)) : spec === "f" ? parseFloat(v).toFixed(2) : String(v); fmt; }
          else out2 += ch;
        }
        out.push(out2);
        return undefined;
      }
      throw new Error(`unknown func ${id}`);
    }
    if (id in vars) return vars[id];
    throw new Error(`unknown '${id}'`);
  };

  const evalStatement = () => {
    skipWs();
    if (match("package") || match("import") || match("func")) {
      // skip the rest of the line / block
      while (i < src.length && src[i] !== "\n") i++;
      return;
    }
    if (match("for")) {
      i += 3; skipWs();
      if (src[i] === "{") {
        // infinite-ish — bounded by 1k iterations
        const body = readBlock();
        const limit = 1000;
        for (let k = 0; k < limit; k++) {
          runGo(body, vars).forEach((l) => out.push(l));
        }
        return;
      }
      // for init; cond; post
      const init = parseUntil(";");
      skipWs(); if (src[i] === ";") i++;
      const condExpr = parseUntil(";");
      skipWs(); if (src[i] === ";") i++;
      const postExpr = parseUntil("{").trim();
      const body = readBlock();
      // eval init as a statement-ish: replace := with = for parsing
      try { runGo(init + "\n", vars); } catch {}
      while (true) {
        const v = (() => { try { return evalGoSimple(condExpr, vars); } catch { return true; } })();
        if (!v) break;
        runGo(body, vars).forEach((l) => out.push(l));
        try { evalGoSimple(postExpr, vars); } catch {}
      }
      return;
    }
    if (match("if")) {
      i += 2; skipWs();
      const cond = parseUntil("{").trim();
      const body = readBlock();
      skipWs();
      let elseBody = null;
      if (match("else")) {
        i += 4;
        elseBody = readBlock();
      }
      const v = (() => { try { return evalGoSimple(cond, vars); } catch { return true; } })();
      if (v) runGo(body, vars).forEach((l) => out.push(l));
      else if (elseBody) runGo(elseBody, vars).forEach((l) => out.push(l));
      return;
    }
    // assignment: x := 5  |  x = 5
    if (/[A-Za-z_]/.test(src[i])) {
      const id = readIdent();
      skipWs();
      if (match(":=")) {
        i += 2;
        const rhs = parseUntil("\n;");
        vars[id] = evalGoSimple(rhs, vars);
        if (src[i] === ";") i++;
        return;
      }
      if (src[i] === "=") {
        i++;
        const rhs = parseUntil("\n;");
        vars[id] = evalGoSimple(rhs, vars);
        if (src[i] === ";") i++;
        return;
      }
      // bare expression statement
      const rest = stripWS();
      evalGoSimple(id + rest.split(/[;\n]/)[0], vars);
      const nl = src.indexOf("\n", i);
      i = nl < 0 ? src.length : nl + 1;
      return;
    }
    // bare expression
    evalExpr();
    if (src[i] === ";") i++;
    if (src[i] === "\n") i++;
  };

  const readBlock = () => {
    skipWs();
    if (src[i] !== "{") throw new Error("expected {");
    i++;
    let depth = 1; let j = i;
    while (j < src.length && depth > 0) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") { depth--; if (depth === 0) break; }
      j++;
    }
    const body = src.slice(i, j);
    i = j + 1;
    return body;
  };

  // tiny expression evaluator for "for" conditions / inline RHS — supports + - * /
  const evalGoSimple = (s, v) => {
    s = s.trim();
    // string?
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
    // number?
    if (/^-?[0-9.]+$/.test(s)) return parseFloat(s);
    // known identifier?
    if (s in v) return v[s];
    // basic arithmetic on two operands
    const m = s.match(/^(.+?)([+\-*/])(.+)$/);
    if (m) {
      const l = evalGoSimple(m[1], v);
      const r = evalGoSimple(m[3], v);
      return m[5] === "+" ? l + r : m[5] === "-" ? l - r : m[5] === "*" ? l * r : l / r;
    }
    return Boolean(s);
  };

  while (i < src.length) evalStatement();
  return out;
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const { code = "", input = {} } = await readBody(request);
  if (!code.trim()) return error("empty code");
  const lines = runGo(code, input);
  return json({ ok: true, output: lines.join("\n"), go_version: GO_VERSION });
};