import { useEffect, useState } from "react";

export type LeetCodeStats = {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;
  streakDays: number;
};

const ENDPOINT = "https://leetcode-stats-api.herokuapp.com/wahidahmed890";
const CACHE_KEY = "lc:stats:wahidahmed890:v1";
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12h

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

    fetch(ENDPOINT)
      .then(async (r) => {
        if (!r.ok) throw new Error(`LeetCode API ${r.status}`);
        const raw = (await r.json()) as Record<string, number | string>;
        // The heroku API returns "status: "success"" and "totalSolved" etc.
        if (raw.status && raw.status !== "success") {
          throw new Error("LeetCode API status: " + raw.status);
        }
        return {
          totalSolved: Number(raw.totalSolved ?? 0),
          easySolved: Number(raw.easySolved ?? 0),
          mediumSolved: Number(raw.mediumSolved ?? 0),
          hardSolved: Number(raw.hardSolved ?? 0),
          ranking: Number(raw.ranking ?? 0),
          contributionPoints: Number(raw.contributionPoints ?? 0),
          reputation: Number(raw.reputation ?? 0),
          streakDays: cached?.data.streakDays ?? 300,
        } satisfies LeetCodeStats;
      })
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
    };
  }, []);

  return state;
}