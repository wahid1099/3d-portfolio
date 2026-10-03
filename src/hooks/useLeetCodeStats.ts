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
 * Two-part fetch against alfa-leetcode-api.onrender.com:
 *   /<user>/solved       → solved problem counts by tier + AC submissions
 *   /<user>/contest      → contest rating (optional, fallback 1500)
 * We use the AC (accepted) count from /solved which equals the "problems solved"
 * number LeetCode shows on the profile.
 */
const BASE = "https://alfa-leetcode-api.onrender.com";
const USER = "wahidahmed890";
const SOLVED_URL = `${BASE}/${USER}/solved`;
const CONTEST_URL = `${BASE}/${USER}/contest`;
const CACHE_KEY = "lc:stats:v3";
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

    async function fetchSolved(signal: AbortSignal): Promise<Partial<LeetCodeStats>> {
      const r = await fetch(SOLVED_URL, { signal });
      // The Heroku app that we used previously kept returning HTML error pages,
      // so guard against HTML 200s explicitly.
      const ctype = r.headers.get("content-type") ?? "";
      const text = await r.text();
      if (!r.ok || !ctype.includes("application/json")) {
        throw new Error(`LeetCode /solved: ${r.status} ${ctype || "non-json"}`);
      }
      const raw = JSON.parse(text);
      const ac = Array.isArray(raw.acSubmissionNum) ? raw.acSubmissionNum : [];
      const find = (d: string) => ac.find((x: { difficulty: string }) => x.difficulty === d);
      const acAll = find("All");
      return {
        totalSolved: Number(acAll?.count ?? raw.solvedProblem ?? 0),
        easySolved: Number(find("Easy")?.count ?? 0),
        mediumSolved: Number(find("Medium")?.count ?? 0),
        hardSolved: Number(find("Hard")?.count ?? 0),
      };
    }

    async function fetchContest(signal: AbortSignal): Promise<Partial<LeetCodeStats>> {
      try {
        const r = await fetch(CONTEST_URL, { signal });
        const ctype = r.headers.get("content-type") ?? "";
        if (!r.ok || !ctype.includes("application/json")) return {};
        const raw = (await r.json()) as Record<string, number | string>;
        return {
          contestRating: Math.round(Number(raw.rating ?? 0)),
        };
      } catch {
        return {};
      }
    }

    const ctrl = new AbortController();

    Promise.all([fetchSolved(ctrl.signal), fetchContest(ctrl.signal)])
      .then(([solved, contest]) => {
        if (cancelled) return;
        if (!solved || typeof solved.totalSolved !== "number") {
          throw new Error("LeetCode /solved: empty response");
        }
        const data: LeetCodeStats = {
          totalSolved: solved.totalSolved ?? 0,
          easySolved: solved.easySolved ?? 0,
          mediumSolved: solved.mediumSolved ?? 0,
          hardSolved: solved.hardSolved ?? 0,
          ranking: 0,
          contributionPoints: 0,
          reputation: 0,
          contestRating: contest.contestRating ?? 0,
          streakDays: cached?.data.streakDays ?? 300,
        };
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