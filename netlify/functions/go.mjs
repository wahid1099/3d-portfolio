// netlify/functions/go.mjs
// POST /api/go — runs a tiny Go-like interpreter covering fmt.Println, := and
// = assignment, for, while, if, append, len, strings.ToUpper, basic
// arithmetic. Returns { ok, output, go_version }.

import { preflight, json, error, readBody } from "./_shared.mjs";

const GO_VERSION = "1.22-sandbox";

function runGo(src, env) {
  const out = [];
  const vars = { ...env };
  let i = 0;

  const skipWs = () => {
    while (i < src.length && (/\s/.test(src[i]) || src[i] === "\r")) i++;
  };
  const peek = (re) => re.test(src[i] ?? "");

  const readIdent = () => {
    skipWs();
    let j = i;
    while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
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

  // Tiny expression parser. Handles:
  //   numbers | strings | id | ( expr ) | id ( args ) | expr op expr
  // where op ∈ + - * / and args is comma-separated expressions.
  function parseExpr() {
    return parseAddSub();
  }
  function parseAddSub() {
    let left = parseMulDiv();
    while (true) {
      skipWs();
      if (src[i] === "+" || src[i] === "-") {
        const op = src[i++];
        const right = parseMulDiv();
        left = op === "+" ? left + right : left - right;
      } else return left;
    }
  }
  function parseMulDiv() {
    let left = parseUnary();
    while (true) {
      skipWs();
      if (src[i] === "*" || src[i] === "/") {
        const op = src[i++];
        const right = parseUnary();
        left = op === "*" ? left * right : left / right;
      } else return left;
    }
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
    // number
    if (/[0-9]/.test(src[i])) return readNumber();
    // string
    if (src[i] === '"' || src[i] === "'") {
      const s = readString();
      if (s === undefined) throw new Error("bad string");
      return s;
    }
    // parens
    if (src[i] === "(") {
      i++;
      const v = parseExpr();
      skipWs();
      if (src[i] !== ")") throw new Error("expected )");
      i++;
      return v;
    }
    // slice literal []T{...}
    if (src[i] === "[" && src[i + 1] === "]") {
      i += 2;
      skipWs();
      if (src[i] === "{") {
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
      throw new Error("expected {");
    }
    // identifier or call
    let id = readIdent();
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
      // dispatch builtins
      if (id === "fmt.Println") { out.push(args.map((a) => String(a)).join(" ")); return undefined; }
      if (id === "fmt.Printf") {
        // very small subset: %v, %d, %s, %f
        const fmt = String(args[0] ?? "");
        const rest = args.slice(1);
        let k = 0;
        let out2 = "";
        let idx = 0;
        while (idx < fmt.length) {
          const c = fmt[idx++];
          if (c === "%" && idx < fmt.length) {
            const spec = fmt[idx++];
            if (k >= rest.length) break;
            const v = rest[k++];
            if (spec === "v" || spec === "s") out2 += String(v);
            else if (spec === "d") out2 += String(parseInt(v));
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
      if (id === "strconv.Itoa") return String(args[0]);
      throw new Error(`unknown func ${id}`);
    }
    // bare identifier
    if (id in vars) return vars[id];
    throw new Error(`name '${id}' is not defined`);
  }

  function evalStatement() {
    skipWs();
    if (i >= src.length) return false;
    // blank line or close brace
    if (src[i] === "}") return false;
    // package / import (skip line)
    if (src.startsWith("package ", i)) {
      // skip until end of line OR semicolon
      while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
      if (src[i] === ";") i++;
      return true;
    }
    if (src.startsWith("import ", i)) {
      // skip until end of line OR semicolon
      while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
      if (src[i] === ";") i++;
      return true;
    }
    // for
    if (src.startsWith("for ", i) || (src[i] === "f" && src.startsWith("for", i) && /\W/.test(src[i + 3] ?? ""))) {
      const k = i;
      while (src[k] !== " " && src[k] !== "\n" && src[k] !== "{") k++;
      if (src[k] === " ") {
        // Standard "for init; cond; post { body }" form.
        const header = src.slice(i + 4, src.indexOf("{", i));
        const body = readBlock();
        const parts = header.split(";");
        const init = (parts[0] ?? "").trim();
        const cond = (parts[1] ?? "").trim();
        const post = (parts[2] ?? "").trim();
        if (init) evalStatementOn(init + ";");
        const safety = 10000;
        let n = 0;
        while (n++ < safety) {
          const c = cond ? evalBoolExpr(cond) : true;
          if (!c) break;
          runGo(body, vars).forEach((l) => out.push(l));
          if (post) evalStatementOn(post + ";");
        }
        return true;
      }
      // No condition — infinite loop bounded to 1000 iters
      const body = readBlock();
      for (let k = 0; k < 1000; k++) runGo(body, vars).forEach((l) => out.push(l));
      return true;
    }
    // if
    if (src.startsWith("if ", i)) {
      i += 3;
      skipWs();
      const cond = parseExpr();
      skipWs();
      const body = readBlock();
      let elseBody = null;
      skipWs();
      if (src.startsWith("else", i)) {
        i += 4;
        skipWs();
        if (src[i] === "{") elseBody = readBlock();
        else { /* ignore nested if for simplicity */ }
      }
      if (cond) runGo(body, vars).forEach((l) => out.push(l));
      else if (elseBody) runGo(elseBody, vars).forEach((l) => out.push(l));
      return true;
    }
    // var x = …  |  x := …  |  x = …
    const save = i;
    let id = "";
    let j = i;
    while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
    if (j > i && (src[j] === " " || src[j] === "\n" || src[j] === "=" || src[j] === ":")) {
      id = src.slice(i, j);
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
      if (id === "var") {
        // var name = expr
        i = j;
        skipWs();
        id = readIdent();
        skipWs();
        if (src[i] === "=") { i++; vars[id] = parseExpr(); }
        while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
        if (src[i] === ";") i++;
        return true;
      }
    }
    i = save; // rewind if not an assignment
    // bare expression statement
    parseExpr();
    while (i < src.length && src[i] !== "\n" && src[i] !== ";") i++;
    if (src[i] === ";") i++;
    return true;
  }

  function evalStatementOn(src2) {
    const saved = src; const savedI = i;
    src = src2; i = 0;
    try { evalStatement(); } finally { src = saved; i = savedI; }
  }

  function evalBoolExpr(s) {
    const saved = src; const savedI = i;
    src = s + ";"; i = 0;
    try {
      const v = parseExpr();
      skipWs();
      if (src[i] === "<" || src[i] === ">" || src[i] === "=" || src[i] === "!") {
        const op = src[i] + (src[i + 1] === "=" ? src[++i] : "");
        i++;
        const r = parseExpr();
        return op === "<" ? v < r : op === ">" ? v > r : op === "==" ? v == r : op === "!=" ? v != r : op === "<=" ? v <= r : v >= r;
      }
      return Boolean(v);
    } finally { src = saved; i = savedI; }
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
// 2026-10-03T12:03:51.7317878+06:00
