"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type NFLTeam = {
  abbr?: string;
  name?: string;
  logo?: string;
};

type NFLGame = {
  game_id?: string | number;
  game?: string;
  away_team?: string;
  home_team?: string;
  away_abbr?: string;
  home_abbr?: string;
  game_datetime?: string;
  game_datetime_utc?: string;
  game_date?: string;
  game_time?: string;
};

type RankedRow = {
  ranking_type?:
    | "game_bet"
    | "player_prop"
    | string;

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
  game_id?: string | number;

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

function rows(
  payload: any,
  key: string,
): RankedRow[] {
  return Array.isArray(payload?.[key])
    ? payload[key]
    : [];
}

function projectionGames(
  payload: any,
): ProjectionGame[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of [
    "games",
    "projections",
    "data",
  ]) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

function slateGames(
  payload: any,
): NFLGame[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.games)
    ? payload.games
    : [];
}

function num(value: unknown) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function fmt(
  value: unknown,
  digits = 1,
) {
  const n = num(value);

  return n === null
    ? "—"
    : n.toFixed(digits);
}

function percent(value: unknown) {
  const n = num(value);

  if (n === null) {
    return "—";
  }

  const normalized =
    n <= 1 ? n * 100 : n;

  return `${normalized.toFixed(1)}%`;
}

function signed(
  value: unknown,
  digits = 1,
) {
  const n = num(value);

  if (n === null) {
    return "—";
  }

  return `${n > 0 ? "+" : ""}${n.toFixed(
    digits,
  )}`;
}

function americanOdds(
  probability: unknown,
) {
  const raw = num(probability);

  if (raw === null) {
    return "—";
  }

  const p =
    raw > 1
      ? raw / 100
      : raw;

  if (p <= 0 || p >= 1) {
    return "—";
  }

  const odds =
    p >= 0.5
      ? -100 * (p / (1 - p))
      : 100 * ((1 - p) / p);

  const rounded =
    Math.round(odds);

  return rounded > 0
    ? `+${rounded}`
    : String(rounded);
}

function normalizeTeamCode(
  value?: string,
) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function sameTeam(
  a?: string,
  b?: string,
) {
  const left =
    normalizeTeamCode(a);

  const right =
    normalizeTeamCode(b);

  if (left === right) {
    return true;
  }

  const aliases: Record<
    string,
    string
  > = {
    JAC: "JAX",
    JAX: "JAX",
    LA: "LAR",
    LAR: "LAR",
    WSH: "WAS",
    WAS: "WAS",
  };

  return (
    aliases[left] &&
    aliases[left] === aliases[right]
  );
}

function gameMatches(
  row: RankedRow,
  game: ProjectionGame | NFLGame,
) {
  if (
    row.game_id &&
    game.game_id &&
    String(row.game_id) ===
      String(game.game_id)
  ) {
    return true;
  }

  return (
    sameTeam(
      row.away_team,
      game.away_team,
    ) &&
    sameTeam(
      row.home_team,
      game.home_team,
    )
  );
}

function marketKind(
  row: RankedRow,
):
  | "spread"
  | "moneyline"
  | "total"
  | "other" {
  const value = String(
    row.market_type || "",
  ).toLowerCase();

  if (
    value.includes("spread") ||
    value.includes("handicap")
  ) {
    return "spread";
  }

  if (
    value.includes("moneyline") ||
    value === "ml" ||
    value.includes("money_line")
  ) {
    return "moneyline";
  }

  if (
    value.includes("total") ||
    value.includes("over_under") ||
    value.includes("over/under") ||
    value === "ou"
  ) {
    return "total";
  }

  return "other";
}

function formatGameCardTime(
  game?: NFLGame,
) {
  if (!game) {
    return "TBD";
  }

  if (game.game_time) {
    const [
      hourString,
      minuteString,
    ] =
      game.game_time.split(":");

    const hour =
      Number(hourString);

    const minute =
      Number(minuteString);

    if (
      Number.isFinite(hour) &&
      Number.isFinite(minute)
    ) {
      const period =
        hour >= 12
          ? "PM"
          : "AM";

      const displayHour =
        hour % 12 || 12;

      return `${displayHour}:${String(
        minute,
      ).padStart(2, "0")} ${period}`;
    }
  }

  const raw =
    game.game_datetime_utc ||
    game.game_datetime;

  if (!raw) {
    return "TBD";
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "TBD";
  }

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function NFLLogoGlow({
  team,
  teams,
}: {
  team: string;
  teams: NFLTeam[];
}) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-white/50 blur-xl" />

      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]">
        <NFLTeamLogo
          team={team}
          teams={teams}
          size={28}
        />
      </div>
    </div>
  );
}

