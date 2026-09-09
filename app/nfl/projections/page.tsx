"use client";

import { useEffect, useMemo, useState } from "react";
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

type ProjectionGame = {
  game_id?: string | number;
  away_team?: string;
  home_team?: string;

  away_projection?: {
    projected_points?: number;
  };

  home_projection?: {
    projected_points?: number;
  };

  projected_score?: {
    away?: number;
    home?: number;
  };

  away_projected_points?: number;
  home_projected_points?: number;
  projected_away_points?: number;
  projected_home_points?: number;

  projected_total?: number;

  expected_margin?: number;
  projected_margin?: number;

  projected_winner?: string;

  projection_confidence?: number;
  confidence?: number;

  win_probability?: {
    away?: number;
    home?: number;
  };

  away_win_probability?: number;
  home_win_probability?: number;
};

type MarketGame = {
  game_id?: string | number;
  event_id?: string | number;
  away_team?: string;
  home_team?: string;

  moneyline?: {
    away?: number;
    home?: number;
    away_implied_probability?: number;
    home_implied_probability?: number;
    away_no_vig_probability?: number;
    home_no_vig_probability?: number;
  };

  spread?: {
    away?: number;
    home?: number;
    away_price?: number;
    home_price?: number;
    raw_spread_line?: number;
  };

  game_total?: number;

  game_total_prices?: {
    over?: number;
    under?: number;
  };

  team_totals?: {
    away?: number;
    home?: number;
    source?: string;
  };

  available_markets?: string[];

  source?: {
    provider?: string;
    sportsbook?: string;
    sportsbook_key?: string;
    last_update?: string;
  };
};

type PickTone = "cyan" | "pink" | "neutral";

const SLATE_PATH = "/data/nfl/slate.json";
const PROJECTION_PATH = "/data/nfl/game_projections.json";
const MARKET_PATH = "/data/nfl/market.json";
const PAGE_TITLE = "Current Slate";

function getGames<T>(payload: any): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of ["games", "projections", "data"]) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

