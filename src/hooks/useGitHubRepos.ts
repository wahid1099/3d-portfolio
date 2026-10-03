import { useEffect, useState } from "react";

export type Repo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  fork: boolean;
  archived: boolean;
};

// Hit the Netlify Function at /api/github which proxies api.github.com
// server-side. Avoids CORS, gets a 30-min server cache, and keeps the repo list
// fresh without exposing a token.
const ENDPOINT = "/api/github";
const CACHE_KEY = "gh:repos:v2";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6h

type Cached<T> = { ts: number; data: T };

function readCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Cached<T>;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data } satisfies Cached<T>));
  } catch {
    /* quota or disabled — ignore */
  }
}

export type UseReposState = {
  repos: Repo[];
  loading: boolean;
  error: string | null;
  source: "live" | "cache" | "fallback";
};

const FALLBACK_REPOS: Repo[] = [
  {
    id: -1,
    name: "ReliefLink",
    html_url: "https://github.com/wahid1099",
    description: "Offline-first emergency messaging over a Bluetooth mesh.",
    language: "Dart",
    stargazers_count: 0,
    forks_count: 0,
    topics: ["flutter", "bluetooth", "mesh"],
    updated_at: "",
    fork: false,
    archived: false,
  },
  {
    id: -2,
    name: "Seller Commerce OS",
    html_url: "https://github.com/wahid1099",
    description: "Order, customer and sales tracking for FB / IG sellers via Messenger and WhatsApp.",
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    topics: ["nodejs", "postgres", "meta-apis"],
    updated_at: "",
    fork: false,
    archived: false,
  },
  {
    id: -3,
    name: "AI Content CMS",
    html_url: "https://github.com/wahid1099",
    description: "CMS that generates, rewrites, summarizes and SEO-optimizes content.",
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    topics: ["react", "nodejs", "llm"],
    updated_at: "",
    fork: false,
    archived: false,
  },
  {
    id: -4,
    name: "Portfolio API",
    html_url: "https://github.com/wahid1099",
    description: "REST API serving projects with media, tech tags, links and timestamps.",
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    topics: ["express", "postgres", "rest"],
    updated_at: "",
    fork: false,
    archived: false,
  },
];

export function useGitHubRepos(): UseReposState {
  const [state, setState] = useState<UseReposState>({
    repos: [],
    loading: true,
    error: null,
    source: "fallback",
  });

  useEffect(() => {
    let cancelled = false;

    // 1. Paint cache immediately so the UI never shows a blank grid.
    const cached = readCache<Repo[]>(CACHE_KEY);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({
        repos: cached.data.filter((r) => !r.fork && !r.archived),
        loading: true,
        error: null,
        source: "cache",
      });
    }

    // 2. Fetch fresh data from Netlify Function.
    fetch(ENDPOINT)
      .then(async (r) => {
        const ctype = r.headers.get("content-type") ?? "";
        if (!r.ok || !ctype.includes("application/json")) {
          throw new Error(`GitHub proxy ${r.status} ${ctype || "non-json"}`);
        }
        const data = (await r.json()) as Repo[];
        return data.filter((x) => !x.fork && !x.archived);
      })
      .then((data) => {
        if (cancelled) return;
        writeCache(CACHE_KEY, data);
        setState({ repos: data, loading: false, error: null, source: "live" });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        const fromCache = readCache<Repo[]>(CACHE_KEY);
        if (fromCache) {
          setState({ repos: fromCache.data, loading: false, error: err.message, source: "cache" });
        } else {
          setState({ repos: FALLBACK_REPOS, loading: false, error: err.message, source: "fallback" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Curated repo override — wins over the live list for hand-picked entries. */
export const curatedRepos = [
  {
    name: "ReliefLink",
    kind: "Mobile · Offline-first",
    desc: "Emergency messaging that keeps working without internet, relayed over a Bluetooth mesh.",
    tech: ["Flutter", "flutter_blue_plus", "GATT"],
    url: "https://github.com/wahid1099",
  },
  {
    name: "Seller Commerce OS",
    kind: "SaaS · In progress",
    desc: "Order, customer and sales tracking for Facebook and Instagram sellers via Messenger and WhatsApp.",
    tech: ["Node.js", "PostgreSQL", "Meta APIs"],
    url: "https://github.com/wahid1099",
  },
];