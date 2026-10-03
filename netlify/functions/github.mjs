// netlify/functions/github.mjs
// Netlify v2 function. Proxies GitHub REST API for wahid1099's public repos.
// Server-side fetch avoids CORS, gets a 30-min cache, no token exposure.

const USER = "wahid1099";
const ENDPOINT = `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`;

let cache = { ts: 0, data: null };
const TTL = 1000 * 60 * 30;

export default async () => {
  const now = Date.now();
  if (cache.data && now - cache.ts < TTL) {
    return Response.json(cache.data, {
      headers: { "x-data-source": "cache", "cache-control": "public, max-age=1800" },
    });
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
    return Response.json(filtered, {
      headers: { "x-data-source": "live", "cache-control": "public, max-age=1800" },
    });
  } catch (err) {
    return Response.json(
      { error: String(err), source: "snapshot" },
      { status: 502, headers: { "x-data-source": "snapshot" } },
    );
  }
};