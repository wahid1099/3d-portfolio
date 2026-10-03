// netlify/functions/go.mjs
// POST /api/go — Go-style intent interpreter. Parses common Go syntax
// (fmt.Println, := and = assignment, fmt.Printf, strings.ToUpper/Lower,
// len, append, basic arithmetic, for { } infinite loops bounded to 1k,
// if/else, while via for cond { }).  
// Returns { ok, output, go_version }.

import { preflight, json, error, readBody } from "./_shared.mjs";

const GO_VERSION = "1.22-sandbox";

function runGo(src, env) {
  const out = [];
  const vars = { ...env };
  let i = 0;

  const skipWs = () => {
    while (i < src.length && /[\s]/.test(src[i])) i++;
  };

  function readIdent() {
    skipWs();
    let j = i;
    while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
    const id = src.slice(i, j);
    i = j;
    return id;
  }

  function readNumber() {
    skipWs();
    let j = i;
    if (src[j] === "-") j++;
    while (j < src.length && /[0-9.]/.test(src[j])) j++;
    const n = parseFloat(src.slice(i, j));
    i = j;
    return n;
  }

  function readString() {
    skipWs();
    const q = src[i];
    if (q !== '"' && q !== "'") return undefined;
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
  }

  function readBlock() {
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
  }

  // ---- expression parser ----
  function parseExpr() { return parseAddSub(); }
  function parseAddSub() {
    let left = parseMulDiv();
    skipWs();
    while (src[i] === "+" || src[i] === "-") {
      const op = src[i++];
      const right = parseMulDiv();
      left = op === "+" ? left + right : left - right;
      skipWs();
    }
    return left;
  }
  function parseMulDiv() {
    let left = parseUnary();
    skipWs();
    while (src[i] === "*" || src[i] === "/") {
      const op = src[i++];
      const right = parseUnary();
      left = op === "*" ? left * right : left / right;
      skipWs();
    }
    return left;
  }
  function parseUnary() {
    skipWs();
    if (src[i] === "-") { i++; return -parsePrimary(); }
    if (src[i] === "+") { i++; return parsePrimary(); }
    return parsePrimary();
  }
  function parsePrimary() {
    skipWs();
    if (src[i] === undefined) throw new Error("unexpected EOF");
    if (/[0-9]/.test(src[i])) return readNumber();
    if (src[i] === '"' || src[i] === "'") {
      const s = readString();
      if (s === undefined) throw new Error("bad string");
      return s;
    }
    if (src[i] === "(") { i++; const v = parseExpr(); skipWs(); if (src[i] !== ")") throw new Error("expected )"); i++; return v; }
    if (src[i] === "[" && src[i + 1] === "]") {
      i += 2; skipWs();
      if (src[i] !== "{") throw new Error("expected {");
      i++;
      const items = [];
      while (true) {
        skipWs();
        if (src[i] === "}") { i++; break; }
        items.push(parseExpr());
        skipWs();
        if (src[i] === ",") i++;
      }
      return items;
    }
    // identifier or call
    const id = readIdent();
    if (!id) throw new Error("expected identifier");
    skipWs();
    if (src[i] === "(") {
      i++;
      const args = [];
      while (true) {
        skipWs();
        if (src[i] === ")") { i++; break; }
        args.push(parseExpr());
        skipWs();
        if (src[i] === ",") i++;
      }
      if (id === "fmt.Println") { out.push(args.map((a) => String(a)).join(" ")); return undefined; }
      if (id === "fmt.Printf") {
        const fmt = String(args[0] ?? "");
        const rest = args.slice(1);
        let k = 0; let out2 = ""; let p = 0;
        while (p < fmt.length) {
          const c = fmt[p++];
          if (c === "%" && p < fmt.length && k < rest.length) {
            const spec = fmt[p++];
            const v = rest[k++];
            if (spec === "d") out2 += String(parseInt(v));
            else if (spec === "f") out2 += parseFloat(v).toFixed(2);
            else out2 += String(v);
          } else out2 += c;
        }
        out.push(out2);
        return undefined;
      }
      if (id === "len") return (Array.isArray(args[0]) || typeof args[0] === "string") ? args[0].length : Object.keys(args[0] ?? {}).length;
      if (id === "append") {
        const arr = Array.isArray(args[0]) ? [...args[0]] : [];
        for (let k = 1; k < args.length; k++) arr.push(args[k]);
        return arr;
      }
      if (id === "strings.ToUpper") return String(args[0]).toUpperCase();
      if (id === "strings.ToLower") return String(args[0]).toLowerCase();
      throw new Error(`unknown func ${id}`);
    }
    if (id in vars) return vars[id];
    throw new Error(`name '${id}' is not defined`);
  }

  function evalBoolExpr(s) {
    const saved = src; const savedI = i;
    src = s; i = 0;
    try {
      skipWs();
      const l = parseExpr();
      skipWs();
      if (src[i] === "<" || src[i] === ">" || src[i] === "=" || src[i] === "!") {
        let op = src[i]; if (src[i + 1] === "=") { op += src[++i]; }
        i++;
        const r = parseExpr();
        return op === "<" ? l < r : op === ">" ? l > r : op === "==" ? l == r : op === "!=" ? l != r : op === "<=" ? l <= r : l >= r;
      }
      return Boolean(l);
    } finally { src = saved; i = savedI; }
  }

  function runSubstring(body) {
    const saved = src; const savedI = i;
    src = body; i = 0;
    try {
      while (i < src.length) {
        if (!evalStatement()) break;
      }
    } finally { src = saved; i = savedI; }
  }

  function evalStatement() {
    skipWs();
    if (i >= src.length) return false;
    if (src[i] === "}") return false;
    if (src[i] === "\n") { i++; return true; }
    // package / import: skip to end of line
    if (src.startsWith("package ", i)) { while (i < src.length && src[i] !== "\n") i++; return true; }
    if (src.startsWith("import ", i) || src.startsWith("import(", i)) {
      while (i < src.length && src[i] !== "\n") i++;
      return true;
    }
    // for { body }
    if (src.startsWith("for ", i) || (src[i] === "f" && src.startsWith("for", i) && !/[A-Za-z0-9_]/.test(src[i + 3] ?? ""))) {
      // Two forms: "for {" infinite  /  "for init; cond; post { body }"
      const spaceIdx = src.indexOf(" ", i);
      if (spaceIdx === -1 || src[spaceIdx + 1] === "{") {
        // infinite loop
        const body = readBlock();
        for (let k = 0; k < 1000; k++) runSubstring(body);
        return true;
      }
      // find "{" at end of header
      const braceIdx = src.indexOf("{", i);
      const header = src.slice(i + 4, braceIdx);
      const body = src.slice(braceIdx + 1, src.indexOf("}", braceIdx));
      i = braceIdx + 1 + body.length + 1;
      const parts = header.split(";");
      const init = (parts[0] ?? "").trim();
      const cond = (parts[1] ?? "").trim();
      const post = (parts[2] ?? "").trim();
      if (init) {
        const saved = src, savedI = i;
        src = init + ";"; i = 0;
        try { evalStatement(); } finally { src = saved; i = savedI; }
      }
      const safety = 10000;
      let n2 = 0;
      while (n2++ < safety) {
        const c = cond ? evalBoolExpr(cond) : true;
        if (!c) break;
        runSubstring(body);
        if (post) {
          const saved = src, savedI = i;
          src = post + ";"; i = 0;
          try { evalStatement(); } finally { src = saved; i = savedI; }
        }
      }
      return true;
    }
    // if cond { body } [ else { body } ]
    if (src.startsWith("if ", i)) {
      i += 3;
      const braceIdx = src.indexOf("{", i);
      const cond = src.slice(i, braceIdx).trim();
      const body = src.slice(braceIdx + 1, src.indexOf("}", braceIdx));
      i = braceIdx + 1 + body.length + 1;
      const c = evalBoolExpr(cond);
      if (c) runSubstring(body);
      skipWs();
      if (src.startsWith("else ", i)) {
        i += 5; skipWs();
        if (src[i] === "{") {
          const b2 = readBlock();
          if (!c) runSubstring(b2);
        }
      }
      return true;
    }
    // var x = expr  |  x := expr  |  x = expr
    let save = i;
    let j = i;
    while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
    if (j > i && j < src.length) {
      const id = src.slice(i, j);
      i = j;
      skipWs();
      if (src.startsWith(":=", i)) {
        i += 2;
        const v = parseExpr();
        vars[id] = v;
        while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
        if (src[i] === ";") i++;
        return true;
      }
      if (src[i] === "=") {
        i++;
        const v = parseExpr();
        vars[id] = v;
        while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
        if (src[i] === ";") i++;
        return true;
      }
      i = save; // rewind
    }
    // bare expression statement (e.g. fmt.Println(...);)
    parseExpr();
    while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
    if (src[i] === ";") i++;
    return true;
  }

  try {
    while (i < src.length) {
      if (!evalStatement()) break;
    }
  } catch (e) {
    out.push("[error] " + (e.message || e));
  }
  return out;
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const { code = "", input = {} } = await readBody(request);
  if (!code.trim()) return error("empty code");
  const lines = runGo(code, input);
  return json({ ok: true, output: lines.join("\n"), go_version: GO_VERSION });
};