function GameSelector({
  games,
  teams,
  selectedId,
  onSelect,
}: {
  games: NFLGame[];
  teams: NFLTeam[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-scroll mt-2 pb-2">
      <div className="flex min-w-max gap-2">
        {games.map(
          (game, index) => {
            const id = String(
              game.game_id ??
                `${game.away_team}-${game.home_team}-${index}`,
            );

            const selected =
              id === selectedId;

            const awayCode =
              game.away_abbr ||
              game.away_team ||
              "AWAY";

            const homeCode =
              game.home_abbr ||
              game.home_team ||
              "HOME";

            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  onSelect(id)
                }
                className={`min-w-[150px] rounded-xl border bg-slate-950/80 px-3 py-2 transition ${
                  selected
                    ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]"
                    : "border-white/10 bg-white/[0.035] hover:border-pink-300/40"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <NFLLogoGlow
                    team={awayCode}
                    teams={teams}
                  />

                  <span className="text-xs font-black text-slate-400">
                    @
                  </span>

                  <NFLLogoGlow
                    team={homeCode}
                    teams={teams}
                  />
                </div>

                <div className="mt-2 text-center text-sm font-black tracking-wide text-white">
                  {formatGameCardTime(
                    game,
                  )}
                </div>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}

function MarketCard({
  title,
  accent,
  marketRow,
  modelValue,
  modelSubtext,
}: {
  title: string;
  accent:
    | "cyan"
    | "pink"
    | "violet";
  marketRow?: RankedRow;
  modelValue: string;
  modelSubtext: string;
}) {
  const accentClasses = {
    cyan: {
      border:
        "border-cyan-300/20",
      bg: "bg-cyan-300/[0.045]",
      label:
        "text-cyan-200/70",
    },
    pink: {
      border:
        "border-pink-300/20",
      bg: "bg-pink-500/[0.045]",
      label:
        "text-pink-200/70",
    },
    violet: {
      border:
        "border-violet-300/20",
      bg: "bg-violet-500/[0.045]",
      label:
        "text-violet-200/70",
    },
  }[accent];

  return (
    <div
      className={`rounded-2xl border ${accentClasses.border} ${accentClasses.bg} p-5`}
    >
      <div
        className={`text-[10px] font-black uppercase tracking-[0.2em] ${accentClasses.label}`}
      >
        {title}
      </div>

      <div className="mt-2 text-2xl font-black text-white">
        {marketRow?.pick ||
          modelValue}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-500">
        {marketRow
          ? `${String(
              marketRow.sportsbook ??
                "Sportsbook",
            )} • ${String(
              marketRow.line ??
                "Line —",
            )} • ${String(
              marketRow.odds ??
                "Odds —",
            )}`
          : modelSubtext}
      </div>

      {marketRow ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SmallStat
            label="Projection"
            value={fmt(
              marketRow.projection,
            )}
          />

          <SmallStat
            label="Edge"
            value={fmt(
              marketRow.edge,
              2,
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

function TeamProjection({
  team,
  teams,
  points,
  winProbability,
  align = "left",
}: {
  team: string;
  teams: NFLTeam[];
  points: unknown;
  winProbability: unknown;
  align?: "left" | "right";
}) {
  const right =
    align === "right";

  return (
    <div
      className={`flex min-w-0 items-center gap-4 ${
        right
          ? "justify-end text-right"
          : ""
      }`}
    >
      {!right ? (
        <NFLTeamLogo
          team={team}
          teams={teams}
          size={64}
        />
      ) : null}

      <div className="min-w-0">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {right
            ? "Home"
            : "Away"}
        </div>

        <div className="mt-1 text-xl font-black text-white">
          {team}
        </div>

        <div className="mt-1 text-4xl font-black neon-text">
          {fmt(points)}
        </div>

        <div className="mt-1 text-sm font-bold text-slate-400">
          Win{" "}
          {percent(
            winProbability,
          )}
        </div>
      </div>

      {right ? (
        <NFLTeamLogo
          team={team}
          teams={teams}
          size={64}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: number;
  accent?:
    | "cyan"
    | "pink"
    | "amber";
}) {
  const valueClass =
    accent === "pink"
      ? "text-pink-200"
      : accent === "amber"
        ? "text-amber-200"
        : "text-cyan-200";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>

      <div
        className={`mt-2 text-3xl font-black ${valueClass}`}
      >
        {value}
      </div>
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
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-black text-white">
        {value}
      </div>
    </div>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}

function tierClass(
  tier?: string,
) {
  switch (
    (tier || "").toUpperCase()
  ) {
    case "BEST BET":
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-200";

    case "STRONG PLAY":
      return "border-pink-300/30 bg-pink-500/10 text-pink-200";

    case "LEAN":
      return "border-amber-300/30 bg-amber-400/10 text-amber-200";

    default:
      return "border-white/10 bg-white/[0.04] text-slate-300";
  }
}

function labelFor(
  row: RankedRow,
) {
  if (
    row.ranking_type ===
    "player_prop"
  ) {
    return (
      row.prop_type ||
      "Player Prop"
    ).replaceAll("_", " ");
  }

  return (
    row.market_type ||
    "Game Bet"
  ).replaceAll("_", " ");
}

function RecommendationSection({
  title,
  subtitle,
  rows,
  teams,
}: {
  title: string;
  subtitle: string;
  rows: RankedRow[];
  teams: NFLTeam[];
}) {
  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
          Alpha Edge Rankings
        </div>

        <h2 className="mt-1 text-xl font-black text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {subtitle}
        </p>
      </div>

      {rows.length === 0 ? (
        <Empty
          text={`No ${title.toLowerCase()} qualify on this slate.`}
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {rows.map(
            (row, index) => (
              <article
                key={`${row.game_id}-${row.player_name || row.pick}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tierClass(
                          row.tier,
                        )}`}
                      >
                        {row.tier ||
                          title}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                        {row.ranking_type ===
                        "player_prop"
                          ? "Player Prop"
                          : "Game Bet"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-white">
                      {row.player_name
                        ? `${row.player_name} — `
                        : ""}
                      {row.pick ||
                        "Model Recommendation"}
                    </h3>

                    <div className="mt-1 text-sm capitalize text-slate-400">
                      {labelFor(
                        row,
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                      Confidence
                    </div>

                    <div className="mt-1 text-xl font-black text-cyan-200">
                      {fmt(
                        row.confidence,
                        1,
                      )}
                    </div>
                  </div>
                </div>

                {(
                  row.away_team ||
                  row.home_team
                ) ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-black text-white">
                    <NFLTeamLogo
                      team={
                        row.away_team ||
                        ""
                      }
                      teams={teams}
                      size={28}
                    />

                    <span>
                      {row.away_team ||
                        "—"}
                    </span>

                    <span className="text-slate-600">
                      @
                    </span>

                    <NFLTeamLogo
                      team={
                        row.home_team ||
                        ""
                      }
                      teams={teams}
                      size={28}
                    />

                    <span>
                      {row.home_team ||
                        "—"}
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <SmallStat
                    label="Projection"
                    value={fmt(
                      row.projection,
                    )}
                  />

                  <SmallStat
                    label="Book Line"
                    value={String(
                      row.line ?? "—",
                    )}
                  />

                  <SmallStat
                    label="Odds"
                    value={String(
                      row.odds ?? "—",
                    )}
                  />

                  <SmallStat
                    label="Edge"
                    value={fmt(
                      row.edge,
                      2,
                    )}
                  />

                  <SmallStat
                    label="Sportsbook"
                    value={String(
                      row.sportsbook ??
                        "—",
                    )}
                  />
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

export default function NFLNextProjectionsPage() {
  const [rankings, setRankings] =
    useState<any>({});

  const [
    gameProjections,
    setGameProjections,
  ] =
    useState<
      ProjectionGame[]
    >([]);

  const [games, setGames] =
    useState<NFLGame[]>([]);

  const [teams, setTeams] =
    useState<NFLTeam[]>([]);

  const [
    selectedGameId,
    setSelectedGameId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);

      try {
        const [
          rankingRes,
          projectionRes,
          slateRes,
          teamsRes,
        ] = await Promise.all([
          fetch(
            "/data/nfl/next/rankings.json",
            {
              cache: "no-store",
            },
          ),

          fetch(
            "/data/nfl/next/game_projections.json",
            {
              cache: "no-store",
            },
          ),

          fetch(
            "/data/nfl/next/slate.json",
            {
              cache: "no-store",
            },
          ),

          fetch(
            "/data/nfl/teams.json",
            {
              cache: "no-store",
            },
          ),
        ]);

        const rankingPayload =
          rankingRes.ok
            ? await rankingRes.json()
            : {};

        const projectionPayload =
          projectionRes.ok
            ? await projectionRes.json()
            : {};

        const slatePayload =
          slateRes.ok
            ? await slateRes.json()
            : [];

        const teamsPayload =
          teamsRes.ok
            ? await teamsRes.json()
            : [];

        if (!cancelled) {
          const loadedGames =
            slateGames(
              slatePayload,
            );

          setRankings(
            rankingPayload,
          );

          setGameProjections(
            projectionGames(
              projectionPayload,
            ),
          );

          setGames(
            loadedGames,
          );

          setTeams(
            Array.isArray(
              teamsPayload,
            )
              ? teamsPayload
              : Array.isArray(
                    teamsPayload?.teams,
                  )
                ? teamsPayload.teams
                : [],
          );

          if (
            loadedGames.length
          ) {
            setSelectedGameId(
              String(
                loadedGames[0]
                  .game_id ??
                  `${loadedGames[0].away_team}-${loadedGames[0].home_team}-0`,
              ),
            );
          }
        }
      } catch {
        if (!cancelled) {
          setRankings({});
          setGameProjections(
            [],
          );
          setGames([]);
          setTeams([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, []);

  const bestBets =
    useMemo(
      () =>
        rows(
          rankings,
          "best_bets",
        ),
      [rankings],
    );

  const strongPlays =
    useMemo(
      () =>
        rows(
          rankings,
          "strong_plays",
        ),
      [rankings],
    );

  const leans =
    useMemo(
      () =>
        rows(
          rankings,
          "leans",
        ),
      [rankings],
    );

  const allRankedRows =
    useMemo(
      () => [
        ...bestBets,
        ...strongPlays,
        ...leans,
      ],
      [
        bestBets,
        strongPlays,
        leans,
      ],
    );

  const selectedSlateGame =
    useMemo(() => {
      if (!games.length) {
        return null;
      }

      return (
        games.find(
          (game, index) =>
            String(
              game.game_id ??
                `${game.away_team}-${game.home_team}-${index}`,
            ) ===
            selectedGameId,
        ) || games[0]
      );
    }, [
      games,
      selectedGameId,
    ]);

  const selectedProjection =
    useMemo(() => {
      if (
        !selectedSlateGame
      ) {
        return null;
      }

      return (
        gameProjections.find(
          (game) =>
            gameMatches(
              {
                game_id:
                  String(
                    game.game_id ??
                      "",
                  ),
                away_team:
                  game.away_team,
                home_team:
                  game.home_team,
              },
              selectedSlateGame,
            ),
        ) ||
        gameProjections.find(
          (game) =>
            sameTeam(
              game.away_team,
              selectedSlateGame.away_team,
            ) &&
            sameTeam(
              game.home_team,
              selectedSlateGame.home_team,
            ),
        ) ||
        null
      );
    }, [
      gameProjections,
      selectedSlateGame,
    ]);

  const selectedRows =
    useMemo(() => {
      if (
        !selectedSlateGame
      ) {
        return [];
      }

      return allRankedRows.filter(
        (row) =>
          row.ranking_type !==
            "player_prop" &&
          gameMatches(
            row,
            selectedSlateGame,
          ),
      );
    }, [
      allRankedRows,
      selectedSlateGame,
    ]);

  const selectedSpread =
    selectedRows.find(
      (row) =>
        marketKind(row) ===
        "spread",
    );

  const selectedMoneyline =
    selectedRows.find(
      (row) =>
        marketKind(row) ===
        "moneyline",
    );

  const selectedTotal =
    selectedRows.find(
      (row) =>
        marketKind(row) ===
        "total",
    );

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading Alpha projections...
      </section>
    );
  }

  if (
    !selectedSlateGame
  ) {
    return (
      <section className="glass rounded-3xl p-8 text-center">
        <div className="text-lg font-black text-white">
          No NFL Projection Data
        </div>

        <div className="mt-2 text-sm text-slate-400">
          NFL slate and projection
          data have not been generated
          yet.
        </div>
      </section>
    );
  }

  const awayCode =
    selectedSlateGame.away_abbr ||
    selectedSlateGame.away_team ||
    selectedProjection?.away_team ||
    "AWAY";

  const homeCode =
    selectedSlateGame.home_abbr ||
    selectedSlateGame.home_team ||
    selectedProjection?.home_team ||
    "HOME";

  const awayPoints =
    selectedProjection
      ?.away_projected_points ??
    selectedProjection
      ?.projected_away_points;

  const homePoints =
    selectedProjection
      ?.home_projected_points ??
    selectedProjection
      ?.projected_home_points;

  const projectedTotal =
    selectedProjection
      ?.projected_total ??
    (num(awayPoints) !== null &&
    num(homePoints) !== null
      ? Number(awayPoints) +
        Number(homePoints)
      : null);

  const projectedMargin =
    selectedProjection
      ?.projected_margin ??
    (num(awayPoints) !== null &&
    num(homePoints) !== null
      ? Number(homePoints) -
        Number(awayPoints)
      : null);

  const awayWin =
    selectedProjection
      ?.win_probability?.away ??
    selectedProjection
      ?.away_win_probability;

  const homeWin =
    selectedProjection
      ?.win_probability?.home ??
    selectedProjection
      ?.home_win_probability;

  const favoredTeam =
    num(projectedMargin) === null
      ? "—"
      : Number(
            projectedMargin,
          ) > 0
        ? homeCode
        : Number(
              projectedMargin,
            ) < 0
          ? awayCode
          : "PICK";

  const modelSpread =
    num(projectedMargin) === null
      ? "—"
      : Number(
            projectedMargin,
          ) === 0
        ? "PICK"
        : `${favoredTeam} ${signed(
            -Math.abs(
              Number(
                projectedMargin,
              ),
            ),
          )}`;

  const modelMoneyline =
    num(homeWin) === null &&
    num(awayWin) === null
      ? "—"
      : `${awayCode} ${americanOdds(
          awayWin,
        )} / ${homeCode} ${americanOdds(
          homeWin,
        )}`;

  return (
    <div className="space-y-5">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {games.length} NFL Games
          Loaded For Next Slate
        </div>
      </div>

      <section className="glass rounded-3xl p-4">
        <GameSelector
          games={games}
          teams={teams}
          selectedId={
            selectedGameId
          }
          onSelect={
            setSelectedGameId
          }
        />
      </section>

      <section className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 p-5 text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
            Alpha Wagerz NFL
          </div>

          <h1 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">
            {awayCode} @ {homeCode}
          </h1>

          <div className="mt-1 text-sm font-bold text-slate-400">
            Model projection and
            sportsbook market comparison
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
            <TeamProjection
              team={awayCode}
              teams={teams}
              points={awayPoints}
              winProbability={
                awayWin
              }
            />

            <div className="hidden xl:block">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-lg font-black text-slate-400">
                @
              </div>
            </div>

            <TeamProjection
              team={homeCode}
              teams={teams}
              points={homePoints}
              winProbability={
                homeWin
              }
              align="right"
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MarketCard
              title="Spread"
              accent="cyan"
              marketRow={
                selectedSpread
              }
              modelValue={
                modelSpread
              }
              modelSubtext={`Model margin ${signed(
                projectedMargin,
              )} home`}
            />

            <MarketCard
              title="Moneyline"
              accent="pink"
              marketRow={
                selectedMoneyline
              }
              modelValue={
                modelMoneyline
              }
              modelSubtext={`${awayCode} ${percent(
                awayWin,
              )} • ${homeCode} ${percent(
                homeWin,
              )}`}
            />

            <MarketCard
              title="Over / Under"
              accent="violet"
              marketRow={
                selectedTotal
              }
              modelValue={
                fmt(
                  projectedTotal,
                )
              }
              modelSubtext="Model projected total"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SmallStat
              label="Projected Total"
              value={fmt(
                projectedTotal,
              )}
            />

            <SmallStat
              label="Projected Margin"
              value={signed(
                projectedMargin,
              )}
            />

            <SmallStat
              label={`${awayCode} Win`}
              value={percent(
                awayWin,
              )}
            />

            <SmallStat
              label={`${homeCode} Win`}
              value={percent(
                homeWin,
              )}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Best Bets"
          value={
            bestBets.length
          }
        />

        <SummaryCard
          label="Strong Plays"
          value={
            strongPlays.length
          }
          accent="pink"
        />

        <SummaryCard
          label="Leans"
          value={leans.length}
          accent="amber"
        />
      </section>

      <RecommendationSection
        title="Best Bets"
        subtitle="Highest-confidence qualifying model edges."
        rows={bestBets}
        teams={teams}
      />

      <RecommendationSection
        title="Strong Plays"
        subtitle="Strong edges that clear the secondary ranking threshold."
        rows={strongPlays}
        teams={teams}
      />

      <RecommendationSection
        title="Leans"
        subtitle="Lower-confidence qualifying edges worth monitoring."
        rows={leans}
        teams={teams}
      />
    </div>
  );
}
