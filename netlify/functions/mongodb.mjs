// netlify/functions/mongodb.mjs
// In-memory document store with MongoDB-ish query operators.
// Body: { collection, action: "insert|find|update|delete|count|aggregate",
//         filter, update, doc, pipeline, sort, limit, upsert }

import { preflight, json, error, readBody } from "./_shared.mjs";

const DB = new Map();

function coll(name) {
  if (!DB.has(name)) DB.set(name, []);
  return DB.get(name);
}

function match(doc, filter) {
  for (const [k, v] of Object.entries(filter ?? {})) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if ("$eq" in v && doc[k] !== v.$eq) return false;
      if ("$ne" in v && doc[k] === v.$ne) return false;
      if ("$gt" in v && !(doc[k] > v.$gt)) return false;
      if ("$gte" in v && !(doc[k] >= v.$gte)) return false;
      if ("$lt" in v && !(doc[k] < v.$lt)) return false;
      if ("$lte" in v && !(doc[k] <= v.$lte)) return false;
      if ("$in" in v && !v.$in.includes(doc[k])) return false;
      if ("$nin" in v && v.$nin.includes(doc[k])) return false;
      if ("$exists" in v && (k in doc) !== v.$exists) return false;
      if ("$regex" in v && !new RegExp(v.$regex).test(String(doc[k] ?? ""))) return false;
      if ("$contains" in v && !String(doc[k] ?? "").toLowerCase().includes(String(v.$contains).toLowerCase())) return false;
    } else if (Array.isArray(v)) {
      if (!Array.isArray(doc[k]) || !v.every((x) => doc[k].includes(x))) return false;
    } else if (doc[k] !== v) {
      return false;
    }
  }
  return true;
}

function applyUpdate(doc, update) {
  const out = { ...doc };
  for (const [op, fields] of Object.entries(update ?? {})) {
    if (op === "$set") Object.assign(out, fields);
    else if (op === "$inc") for (const [k, v] of Object.entries(fields)) out[k] = (out[k] ?? 0) + v;
    else if (op === "$push") for (const [k, v] of Object.entries(fields)) (out[k] = out[k] ?? []).push(v);
    else if (op === "$pull") for (const [k, v] of Object.entries(fields)) if (Array.isArray(out[k])) out[k] = out[k].filter((x) => x !== v);
    else if (op === "$rename") for (const [k, v] of Object.entries(fields)) { out[v] = out[k]; delete out[k]; }
  }
  return out;
}

function runAggregate(cols, pipeline) {
  let cur = cols.slice();
  for (const stage of pipeline) {
    const op = Object.keys(stage)[0];
    if (op === "$match") cur = cur.filter((d) => match(d, stage.$match));
    else if (op === "$sort") {
      const order = Object.entries(stage.$sort);
      cur.sort((a, b) => {
        for (const [k, dir] of order) if (a[k] !== b[k]) return ((a[k] > b[k] ? 1 : -1) * (dir < 0 ? -1 : 1));
        return 0;
      });
    } else if (op === "$limit") cur = cur.slice(0, stage.$limit);
    else if (op === "$skip") cur = cur.slice(stage.$skip);
    else if (op === "$project") {
      const keys = Object.entries(stage.$project);
      cur = cur.map((d) => Object.fromEntries(keys.map(([k, v]) => [k, v === 1 ? d[k] : undefined])).filter((_, i) => true));
    } else if (op === "$count") cur = [{ count: cur.length, _field: stage.$count }];
    else if (op === "$group") {
      const g = stage.$group;
      const key = g._id === null ? "" : g._id;
      const groups = new Map();
      for (const d of cur) {
        const k = typeof key === "string" ? d[key] : "_all";
        if (!groups.has(k)) {
          const acc = { _id: k };
          for (const [outKey, expr] of Object.entries(g)) {
            if (outKey === "_id") continue;
            if (typeof expr === "object" && "$sum" in expr) acc[outKey] = expr.$sum === 1 ? 1 : (acc[outKey] ?? 0) + (expr.$sum === "$points" ? d.points : expr.$sum);
          }
          groups.set(k, acc);
        } else {
          const acc = groups.get(k);
          for (const [outKey, expr] of Object.entries(g)) {
            if (outKey === "_id") continue;
            if (typeof expr === "object" && "$sum" in expr) acc[outKey] = (acc[outKey] ?? 0) + (expr.$sum === 1 ? 1 : (expr.$sum === "$points" ? d.points : expr.$sum));
          }
        }
      }
      cur = [...groups.values()];
    }
  }
  return cur;
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  const body = await readBody(request);
  const collection = body.collection ?? "demo";
  const action = body.action ?? "find";
  const c = coll(collection);

  if (action === "insert") {
    const docs = Array.isArray(body.doc) ? body.doc : [body.doc];
    const inserted = docs.map((d) => ({ _id: c.length ? c[c.length - 1]._id + 1 : 1, ...d }));
    c.push(...inserted);
    return json({ ok: true, inserted: inserted.length, ids: inserted.map((d) => d._id) });
  }
  if (action === "find") {
    let res = c.filter((d) => match(d, body.filter));
    if (body.sort) {
      const order = Object.entries(body.sort);
      res.sort((a, b) => {
        for (const [k, dir] of order) if (a[k] !== b[k]) return ((a[k] > b[k] ? 1 : -1) * (dir < 0 ? -1 : 1));
        return 0;
      });
    }
    if (body.limit) res = res.slice(0, body.limit);
    return json({ ok: true, count: res.length, docs: res });
  }
  if (action === "update") {
    const filter = body.filter ?? {};
    const update = body.update ?? {};
    let n = 0;
    for (let i = 0; i < c.length; i++) if (match(c[i], filter)) { c[i] = applyUpdate(c[i], update); n++; }
    return json({ ok: true, modified: n });
  }
  if (action === "delete") {
    const before = c.length;
    const next = c.filter((d) => !match(d, body.filter));
    DB.set(collection, next);
    return json({ ok: true, deleted: before - next.length });
  }
  if (action === "count") {
    return json({ ok: true, count: c.filter((d) => match(d, body.filter)).length });
  }
  if (action === "aggregate") {
    const docs = runAggregate(c, body.pipeline ?? []);
    return json({ ok: true, count: docs.length, docs });
  }
  return error("unknown action");
};