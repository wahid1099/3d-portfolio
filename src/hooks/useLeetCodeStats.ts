import { useEffect, useState } from "react";

export type LeetCodeStats = {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;
  contestRating: number;
  streakDays: number;
};

/**
 * Calls the Netlify Function at /api/leetcode which proxies the upstream
 * LeetCode API and returns { totalSolved, easy/medium/hard, contestRating, ranking, ... }.
 * The function lives server-side, so:
 *   - upstream cold-starts never reach the browser
 *   - 5-min server-side cache means a fresh hit on every revisit
 *   - a hand-curated snapshot is served if the upstream is fully down
 */
const ENDPOINT = "/api/leetcode";
const CACHE_KEY = "lc:stats:v4";
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
    /* ignore */
  }
}

export type UseStatsState = {
  stats: LeetCodeStats | null;
  loading: boolean;
  error: string | null;
  source: "live" | "cache" | "fallback";
};

const FALLBACK: LeetCodeStats = {
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  ranking: 0,
  contributionPoints: 0,
  reputation: 0,
  contestRating: 0,
  streakDays: 300,
};

export function useLeetCodeStats(): UseStatsState {
  const [state, setState] = useState<UseStatsState>({
    stats: null,
    loading: true,
    error: null,
    source: "fallback",
  });

  useEffect(() => {
    let cancelled = false;
    const cached = readCache<LeetCodeStats>(CACHE_KEY);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState({ stats: cached.data, loading: true, error: null, source: "cache" });
    }

    async function fetchFromApi(signal: AbortSignal): Promise<LeetCodeStats> {
      const r = await fetch(ENDPOINT, { signal });
      const ctype = r.headers.get("content-type") ?? "";
      const text = await r.text();
      if (!r.ok || !ctype.includes("application/json")) {
        throw new Error(`api ${r.status} ${ctype || "non-json"}`);
      }
      const raw = JSON.parse(text) as Record<string, number | string>;
      return {
        totalSolved: Number(raw.totalSolved ?? 0),
        easySolved: Number(raw.easySolved ?? 0),
        mediumSolved: Number(raw.mediumSolved ?? 0),
        hardSolved: Number(raw.hardSolved ?? 0),
        ranking: Number(raw.ranking ?? 0),
        contributionPoints: Number(raw.contributionPoints ?? 0),
        reputation: Number(raw.reputation ?? 0),
        contestRating: Number(raw.contestRating ?? 0),
        streakDays: Number(raw.streakDays ?? cached?.data.streakDays ?? 300),
      };
    }

    const ctrl = new AbortController();

    fetchFromApi(ctrl.signal)
      .then((data) => {
        if (cancelled) return;
        writeCache(CACHE_KEY, data);
        setState({ stats: data, loading: false, error: null, source: "live" });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        const fromCache = readCache<LeetCodeStats>(CACHE_KEY);
        if (fromCache) {
          setState({ stats: fromCache.data, loading: false, error: err.message, source: "cache" });
        } else {
          setState({ stats: FALLBACK, loading: false, error: err.message, source: "fallback" });
        }
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  return state;
}