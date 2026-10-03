// netlify/functions/github.mjs
// Proxies GitHub REST API for wahid1099's public repos. Server-side fetch avoids
// any client CORS/rate-limit issues. Caches 30 minutes in-memory.

const USER = "wahidah1099";
const ENDPOINT = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;

let cache = { ts: 0, data: null };
const TTL = 1000 * 60 * 30; // 30 minutes

export default async () => {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL) {
    return json(cache.data, "cache");
  }

  try {
    const r = await fetch(ENDPOINT, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "md-wahid-portfolio",
      },
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const data = await r.json();
    const filtered = data
      .filter((x) => !x.fork && !x.archived)
      .map((x) => ({
        id: x.id,
        name: x.name,
        html_url: x.html_url,
        description: x.description,
        language: x.language,
        stargazers_count: x.stargazers_count,
        forks_count: x.forks_count,
        topics: x.topics ?? [],
        updated_at: x.updated_at,
        fork: x.fork,
        archived: x.archived,
      }));
    cache = { ts: now, data: filtered };
    return json(filtered, "live");
  } catch (err) {
    return json({ error: String(err), source: "snapshot" }, "snapshot", 502);
  }
};

function json(body, kind, status = 200) {
  return {
    statusCode: status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=1800",
      "x-data-source": kind,
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify(body),
  };
}