function num(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function fmt(value: unknown, digits = 1) {
  const n = num(value);
  return n === null ? "—" : n.toFixed(digits);
}

function signed(value: unknown, digits = 1) {
  const n = num(value);

  if (n === null) {
    return "—";
  }

  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}`;
}

function percent(value: unknown) {
  const n = num(value);

  if (n === null) {
    return "—";
  }

  const normalized = n <= 1 ? n * 100 : n;
  return `${normalized.toFixed(1)}%`;
}

function odds(value: unknown) {
  const n = num(value);

  if (n === null) {
    return "—";
  }

  const rounded = Math.round(n);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function normalizeTeam(value?: string) {
  const team = String(value || "").trim().toUpperCase();

  const aliases: Record<string, string> = {
    JAC: "JAX",
    JAX: "JAX",
    LA: "LAR",
    LAR: "LAR",
    WSH: "WAS",
    WAS: "WAS",
    OAK: "LV",
    SD: "LAC",
    STL: "LAR",
  };

  return aliases[team] || team;
}

function sameTeam(a?: string, b?: string) {
  return normalizeTeam(a) === normalizeTeam(b);
}

function sameGame(
  a: { game_id?: string | number; away_team?: string; home_team?: string },
  b: { game_id?: string | number; away_team?: string; home_team?: string },
) {
  if (
    a.game_id !== undefined &&
    b.game_id !== undefined &&
    String(a.game_id) === String(b.game_id)
  ) {
    return true;
  }

  return (
    sameTeam(a.away_team, b.away_team) &&
    sameTeam(a.home_team, b.home_team)
  );
}

function formatGameCardTime(game?: NFLGame) {
  if (!game) {
    return "TBD";
  }

  if (game.game_time) {
    const [hourString, minuteString] = game.game_time.split(":");
    const hour = Number(hourString);
    const minute = Number(minuteString);

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;

      return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
    }
  }

  const raw = game.game_datetime_utc || game.game_datetime;

  if (!raw) {
    return "TBD";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
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
        <NFLTeamLogo team={team} teams={teams} size={28} />
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
    <section className="glass rounded-3xl px-5 py-4">
      <div className="table-scroll mt-2 pb-2">
        <div className="flex min-w-max gap-2">
          {games.map((game, index) => {
            const id = String(
              game.game_id ??
                `${game.away_team}-${game.home_team}-${index}`,
            );

            const active = id === selectedId;
            const away = game.away_abbr || game.away_team || "AWAY";
            const home = game.home_abbr || game.home_team || "HOME";

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`min-w-[150px] rounded-xl border bg-slate-950/80 px-3 py-2 transition ${
                  active
                    ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]"
                    : "border-white/10 bg-white/[0.035] hover:border-pink-300/40"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <NFLLogoGlow team={away} teams={teams} />
                  <span className="text-xs font-black text-slate-400">@</span>
                  <NFLLogoGlow team={home} teams={teams} />
                </div>

                <div className="mt-2 text-center text-sm font-black tracking-wide text-white">
                  {formatGameCardTime(game)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TeamProjection({
  team,
  teams,
  points,
  winProbability,
  side,
}: {
  team: string;
  teams: NFLTeam[];
  points: unknown;
  winProbability: unknown;
  side: "away" | "home";
}) {
  const home = side === "home";

  return (
    <div
      className={`flex items-center gap-4 ${
        home ? "justify-end text-right" : ""
      }`}
    >
      {!home ? (
        <NFLTeamLogo team={team} teams={teams} size={64} />
      ) : null}

      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {home ? "Home" : "Away"}
        </div>

        <div className="mt-1 text-xl font-black text-white">{team}</div>

        <div className="mt-1 text-4xl font-black neon-text">
          {fmt(points)}
        </div>

        <div className="mt-1 text-sm font-bold text-slate-400">
          Win {percent(winProbability)}
        </div>
      </div>

      {home ? (
        <NFLTeamLogo team={team} teams={teams} size={64} />
      ) : null}
    </div>
  );
}

function StatCell({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-base font-black text-white">{value}</div>
      {subtext ? (
        <div className="mt-1 text-[11px] font-bold text-slate-500">
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

function PickBadge({
  pick,
  tone,
}: {
  pick: string;
  tone: PickTone;
}) {
  const classes =
    tone === "pink"
      ? "border-pink-300/25 bg-pink-300/10 text-pink-200"
      : tone === "cyan"
        ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
        : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <div className={`rounded-xl border p-4 text-center ${classes}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">
        Alpha Pick
      </div>
      <div className="mt-1 text-xl font-black">{pick}</div>
    </div>
  );
}

function MarketSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-3xl p-5 sm:p-6">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function GameTotalCard({
  line,
  projection,
  overPrice,
  underPrice,
  sportsbook,
}: {
  line: number | null;
  projection: number | null;
  overPrice: number | null;
  underPrice: number | null;
  sportsbook: string;
}) {
  const difference =
    line !== null && projection !== null ? projection - line : null;

  const pick =
    line === null
      ? "NO LINE"
      : projection === null
        ? "NO PROJECTION"
        : difference === 0
          ? "PASS"
          : difference! > 0
            ? `OVER ${fmt(line)}`
            : `UNDER ${fmt(line)}`;

  const tone: PickTone =
    pick.startsWith("OVER")
      ? "cyan"
      : pick.startsWith("UNDER")
        ? "pink"
        : "neutral";

  return (
    <div className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.045] p-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCell
          label="Sportsbook Line"
          value={line === null ? "—" : fmt(line)}
          subtext={sportsbook}
        />
        <StatCell
          label="Alpha Projection"
          value={projection === null ? "—" : fmt(projection)}
        />
        <StatCell
          label="Difference"
          value={difference === null ? "—" : signed(difference)}
        />
        <StatCell
          label="O / U Odds"
          value={
            overPrice === null && underPrice === null
              ? "—"
              : `O ${odds(overPrice)} / U ${odds(underPrice)}`
          }
        />
      </div>

      <div className="mt-3">
        <PickBadge pick={pick} tone={tone} />
      </div>
    </div>
  );
}

function TeamTotalCard({
  team,
  teams,
  line,
  projection,
  sportsbook,
}: {
  team: string;
  teams: NFLTeam[];
  line: number | null;
  projection: number | null;
  sportsbook: string;
}) {
  const difference =
    line !== null && projection !== null ? projection - line : null;

  const pick =
    line === null
      ? "NO LINE"
      : projection === null
        ? "NO PROJECTION"
        : difference === 0
          ? "PASS"
          : difference! > 0
            ? `OVER ${fmt(line)}`
            : `UNDER ${fmt(line)}`;

  const tone: PickTone =
    pick.startsWith("OVER")
      ? "cyan"
      : pick.startsWith("UNDER")
        ? "pink"
        : "neutral";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="mb-4 flex items-center gap-3">
        <NFLTeamLogo team={team} teams={teams} size={40} />
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
            Team Total
          </div>
          <div className="text-xl font-black text-white">{team}</div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <StatCell
          label="Sportsbook Line"
          value={line === null ? "—" : fmt(line)}
          subtext={sportsbook}
        />
        <StatCell
          label="Alpha Projection"
          value={projection === null ? "—" : fmt(projection)}
        />
        <StatCell
          label="Difference"
          value={difference === null ? "—" : signed(difference)}
        />
      </div>

      <div className="mt-3">
        <PickBadge pick={pick} tone={tone} />
      </div>
    </div>
  );
}

function SpreadCard({
  away,
  home,
  teams,
  awaySpread,
  homeSpread,
  awayPrice,
  homePrice,
  awayPoints,
  homePoints,
  sportsbook,
}: {
  away: string;
  home: string;
  teams: NFLTeam[];
  awaySpread: number | null;
  homeSpread: number | null;
  awayPrice: number | null;
  homePrice: number | null;
  awayPoints: number | null;
  homePoints: number | null;
  sportsbook: string;
}) {
  const projectedHomeMargin =
    awayPoints !== null && homePoints !== null
      ? homePoints - awayPoints
      : null;

  const marketHomeMargin =
    awaySpread !== null
      ? awaySpread
      : homeSpread !== null
        ? -homeSpread
        : null;

  const marginEdge =
    projectedHomeMargin !== null && marketHomeMargin !== null
      ? projectedHomeMargin - marketHomeMargin
      : null;

  let pick = "NO LINE";
  let tone: PickTone = "neutral";

  if (
    awaySpread !== null &&
    homeSpread !== null &&
    projectedHomeMargin !== null &&
    marketHomeMargin !== null
  ) {
    if (Math.abs(projectedHomeMargin - marketHomeMargin) < 0.0001) {
      pick = "PASS";
    } else if (projectedHomeMargin > marketHomeMargin) {
      pick = `${home} ${signed(homeSpread)}`;
      tone = "pink";
    } else {
      pick = `${away} ${signed(awaySpread)}`;
      tone = "cyan";
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
            Sportsbook Spread
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <NFLTeamLogo team={away} teams={teams} size={30} />
              <span className="font-black text-white">
                {away} {awaySpread === null ? "—" : signed(awaySpread)}
              </span>
            </div>
            <span className="text-sm font-black text-slate-400">
              {odds(awayPrice)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <NFLTeamLogo team={home} teams={teams} size={30} />
              <span className="font-black text-white">
                {home} {homeSpread === null ? "—" : signed(homeSpread)}
              </span>
            </div>
            <span className="text-sm font-black text-slate-400">
              {odds(homePrice)}
            </span>
          </div>

          <div className="mt-3 text-[11px] font-bold text-slate-500">
            {sportsbook}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <StatCell
            label="Alpha Score"
            value={`${away} ${fmt(awayPoints)} • ${home} ${fmt(homePoints)}`}
          />
          <StatCell
            label="Alpha Margin"
            value={
              projectedHomeMargin === null
                ? "—"
                : projectedHomeMargin > 0
                  ? `${home} by ${fmt(projectedHomeMargin)}`
                  : projectedHomeMargin < 0
                    ? `${away} by ${fmt(Math.abs(projectedHomeMargin))}`
                    : "PICK"
            }
          />
          <StatCell
            label="Market Margin"
            value={
              marketHomeMargin === null
                ? "—"
                : marketHomeMargin > 0
                  ? `${home} by ${fmt(marketHomeMargin)}`
                  : marketHomeMargin < 0
                    ? `${away} by ${fmt(Math.abs(marketHomeMargin))}`
                    : "PICK"
            }
          />
          <StatCell
            label="Margin Edge"
            value={marginEdge === null ? "—" : signed(marginEdge)}
          />
        </div>
      </div>

      <div className="mt-3">
        <PickBadge pick={pick} tone={tone} />
      </div>
    </div>
  );
}

function MoneylineCard({
  away,
  home,
  teams,
  awayOdds,
  homeOdds,
  awayMarketProbability,
  homeMarketProbability,
  awayModelProbability,
  homeModelProbability,
  sportsbook,
}: {
  away: string;
  home: string;
  teams: NFLTeam[];
  awayOdds: number | null;
  homeOdds: number | null;
  awayMarketProbability: number | null;
  homeMarketProbability: number | null;
  awayModelProbability: number | null;
  homeModelProbability: number | null;
  sportsbook: string;
}) {
  const awayModel =
    awayModelProbability === null
      ? null
      : awayModelProbability > 1
        ? awayModelProbability / 100
        : awayModelProbability;

  const homeModel =
    homeModelProbability === null
      ? null
      : homeModelProbability > 1
        ? homeModelProbability / 100
        : homeModelProbability;

  const awayEdge =
    awayModel !== null && awayMarketProbability !== null
      ? awayModel - awayMarketProbability
      : null;

  const homeEdge =
    homeModel !== null && homeMarketProbability !== null
      ? homeModel - homeMarketProbability
      : null;

  let pick = "NO LINE";
  let tone: PickTone = "neutral";

  // Alpha's moneyline pick is the team the MODEL predicts to win.
  // Sportsbook odds and probability edge are displayed for context only;
  // they do not determine Alpha's selection.
  if (awayModel !== null && homeModel !== null) {
    if (Math.abs(awayModel - homeModel) < 0.0001) {
      pick = "PASS";
    } else if (awayModel > homeModel) {
      pick =
        awayOdds !== null
          ? `${away} ML ${odds(awayOdds)}`
          : `${away} ML`;
      tone = "cyan";
    } else {
      pick =
        homeOdds !== null
          ? `${home} ML ${odds(homeOdds)}`
          : `${home} ML`;
      tone = "pink";
    }
  }

  return (
    <div className="rounded-2xl border border-pink-300/20 bg-pink-300/[0.04] p-5">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          {
            team: away,
            line: awayOdds,
            market: awayMarketProbability,
            model: awayModel,
            edge: awayEdge,
          },
          {
            team: home,
            line: homeOdds,
            market: homeMarketProbability,
            model: homeModel,
            edge: homeEdge,
          },
        ].map((row) => (
          <div
            key={row.team}
            className="rounded-xl border border-white/[0.07] bg-black/20 p-4"
          >
            <div className="flex items-center gap-3">
              <NFLTeamLogo team={row.team} teams={teams} size={34} />
              <div className="text-lg font-black text-white">
                {row.team} ML {odds(row.line)}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <StatCell
                label="Market Prob."
                value={percent(row.market)}
              />
              <StatCell
                label="Alpha Prob."
                value={percent(row.model)}
              />
              <StatCell
                label="Probability Edge"
                value={
                  row.edge === null
                    ? "—"
                    : `${row.edge > 0 ? "+" : ""}${(row.edge * 100).toFixed(1)}%`
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] font-bold text-slate-500">
        Market probability uses the no-vig probability when available • {sportsbook}
      </div>

      <div className="mt-3">
        <PickBadge pick={pick} tone={tone} />
      </div>
    </div>
  );
}

export default function NFLProjectionsPage() {
  const [games, setGames] = useState<NFLGame[]>([]);
  const [projections, setProjections] = useState<ProjectionGame[]>([]);
  const [markets, setMarkets] = useState<MarketGame[]>([]);
  const [teams, setTeams] = useState<NFLTeam[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);

      try {
        const [slateRes, projectionRes, marketRes, teamsRes] =
          await Promise.all([
            fetch(SLATE_PATH, { cache: "no-store" }),
            fetch(PROJECTION_PATH, { cache: "no-store" }),
            fetch(MARKET_PATH, { cache: "no-store" }),
            fetch("/data/nfl/teams.json", { cache: "no-store" }),
          ]);

        const slatePayload = slateRes.ok ? await slateRes.json() : {};
        const projectionPayload = projectionRes.ok
          ? await projectionRes.json()
          : {};
        const marketPayload = marketRes.ok ? await marketRes.json() : {};
        const teamsPayload = teamsRes.ok ? await teamsRes.json() : [];

        if (cancelled) {
          return;
        }

        const loadedGames = getGames<NFLGame>(slatePayload);

        setGames(loadedGames);
        setProjections(getGames<ProjectionGame>(projectionPayload));
        setMarkets(getGames<MarketGame>(marketPayload));
        setTeams(
          Array.isArray(teamsPayload)
            ? teamsPayload
            : Array.isArray(teamsPayload?.teams)
              ? teamsPayload.teams
              : [],
        );

        if (loadedGames.length) {
          setSelectedGameId(
            String(
              loadedGames[0].game_id ??
                `${loadedGames[0].away_team}-${loadedGames[0].home_team}-0`,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setGames([]);
          setProjections([]);
          setMarkets([]);
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

  const selectedGame = useMemo(() => {
    if (!games.length) {
      return null;
    }

    return (
      games.find((game, index) => {
        const id = String(
          game.game_id ?? `${game.away_team}-${game.home_team}-${index}`,
        );
        return id === selectedGameId;
      }) || games[0]
    );
  }, [games, selectedGameId]);

  const selectedProjection = useMemo(() => {
    if (!selectedGame) {
      return null;
    }

    return (
      projections.find((row) => sameGame(row, selectedGame)) ||
      projections.find(
        (row) =>
          sameTeam(row.away_team, selectedGame.away_team) &&
          sameTeam(row.home_team, selectedGame.home_team),
      ) ||
      null
    );
  }, [projections, selectedGame]);

  const selectedMarket = useMemo(() => {
    if (!selectedGame) {
      return null;
    }

    return (
      markets.find((row) => sameGame(row, selectedGame)) ||
      markets.find(
        (row) =>
          sameTeam(row.away_team, selectedGame.away_team) &&
          sameTeam(row.home_team, selectedGame.home_team),
      ) ||
      null
    );
  }, [markets, selectedGame]);

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading Alpha projections...
      </section>
    );
  }

  if (!selectedGame) {
    return (
      <section className="glass rounded-3xl p-8 text-center">
        <div className="text-lg font-black text-white">
          No NFL Projection Data
        </div>
        <div className="mt-2 text-sm text-slate-400">
          NFL slate and projection data have not been generated yet.
        </div>
      </section>
    );
  }

  const away =
    selectedGame.away_abbr ||
    selectedGame.away_team ||
    selectedProjection?.away_team ||
    "AWAY";

  const home =
    selectedGame.home_abbr ||
    selectedGame.home_team ||
    selectedProjection?.home_team ||
    "HOME";

  const awayPoints =
    num(
      selectedProjection?.away_projection?.projected_points ??
        selectedProjection?.projected_score?.away ??
        selectedProjection?.away_projected_points ??
        selectedProjection?.projected_away_points,
    );

  const homePoints =
    num(
      selectedProjection?.home_projection?.projected_points ??
        selectedProjection?.projected_score?.home ??
        selectedProjection?.home_projected_points ??
        selectedProjection?.projected_home_points,
    );

  const projectedTotal =
    num(selectedProjection?.projected_total) ??
    (awayPoints !== null && homePoints !== null
      ? awayPoints + homePoints
      : null);

  const projectedMargin =
    num(
      selectedProjection?.expected_margin ??
        selectedProjection?.projected_margin,
    ) ??
    (awayPoints !== null && homePoints !== null
      ? homePoints - awayPoints
      : null);

  const awayWin =
    num(
      selectedProjection?.win_probability?.away ??
        selectedProjection?.away_win_probability,
    );

  const homeWin =
    num(
      selectedProjection?.win_probability?.home ??
        selectedProjection?.home_win_probability,
    );

  const sportsbook =
    selectedMarket?.source?.sportsbook || "Sportsbook";

  const totalLine = num(selectedMarket?.game_total);
  const awayTeamTotal = num(selectedMarket?.team_totals?.away);
  const homeTeamTotal = num(selectedMarket?.team_totals?.home);

  const awaySpread = num(selectedMarket?.spread?.away);
  const homeSpread = num(selectedMarket?.spread?.home);
  const awaySpreadPrice = num(selectedMarket?.spread?.away_price);
  const homeSpreadPrice = num(selectedMarket?.spread?.home_price);

  const awayMoneyline = num(selectedMarket?.moneyline?.away);
  const homeMoneyline = num(selectedMarket?.moneyline?.home);

  const awayMarketProbability =
    num(selectedMarket?.moneyline?.away_no_vig_probability) ??
    num(selectedMarket?.moneyline?.away_implied_probability);

  const homeMarketProbability =
    num(selectedMarket?.moneyline?.home_no_vig_probability) ??
    num(selectedMarket?.moneyline?.home_implied_probability);

  return (
    <div className="space-y-5 pt-4">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {games.length} NFL Games Loaded For {PAGE_TITLE}
        </div>
      </div>

      <GameSelector
        games={games}
        teams={teams}
        selectedId={selectedGameId}
        onSelect={setSelectedGameId}
      />

      <section className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 p-6 text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
            Alpha Game Projections
          </div>

          <h1 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">
            {away} @ {home}
          </h1>

          <div className="mt-1 text-sm font-bold text-slate-400">
            Sportsbook lines compared directly with Alpha&apos;s independent model
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <TeamProjection
              team={away}
              teams={teams}
              points={awayPoints}
              winProbability={awayWin}
              side="away"
            />

            <div className="hidden md:block">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-lg font-black text-slate-400">
                @
              </div>
            </div>

            <TeamProjection
              team={home}
              teams={teams}
              points={homePoints}
              winProbability={homeWin}
              side="home"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCell
              label="Projected Total"
              value={fmt(projectedTotal)}
            />
            <StatCell
              label="Projected Margin"
              value={
                projectedMargin === null
                  ? "—"
                  : projectedMargin > 0
                    ? `${home} by ${fmt(projectedMargin)}`
                    : projectedMargin < 0
                      ? `${away} by ${fmt(Math.abs(projectedMargin))}`
                      : "PICK"
              }
            />
            <StatCell label={`${away} Win`} value={percent(awayWin)} />
            <StatCell label={`${home} Win`} value={percent(homeWin)} />
          </div>
        </div>
      </section>

      <MarketSection
        eyebrow="Game Market"
        title="Game Total"
        description="Compare the sportsbook total with Alpha's projected combined score."
      >
        <GameTotalCard
          line={totalLine}
          projection={projectedTotal}
          overPrice={num(selectedMarket?.game_total_prices?.over)}
          underPrice={num(selectedMarket?.game_total_prices?.under)}
          sportsbook={sportsbook}
        />
      </MarketSection>

      <MarketSection
        eyebrow="Team Markets"
        title="Team Totals"
        description="The market-implied team totals are compared with Alpha's projected points for each team."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <TeamTotalCard
            team={away}
            teams={teams}
            line={awayTeamTotal}
            projection={awayPoints}
            sportsbook={sportsbook}
          />
          <TeamTotalCard
            team={home}
            teams={teams}
            line={homeTeamTotal}
            projection={homePoints}
            sportsbook={sportsbook}
          />
        </div>
      </MarketSection>

      <MarketSection
        eyebrow="Side Market"
        title="Spread"
        description="Alpha compares its projected scoring margin with the sportsbook spread and identifies the side the model favors against the number."
      >
        <SpreadCard
          away={away}
          home={home}
          teams={teams}
          awaySpread={awaySpread}
          homeSpread={homeSpread}
          awayPrice={awaySpreadPrice}
          homePrice={homeSpreadPrice}
          awayPoints={awayPoints}
          homePoints={homePoints}
          sportsbook={sportsbook}
        />
      </MarketSection>

      <MarketSection
        eyebrow="Winner Market"
        title="Moneyline"
        description="Alpha compares its win probability with the sportsbook's no-vig market probability and favors the side with the stronger probability edge."
      >
        <MoneylineCard
          away={away}
          home={home}
          teams={teams}
          awayOdds={awayMoneyline}
          homeOdds={homeMoneyline}
          awayMarketProbability={awayMarketProbability}
          homeMarketProbability={homeMarketProbability}
          awayModelProbability={awayWin}
          homeModelProbability={homeWin}
          sportsbook={sportsbook}
        />
      </MarketSection>

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
          How To Read This Page
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sportsbook lines come from the NFL market file. Alpha projections remain
          independent of those sportsbook numbers. OVER or UNDER means the Alpha
          projection is above or below the displayed total. The spread pick is based
          on Alpha&apos;s projected scoring margin versus the market spread. The
          moneyline pick compares Alpha&apos;s win probability with the market&apos;s
          no-vig probability. These are model opinions, not guaranteed outcomes.
        </p>
      </section>
    </div>
  );
}