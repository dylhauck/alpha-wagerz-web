"use client";
import React from "react";

type PlayerProp = {
  player_name: string;
  player_id: string | null;
  team: string | null;
  position: string | null;

  prop_type: string;
  label: string;

  line: number;
  projection: number | null;
  difference: number | null;
  edge_percent: number | null;

  pick: "OVER" | "UNDER" | null;

  over_odds: number | null;
  under_odds: number | null;
  yes_odds: number | null;
  no_odds: number | null;

  sportsbook: string | null;
  market_name: string | null;
};

type PlayerPropsResponse = {
  ok: boolean;

  player?: {
    player_name: string;
    player_id: string | null;
    team: string | null;
    position: string | null;
  };

  game?: {
    event_id: string;
    game_id: string | null;
    slate: "current" | "next";
  };

  counts?: {
    props: number;
    projections_loaded: number;
  };

  props?: PlayerProp[];

  error?: string;
};

type PlayerPropsModalProps = {
  open: boolean;
  onClose: () => void;

  playerName: string | null;
  playerId?: string | null;
  team?: string | null;
  position?: string | null;

  eventId?: string | null;
  gameId?: string | null;

  slate?: "current" | "next";
};

function formatOdds(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}

function PickBadge({
  pick,
}: {
  pick: "OVER" | "UNDER" | null;
}) {
  if (!pick) {
    return (
      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        No Pick
      </span>
    );
  }

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
        pick === "OVER"
          ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
          : "border-pink-300/30 bg-pink-300/10 text-pink-200"
      }`}
    >
      {pick}
    </span>
  );
}

function PropCard({
  prop,
}: {
  prop: PlayerProp;
}) {
  const isAnytimeTd =
    prop.prop_type === "anytime_touchdown";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">
            {prop.label}
          </div>

          <div className="mt-1 text-xs font-bold text-slate-500">
            {prop.sportsbook || "Sportsbook"}
          </div>
        </div>

        <PickBadge pick={prop.pick} />
      </div>

      {isAnytimeTd ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Yes
            </div>

            <div className="mt-1 text-lg font-black text-white">
              {formatOdds(prop.yes_odds)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              No
            </div>

            <div className="mt-1 text-lg font-black text-white">
              {formatOdds(prop.no_odds)}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Line
              </div>

              <div className="mt-1 text-lg font-black text-white">
                {formatNumber(prop.line)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Projection
              </div>

              <div className="mt-1 text-lg font-black text-cyan-200">
                {formatNumber(prop.projection)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Difference
              </div>

              <div className="mt-1 text-lg font-black text-white">
                {prop.difference === null
                  ? "—"
                  : prop.difference > 0
                    ? `+${formatNumber(prop.difference)}`
                    : formatNumber(prop.difference)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Edge
              </div>

              <div className="mt-1 text-lg font-black text-white">
                {prop.edge_percent === null
                  ? "—"
                  : `${prop.edge_percent > 0 ? "+" : ""}${prop.edge_percent.toFixed(
                      1
                    )}%`}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-cyan-200">
                  Over {formatNumber(prop.line)}
                </span>

                <span className="text-sm font-black text-white">
                  {formatOdds(prop.over_odds)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-pink-300/15 bg-pink-300/[0.06] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-pink-200">
                  Under {formatNumber(prop.line)}
                </span>

                <span className="text-sm font-black text-white">
                  {formatOdds(prop.under_odds)}
                </span>
              </div>
            </div>
          </div>

          {prop.pick ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Alpha Pick
              </div>

              <div
                className={`mt-1 text-xl font-black ${
                  prop.pick === "OVER"
                    ? "text-cyan-200"
                    : "text-pink-200"
                }`}
              >
                {prop.pick} {formatNumber(prop.line)}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function PlayerPropsModal({
  open,
  onClose,
  playerName,
  playerId,
  team,
  position,
  eventId,
  gameId,
  slate = "current",
}: PlayerPropsModalProps) {
  const [data, setData] =
    React.useState<PlayerPropsResponse | null>(
      null
    );

  const [loading, setLoading] =
    React.useState(false);

  React.useEffect(() => {
    if (!open || !playerName || !eventId) {
      return;
    }

    let cancelled = false;

    async function loadProps() {
      setLoading(true);
      setData(null);

      try {
        const response = await fetch(
          "/api/nfl/player-props",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              player: playerName,
              player_id: playerId || undefined,
              team: team || undefined,
              position:
                position || undefined,
              event_id: eventId,
              game_id: gameId || undefined,
              slate,
            }),
          }
        );

        const json =
          (await response.json()) as PlayerPropsResponse;

        if (!cancelled) {
          setData(json);
        }
      } catch (error) {
        if (!cancelled) {
          setData({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load player props.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProps();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    playerName,
    playerId,
    team,
    position,
    eventId,
    gameId,
    slate,
  ]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const props = data?.props ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="glass max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/70">
              Alpha Wagerz NFL
            </div>

            <h2 className="mt-2 truncate text-2xl font-black text-white sm:text-3xl">
              {playerName}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
              {data?.player?.team ||
              team ? (
                <span>
                  {data?.player?.team ||
                    team}
                </span>
              ) : null}

              {(data?.player?.team ||
                team) &&
              (data?.player?.position ||
                position) ? (
                <span>•</span>
              ) : null}

              {data?.player?.position ||
              position ? (
                <span>
                  {data?.player?.position ||
                    position}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xl font-black text-slate-300 transition hover:border-pink-300/40 hover:text-white"
            aria-label="Close player props"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(88vh-110px)] overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />

                <div className="mt-4 text-sm font-black text-slate-300">
                  Loading sportsbook lines...
                </div>
              </div>
            </div>
          ) : !eventId ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-center">
              <div className="text-sm font-black text-amber-200">
                No sportsbook event is linked to this game.
              </div>
            </div>
          ) : data && !data.ok ? (
            <div className="rounded-2xl border border-pink-300/20 bg-pink-300/[0.06] p-5 text-center">
              <div className="text-sm font-black text-pink-200">
                Unable to load player props
              </div>

              <div className="mt-2 text-xs text-slate-400">
                {data.error}
              </div>
            </div>
          ) : props.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="text-lg font-black text-white">
                No Player Props Available
              </div>

              <p className="mt-2 text-sm text-slate-400">
                No sportsbook player-stat lines are currently available for{" "}
                {playerName}.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-white">
                    Player Prop Markets
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Sportsbook line vs Alpha model projection
                  </div>
                </div>

                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                  {props.length}{" "}
                  {props.length === 1
                    ? "Line"
                    : "Lines"}
                </div>
              </div>

              <div className="grid gap-3">
                {props.map((prop, index) => (
                  <PropCard
                    key={`${prop.sportsbook}-${prop.prop_type}-${prop.line}-${index}`}
                    prop={prop}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}