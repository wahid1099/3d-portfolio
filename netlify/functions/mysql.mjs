// netlify/functions/mysql.mjs
// POST /api/mysql — accepts SQL and runs it through a deterministic SQL engine
// implemented in pure JS (no external DB). Supports SELECT, INSERT, UPDATE,
// DELETE, CREATE TABLE, with WHERE, LIMIT, ORDER BY, and a basic WHERE
// evaluator (=, !=, <, >, <=, >=, AND, OR, LIKE).

import { preflight, json, error, readBody } from "./_shared.mjs";

const TABLES = new Map(); // tableName -> [{ column: type }]
const ROWS = new Map();

function normVal(v) {
  if (typeof v !== "string") return v;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "NULL" || v === "null") return null;
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v.slice(1, -1);
  return v;
}

function tokenize(sql) {
  const out = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "(" || c === ")" || c === "," || c === ";" || c === "*") { out.push({ t: c }); i++; continue; }
    if (c === "=" || c === "<" || c === ">" || c === "!") {
      if (sql[i + 1] === "=") { out.push({ t: sql.slice(i, i + 2) }); i += 2; continue; }
      if (c === "!" ) { out.push({ t: "!=" }); i++; continue; }
      out.push({ t: c }); i++; continue;
    }
    if (c === "'" || c === '"') {
      const q = c; let j = i + 1;
      while (j < sql.length && sql[j] !== q) j++;
      out.push({ t: "str", v: sql.slice(i + 1, j) });
      i = j + 1; continue;
    }
    if (/[0-9-]/.test(c) || (c === "-" && /[0-9]/.test(sql[i + 1]))) {
      let j = i; if (c === "-") j++;
      while (j < sql.length && /[0-9.]/.test(sql[j])) j++;
      out.push({ t: "num", v: Number(sql.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j])) j++;
      const w = sql.slice(i, j);
      const KW = ["SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "AND", "OR", "NOT", "LIKE", "ORDER", "BY", "ASC", "DESC", "LIMIT", "PRIMARY", "KEY", "INT", "TEXT", "VARCHAR"];
      out.push({ t: KW.includes(w.toUpperCase()) ? "kw" : "id", v: w });
      i = j; continue;
    }
    throw new Error("lex error at " + sql.slice(i, i + 10));
  }
  return out;
}

function parseInsert(toks) {
  let p = 2; // INSERT INTO
  const table = toks[p++].v;
  expect(toks[p++], "(");
  const columns = [];
  while (toks[p].t !== ")") { columns.push(toks[p].v); if (toks[p].t !== ")") p++; if (toks[p].t === ",") p++; }
  p++;
  expect(toks[p++], "kw", "VALUES");
  const values = [];
  while (toks[p].t !== ";") {
    expect(toks[p++], "(");
    const row = [];
    while (toks[p].t !== ")") {
      const start = p;
      let buf = "";
      while (toks[p].t !== ")" && toks[p].t !== ",") {
        buf += (toks[p].t === "str" ? "'" + toks[p].v + "'" : toks[p].v) + " ";
        p++;
      }
      row.push(normVal(buf.trim()));
      if (toks[p].t === ",") p++;
    }
    p++;
    values.push(row);
    if (toks[p].t === ",") p++;
  }
  return { table, columns, values };
}

function expect(t, ...need) {
  if (!need.includes(t.t) && !need.includes(t.v)) throw new Error("expected " + need.join("/"));
}

