"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type RankedRow = {
  ranking_type?: "game_bet" | "player_prop" | string;
  tier?: string;
  ranking_score?: number;
  confidence?: number;
  edge_strength?: number;
  edge?: number;
  market_type?: string;
  prop_type?: string;
  game_id?: string;
  matchup?: string;
  away_team?: string;
  home_team?: string;
  player_name?: string;
  team?: string;
  position?: string;
  pick?: string;
  line?: number | string;
  odds?: number | string;
  sportsbook?: string;
  projection?: number | string;
};

type ProjectionGame = {
  game_id?: string;
  away_team?: string;
  home_team?: string;
  away_projected_points?: number;
  home_projected_points?: number;
  projected_away_points?: number;
  projected_home_points?: number;
  projected_total?: number;
  projected_margin?: number;
  projection_confidence?: number;
  confidence?: number;
  win_probability?: {
    away?: number;
    home?: number;
  };
  away_win_probability?: number;
  home_win_probability?: number;
};

function rows(payload: any, key: string): RankedRow[] {
  return Array.isArray(payload?.[key]) ? payload[key] : [];
}

function projectionGames(payload: any): ProjectionGame[] {
  if (Array.isArray(payload)) return payload;

  for (const key of ["games", "projections", "data"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmt(value: unknown, digits = 1) {
  const n = num(value);
  return n === null ? "—" : n.toFixed(digits);
}

function percent(value: unknown) {
  const n = num(value);
  if (n === null) return "—";

  const normalized = n <= 1 ? n * 100 : n;

  return `${normalized.toFixed(1)}%`;
}

function tierClass(tier?: string) {
  switch ((tier || "").toUpperCase()) {
    case "BEST BET":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
    case "STRONG PLAY":
      return "border-sky-400/40 bg-sky-400/10 text-sky-300";
    case "LEAN":
      return "border-amber-400/40 bg-amber-400/10 text-amber-300";
    default:
      return "border-slate-700 bg-slate-900 text-slate-300";
  }
}

function labelFor(row: RankedRow) {
  if (row.ranking_type === "player_prop") {
    return (row.prop_type || "Player Prop").replaceAll("_", " ");
  }

  return (row.market_type || "Game Bet").replaceAll("_", " ");
}

export default function NFLProjectionsPage() {
  const [view, setView] = useState<"current" | "next">("current");
  const [rankings, setRankings] = useState<any>({});
  const [gameProjections, setGameProjections] = useState<ProjectionGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      const prefix = view === "current" ? "/data/nfl" : "/data/nfl/next";

      try {
        const [rankingRes, gameRes] = await Promise.all([
          fetch(`${prefix}/rankings.json`, { cache: "no-store" }),
          fetch(`${prefix}/game_projections.json`, { cache: "no-store" }),
        ]);

        const rankingPayload = rankingRes.ok ? await rankingRes.json() : {};
        const gamePayload = gameRes.ok ? await gameRes.json() : {};

        if (!cancelled) {
          setRankings(rankingPayload);
          setGameProjections(projectionGames(gamePayload));
        }
      } catch {
        if (!cancelled) {
          setRankings({});
          setGameProjections([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [view]);

  const bestBets = useMemo(() => rows(rankings, "best_bets"), [rankings]);
  const strongPlays = useMemo(() => rows(rankings, "strong_plays"), [rankings]);
  const leans = useMemo(() => rows(rankings, "leans"), [rankings]);

  return (
    <AppShell>
      <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1700px] space-y-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Alpha Wagerz NFL
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Alpha Projections
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-slate-400">
                Independent NFL model projections compared with live sportsbook markets.
                No forced picks — recommendations only appear when the modeled edge qualifies.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
              {(["current", "next"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    view === option
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-400"
                  }`}
                >
                  {option === "current" ? "Current Slate" : "Next Slate"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-slate-400">
              Loading Alpha projections…
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Best Bets" value={bestBets.length} />
                <SummaryCard label="Strong Plays" value={strongPlays.length} />
                <SummaryCard label="Leans" value={leans.length} />
              </div>

              <RecommendationSection
                title="Best Bets"
                subtitle="Highest-confidence qualifying model edges."
                rows={bestBets}
              />

              <RecommendationSection
                title="Strong Plays"
                subtitle="Strong edges that clear the secondary ranking threshold."
                rows={strongPlays}
              />

              <RecommendationSection
                title="Leans"
                subtitle="Lower-confidence qualifying edges worth monitoring."
                rows={leans}
              />

              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-black">Game Projections</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Sportsbook-independent projected game environments.
                  </p>
                </div>

                {gameProjections.length === 0 ? (
                  <Empty text="No game projections are available for this slate." />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {gameProjections.map((game, index) => {
                      const awayPoints =
                        game.away_projected_points ??
                        game.projected_away_points;

                      const homePoints =
                        game.home_projected_points ??
                        game.projected_home_points;

                      const projectedTotal =
                        game.projected_total ??
                        ((num(awayPoints) ?? 0) + (num(homePoints) ?? 0));

                      const projectedMargin =
                        game.projected_margin ??
                        ((num(homePoints) ?? 0) - (num(awayPoints) ?? 0));

                      const awayWin =
                        game.win_probability?.away ??
                        game.away_win_probability;

                      const homeWin =
                        game.win_probability?.home ??
                        game.home_win_probability;

                      return (
                        <article
                          key={game.game_id || `${game.away_team}-${game.home_team}-${index}`}
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                        >
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                            <TeamProjection
                              team={game.away_team || "AWAY"}
                              points={awayPoints}
                              winProbability={awayWin}
                            />

                            <div className="text-center">
                              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                                Projected
                              </div>
                              <div className="mt-1 text-lg font-black text-slate-300">
                                @
                              </div>
                            </div>

                            <TeamProjection
                              team={game.home_team || "HOME"}
                              points={homePoints}
                              winProbability={homeWin}
                              align="right"
                            />
                          </div>

                          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
                            <SmallStat label="Total" value={fmt(projectedTotal)} />
                            <SmallStat
                              label="Home Margin"
                              value={`${(num(projectedMargin) ?? 0) > 0 ? "+" : ""}${fmt(
                                projectedMargin,
                              )}`}
                            />
                            <SmallStat
                              label="Confidence"
                              value={percent(
                                game.projection_confidence ??
                                  game.confidence,
                              )}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function RecommendationSection({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: RankedRow[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <Empty text={`No ${title.toLowerCase()} qualify on this slate.`} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row, index) => (
            <article
              key={`${row.game_id}-${row.player_name || row.pick}-${index}`}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tierClass(
                        row.tier,
                      )}`}
                    >
                      {row.tier || title}
                    </span>

                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      {row.ranking_type === "player_prop" ? "Player Prop" : "Game Bet"}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black">
                    {row.player_name ? `${row.player_name} — ` : ""}
                    {row.pick || "Model Recommendation"}
                  </h3>

                  <div className="mt-1 text-sm capitalize text-slate-400">
                    {labelFor(row)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Confidence
                  </div>
                  <div className="text-xl font-black text-emerald-300">
                    {fmt(row.confidence, 1)}
                  </div>
                </div>
              </div>

              {(row.away_team || row.home_team) && (
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-300">
                  <NFLTeamLogo team={row.away_team || ""} size={24} />
                  <span>{row.away_team || "—"}</span>
                  <span className="text-slate-600">@</span>
                  <NFLTeamLogo team={row.home_team || ""} size={24} />
                  <span>{row.home_team || "—"}</span>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SmallStat label="Projection" value={fmt(row.projection)} />
                <SmallStat label="Book Line" value={String(row.line ?? "—")} />
                <SmallStat label="Odds" value={String(row.odds ?? "—")} />
                <SmallStat label="Edge" value={fmt(row.edge, 2)} />
                <SmallStat label="Sportsbook" value={String(row.sportsbook ?? "—")} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TeamProjection({
  team,
  points,
  winProbability,
  align = "left",
}: {
  team: string;
  points: unknown;
  winProbability: unknown;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      {align === "left" && <NFLTeamLogo team={team} size={42} />}

      <div className="min-w-0">
        <div className="font-black">{team}</div>
        <div className="text-2xl font-black">{fmt(points)}</div>
        <div className="text-xs text-slate-500">
          Win {percent(winProbability)}
        </div>
      </div>

      {align === "right" && <NFLTeamLogo team={team} size={42} />}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/80 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-extrabold text-slate-200">
        {value}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}
