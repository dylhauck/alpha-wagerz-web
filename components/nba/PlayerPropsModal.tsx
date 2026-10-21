"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type PlayerProjection = {
  player_id?: number | string;
  player_name?: string;
  team?: string;
  position?: string;
  projection?: Record<string, number | null>;
};

type ProjectionGame = {
  game_id?: string | number;
  away_team?: string;
  home_team?: string;
  player_projections?: {
    away?: PlayerProjection[];
    home?: PlayerProjection[];
  };
};

type ProjectionPayload = {
  games?: ProjectionGame[];
};

type PropMarket = {
  player_id?: string | number;
  player_name?: string;
  team?: string;
  prop_type?: string;
  line?: number;
  over_odds?: number | null;
  under_odds?: number | null;
  sportsbook?: string;
};

type MarketPayload = {
  props?: PropMarket[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  playerName: string | null;
  playerId?: string | number | null;
  team?: string | null;
  position?: string | null;
};

const PROP_TYPES = [
  { key: "pts", label: "Points" },
  { key: "reb", label: "Rebounds" },
  { key: "ast", label: "Assists" },
  { key: "fg3m", label: "Three-Pointers Made" },
  { key: "pra", label: "Points + Rebounds + Assists" },
  { key: "pr", label: "Points + Rebounds" },
  { key: "pa", label: "Points + Assists" },
  { key: "ra", label: "Rebounds + Assists" },
  { key: "stl", label: "Steals" },
  { key: "blk", label: "Blocks" },
  { key: "tov", label: "Turnovers" },
];

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function format(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "—";
}

function formatOdds(value?: number | null) {
  if (typeof value !== "number") return "—";
  return value > 0 ? `+${value}` : String(value);
}

export default function PlayerPropsModal({
  open,
  onClose,
  playerName,
  playerId,
  team,
  position,
}: Props) {
  const [projection, setProjection] =
    useState<PlayerProjection | null>(null);

  const [markets, setMarkets] =
    useState<PropMarket[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !playerName) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setProjection(null);
      setMarkets([]);

      try {
        const [projectionResponse, marketResponse] =
          await Promise.all([
            fetch("/data/nba/betting_projections.json", {
              cache: "no-store",
            }),
            fetch("/data/nba/player_prop_markets.json", {
              cache: "no-store",
            }),
          ]);

        const projectionJson: ProjectionPayload =
          projectionResponse.ok
            ? await projectionResponse.json()
            : {};

        const marketJson: MarketPayload =
          marketResponse.ok
            ? await marketResponse.json()
            : {};

        const allPlayers =
          (projectionJson.games ?? []).flatMap((game) => [
            ...(game.player_projections?.away ?? []),
            ...(game.player_projections?.home ?? []),
          ]);

        const selectedPlayer = allPlayers.find((player) => {
          if (
            playerId != null &&
            player.player_id != null &&
            String(player.player_id) === String(playerId)
          ) {
            return true;
          }

          return (
            normalize(player.player_name) ===
              normalize(playerName) &&
            (!team ||
              normalize(player.team) === normalize(team))
          );
        });

        const playerMarkets = (marketJson.props ?? []).filter(
          (market) => {
            if (
              playerId != null &&
              market.player_id != null &&
              String(market.player_id) === String(playerId)
            ) {
              return true;
            }

            return (
              normalize(market.player_name) ===
                normalize(playerName) &&
              (!team ||
                !market.team ||
                normalize(market.team) === normalize(team))
            );
          },
        );

        if (!cancelled) {
          setProjection(selectedPlayer ?? null);
          setMarkets(playerMarkets);
        }
      } catch {
        if (!cancelled) {
          setProjection(null);
          setMarkets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, playerName, playerId, team]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${playerName ?? "Player"} betting props`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-cyan-300/20 bg-slate-950 shadow-[0_0_60px_rgba(34,211,238,0.12)]">
        <div className="flex items-start justify-between border-b border-white/10 p-5 sm:p-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              Alpha Wagerz NBA
            </div>

            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
              {playerName}
            </h2>

            <p className="mt-1 text-sm font-bold text-slate-400">
              {[team, position].filter(Boolean).join(" · ")}
            </p>

            <p className="mt-2 text-xs font-black uppercase tracking-widest text-pink-200">
              Player Props & Alpha Projections
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close player props"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white hover:border-pink-300/50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Loading player projections...
            </div>
          ) : !projection ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 text-center text-amber-100">
              No active game projection is available for this player.
              Alpha projections are generated for players in the
              current NBA slate.
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-xs font-bold text-slate-300">
                Alpha selections compare the model projection with
                the available sportsbook line. A projection
                difference is not a calibrated betting edge.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {PROP_TYPES.map(({ key, label }) => {
                  const value = projection.projection?.[key];

                  const matchingMarkets = markets.filter(
                    (market) => normalize(market.prop_type) === key,
                  );

                  const bestMarket =
  matchingMarkets.length > 0
    ? matchingMarkets.reduce((best, market) => {
        if (typeof value !== "number") return best;

        if (typeof market.line !== "number") return best;
        if (typeof best.line !== "number") return market;

        const bestDifference = Math.abs(value - best.line);
        const marketDifference = Math.abs(value - market.line);

        return marketDifference > bestDifference
          ? market
          : best;
      })
    : null;

const displayedMarkets = [bestMarket];

                  return displayedMarkets.map((market, index) => {
                    const line = market?.line;

                    const difference =
                      typeof value === "number" &&
                      typeof line === "number"
                        ? value - line
                        : null;

                    const pick =
                      difference === null || difference === 0
                        ? null
                        : difference > 0
                          ? "OVER"
                          : "UNDER";

                    return (
                      <div
                        key={`${key}-${market?.sportsbook ?? "none"}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-black text-white">
                            {label}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                              Alpha Projection
                            </div>

                            <div className="mt-1 text-2xl font-black text-cyan-200">
                              {format(value)}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                              Sportsbook Line
                            </div>

                            <div className="mt-1 text-2xl font-black text-white">
                              {format(line)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                          <div>
                            <div className="text-[10px] font-black uppercase text-slate-500">
                              Projection Difference
                            </div>

                            <div className="mt-1 text-sm font-black text-white">
                              {difference === null
                                ? "—"
                                : `${difference > 0 ? "+" : ""}${format(difference)}`}
                            </div>
                          </div>

                          {pick ? (
                            <span
                              className={`rounded-full border px-4 py-2 text-xs font-black ${
                                pick === "OVER"
                                  ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                                  : "border-pink-300/30 bg-pink-300/10 text-pink-200"
                              }`}
                            >
                              ALPHA {pick} {format(line)}
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-slate-400">
                              {typeof value === "number"
                                ? "AWAITING MARKET"
                                : "UNAVAILABLE"}
                            </span>
                          )}
                        </div>

                        {market && (
                          <div className="mt-3 flex gap-4 text-xs font-bold text-slate-400">
                            <span>
                              Over: {formatOdds(market.over_odds)}
                            </span>
                            <span>
                              Under: {formatOdds(market.under_odds)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}