function evalWhere(row, whereTokens) {
  if (!whereTokens || whereTokens.length === 0) return true;
  // very simple: column op value, optionally joined by AND / OR
  let i = 0;
  const comp = () => {
    const col = whereTokens[i++].v;
    const op = whereTokens[i++].t;
    let val = whereTokens[i++];
    if (val.t === "str" || val.t === "num") val = val.v;
    const lhs = row[col];
    if (op === "=") return lhs == val;
    if (op === "!=") return lhs != val;
    if (op === "<") return lhs < val;
    if (op === ">") return lhs > val;
    if (op === "<=") return lhs <= val;
    if (op === ">=") return lhs >= val;
    if (op === "LIKE") return String(lhs ?? "").match(new RegExp("^" + String(val).replace(/%/g, ".*") + "$"));
    throw new Error("bad operator " + op);
  };
  let result = comp();
  while (i < whereTokens.length && whereTokens[i].t === "kw" && (whereTokens[i].v === "AND" || whereTokens[i].v === "OR")) {
    const op = whereTokens[i++].v;
    const next = comp();
    result = op === "AND" ? result && next : result || next;
  }
  return result;
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const { sql = "", initial = [] } = await readBody(request);
  if (!sql.trim()) return error("empty sql");
  // bootstrap demo data
  if (initial.length && !ROWS.has("users")) {
    TABLES.set("users", [{ name: "id", type: "INT" }, { name: "name", type: "TEXT" }, { name: "role", type: "TEXT" }]);
    ROWS.set("users", initial.map((u, i) => ({ id: i + 1, ...u })));
  }

  const log = [];
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      const toks = tokenize(stmt + ";");
      const head = toks[0];
      if (head.v === "CREATE") {
        const table = toks[2].v;
        expect(toks[3], "(");
        const cols = [];
        let i = 4;
        while (toks[i].t !== ")") {
          const name = toks[i].v; const type = toks[i + 1].v;
          cols.push({ name, type });
          i += 2;
          if (toks[i].t === ",") i++;
        }
        TABLES.set(table, cols);
        ROWS.set(table, []);
        log.push(`created table ${table}`);
      } else if (head.v === "INSERT") {
        const { table, columns, values } = parseInsert(toks);
        const tbl = ROWS.get(table) ?? [];
        let nextId = (tbl[tbl.length - 1]?.id ?? 0) + 1;
        for (const row of values) {
          const obj = {};
          columns.forEach((c, i) => { obj[c] = row[i]; });
          if (!("id" in obj)) obj.id = nextId++;
          tbl.push(obj);
        }
        ROWS.set(table, tbl);
        log.push(`inserted ${values.length} row(s) into ${table}`);
      } else if (head.v === "SELECT") {
        const fromIdx = toks.findIndex((t) => t.t === "kw" && t.v === "FROM");
        const cols = [];
        for (let i = 1; i < fromIdx; i++) cols.push(toks[i].v);
        const table = toks[fromIdx + 1].v;
        const whereIdx = toks.findIndex((t) => t.t === "kw" && t.v === "WHERE");
        let end = toks.length - 1;
        while (end > 0 && toks[end].t === ";") end--;
        const whereT = whereIdx > 0 ? toks.slice(whereIdx + 1, end) : [];
        const orderIdx = toks.findIndex((t) => t.t === "kw" && t.v === "ORDER");
        const limitIdx = toks.findIndex((t) => t.t === "kw" && t.v === "LIMIT");
        let orderBy = null;
        if (orderIdx > 0) {
          const col = toks[orderIdx + 2].v;
          const dir = toks[orderIdx + 3]?.v === "DESC" ? -1 : 1;
          orderBy = { col, dir };
        }
        let limit = limitIdx > 0 ? toks[limitIdx + 1].v : null;
        let rows = (ROWS.get(table) ?? []).filter((r) => evalWhere(r, whereT));
        if (orderBy) rows.sort((a, b) => (a[orderBy.col] > b[orderBy.col] ? 1 : -1) * orderBy.dir);
        if (limit) rows = rows.slice(0, Number(limit));
        const result = cols[0] === "*" ? rows : rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
        log.push({ table, count: result.length, rows: result });
      } else if (head.v === "UPDATE") {
        const table = toks[1].v;
        expect(toks[2], "kw", "SET");
        const set = {};
        let i = 3;
        while (toks[i].t !== "kw" || toks[i].v !== "WHERE") {
          const col = toks[i].v;
          expect(toks[i + 1], "=");
          let valTok = toks[i + 2];
          let val = valTok.t === "str" || valTok.t === "num" ? valTok.v : valTok.v;
          set[col] = normVal(String(val));
          i += 3;
          if (toks[i].t === ",") i++;
        }
        i++;
        const whereT = [];
        while (i < toks.length && toks[i].t !== ";") whereT.push(toks[i++]);
        const tbl = ROWS.get(table) ?? [];
        let n = 0;
        for (const r of tbl) if (evalWhere(r, whereT)) { Object.assign(r, set); n++; }
        log.push(`updated ${n} row(s) in ${table}`);
      } else if (head.v === "DELETE") {
        expect(toks[1], "kw", "FROM");
        const table = toks[2].v;
        let i = 3;
        const whereT = [];
        if (toks[i]?.t === "kw" && toks[i].v === "WHERE") { i++; while (i < toks.length && toks[i].t !== ";") whereT.push(toks[i++]); }
        const tbl = ROWS.get(table) ?? [];
        const before = tbl.length;
        const next = tbl.filter((r) => !evalWhere(r, whereT));
        ROWS.set(table, next);
        log.push(`deleted ${before - next.length} row(s) from ${table}`);
      } else {
        log.push(`unknown statement '${head.v}'`);
      }
    } catch (e) {
      log.push("[error] " + (e.message || e));
    }
  }
  return json({ ok: true, log, snapshot: Object.fromEntries(ROWS) });
};