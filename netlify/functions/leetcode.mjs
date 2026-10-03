// netlify/functions/leetcode.mjs
// Netlify v2 (Edge/Response) function. Proxies the user-facing LeetCode stats
// API. Caches in-memory for 5 minutes (function instance stays warm).
// On upstream failure serves a hand-curated snapshot.

const UPSTREAM = "https://alfa-leetcode-api.onrender.com";
const USER = "wahidahmed890";
const SOLVED = `${UPSTREAM}/${USER}/solved`;
const CONTEST = `${UPSTREAM}/${USER}/contest`;

let cache = { ts: 0, data: null };
const TTL = 1000 * 60 * 5;

const FALLBACK = {
  totalSolved: 1200,
  easySolved: 387,
  mediumSolved: 616,
  hardSolved: 197,
  ranking: 480968,
  contributionPoints: 0,
  reputation: 0,
  contestRating: 1470,
  streakDays: 300,
  source: "snapshot",
  fetchedAt: "2025-09-30T00:00:00.000Z",
};

async function fetchJson(url, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const ct = r.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) throw new Error("upstream non-json");
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export default async () => {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL) {
    return Response.json(cache.data, {
      headers: { "x-data-source": "cache", "cache-control": "public, max-age=300" },
    });
  }

  try {
    const [solved, contest] = await Promise.all([
      fetchJson(SOLVED).catch(() => null),
      fetchJson(CONTEST).catch(() => null),
    ]);

    const ac = Array.isArray(solved?.acSubmissionNum) ? solved.acSubmissionNum : [];
    const find = (d) => ac.find((x) => x.difficulty === d);

    const data = {
      totalSolved: Number(find("All")?.count ?? solved?.solvedProblem ?? 0),
      easySolved: Number(find("Easy")?.count ?? 0),
      mediumSolved: Number(find("Medium")?.count ?? 0),
      hardSolved: Number(find("Hard")?.count ?? 0),
      ranking: Number(contest?.contestGlobalRanking ?? 0),
      contributionPoints: 0,
      reputation: 0,
      contestRating: Math.round(Number(contest?.contestRating ?? 0)),
      streakDays: 300,
      source: "live",
      fetchedAt: new Date().toISOString(),
    };

    cache = { ts: now, data };
    return Response.json(data, {
      headers: { "x-data-source": "live", "cache-control": "public, max-age=300" },
    });
  } catch (err) {
    return Response.json({ ...FALLBACK, error: String(err) }, {
      status: 200,
      headers: { "x-data-source": "snapshot", "cache-control": "public, max-age=60" },
    });
  }
};