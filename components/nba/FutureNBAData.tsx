"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Mount the original NBA page only after its slate-specific data routing is
 * active. The original component and its entire layout remain unchanged.
 *
 * Shared historical statistics, team definitions and logos remain current;
 * slate-dependent requests resolve to /data/nba/next instead.
 */
const FUTURE_FILES = new Set([
  "slate.json",
  "player_matchups.json",
  "betting_projections.json",
  "team_projections.json",
  "live_team_markets.json",
  "player_prop_markets.json",
  "injuries.json",
]);

export default function FutureNBAData({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    const redirectedFetch: typeof window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const parsed = new URL(url, window.location.origin);
      const match = /^\/data\/nba\/([^/]+)$/.exec(parsed.pathname);
      if (match && FUTURE_FILES.has(match[1])) {
        parsed.pathname = `/data/nba/next/${match[1]}`;
        const nextUrl = parsed.pathname + parsed.search + parsed.hash;
        if (typeof input === "string") return originalFetch.call(window, nextUrl, init);
        if (input instanceof URL) return originalFetch.call(window, new URL(nextUrl, window.location.origin), init);
        return originalFetch.call(window, new Request(new URL(nextUrl, window.location.origin), input), init);
      }
      return originalFetch.call(window, input, init);
    };
    window.fetch = redirectedFetch;
    setReady(true);
    return () => {
      setReady(false);
      if (window.fetch === redirectedFetch) window.fetch = originalFetch;
    };
  }, []);

  return ready ? <>{children}</> : null;
}
