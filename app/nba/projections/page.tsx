"use client";
import { MostConfidentBet, normalOutcomeProbability } from "@/components/projections/MostConfidentBet";


import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Team = {
  abbr?: string;
  abbreviation?: string;
  name?: string;
  logo?: string;
};

type SlateGame = {
  game_id?: string | number;
  away_team?: string;
  home_team?: string;
  away_abbr?: string;
  home_abbr?: string;
  away_record?: string;
  home_record?: string;
  game_datetime_utc?: string;
  game_datetime?: string;
  game_time?: string;
  venue?: string;
  arena?: string;
};

type Projection = {
  away_score?: number;
  home_score?: number;
  projected_total?: number;
  home_margin?: number;
  away_margin?: number;
  home_win_probability?: number;
  away_win_probability?: number;
  projected_winner?: string;
  confidence?: number;
  margin_sd?: number;
  total_sd?: number;
};

type ProjectionGame = SlateGame & {
  model?: Projection;
  periods?: Record<string, Projection>;
  periods_status?: string;
};

type ProjectionPayload = {
  games?: ProjectionGame[];
  slate_date?: string;
  generated_at?: string;
  period_methodology?: string;
};

type Market = {
  bookmaker?: string;
  moneyline?: {
    away?: number;
    home?: number;
  };
  spread?: {
    away_line?: number;
    home_line?: number;
    away_odds?: number;
    home_odds?: number;
  };
  total?: {
    line?: number;
    over_odds?: number;
    under_odds?: number;
  };
  team_totals?: {
    away?: number;
    home?: number;
  };
};

type MarketGame = {
  game_id?: string | number;
  away_team?: string;
  home_team?: string;
  full_game?: Market;
  periods?: Record<string, Market>;
};

const PERIODS = [
  "Full Game",
  "Q1",
  "Q2",
  "1st Half",
  "Q3",
  "Q4",
  "2nd Half",
] as const;

type Period = (typeof PERIODS)[number];

const DATA_ROOT = "/data/nba";

// ============================================================
// PERIOD KEY MAPPING
// ============================================================

// The UI displays "1st Half" and "2nd Half".
// The Python model stores those projections as "1H" and "2H".

const PERIOD_KEYS: Record<Period, string> = {
  "Full Game": "Full Game",
  Q1: "Q1",
  Q2: "Q2",
  "1st Half": "1H",
  Q3: "Q3",
  Q4: "Q4",
  "2nd Half": "2H",
};

// ============================================================
// HELPERS
// ============================================================

const fmt = (
  v?: number | null,
  digits = 1
) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toFixed(digits)
    : "—";

const plus = (v?: number | null) =>
  typeof v === "number" && Number.isFinite(v)
    ? `${v > 0 ? "+" : ""}${fmt(v)}`
    : "—";

const abbr = (
  g: SlateGame,
  side: "away" | "home"
) =>
  String(
    (
      side === "away"
        ? g.away_abbr || g.away_team
        : g.home_abbr || g.home_team
    ) || ""
  ).toUpperCase();

const gameKey = (g: SlateGame) =>
  String(
    g.game_id ??
      `${abbr(g, "away")}-${abbr(g, "home")}`
  );

const matching = (
  a: SlateGame,
  b: SlateGame
) =>
  (
    a.game_id != null &&
    b.game_id != null &&
    String(a.game_id) === String(b.game_id)
  ) ||
  (
    abbr(a, "away") === abbr(b, "away") &&
    abbr(a, "home") === abbr(b, "home")
  );

// ============================================================
// GAME TIME - CENTRAL
// ============================================================

function startTime(g: SlateGame) {
  const raw =
    g.game_datetime_utc ||
    g.game_datetime;

  if (!raw) return "Time TBD";

  const d = new Date(raw);

  return Number.isNaN(d.getTime())
    ? "Time TBD"
    : d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      });
}

// ============================================================
// TEAM LOGO
// ============================================================

function Logo({
  team,
  teams,
  size = 30,
}: {
  team: string;
  teams: Team[];
  size?: number;
}) {
  const found = teams.find(
    (t) =>
      String(
        t.abbr || t.abbreviation
      ).toUpperCase() === team
  );

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-white/50 blur-xl" />

      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]">
        {found?.logo ? (
          <img
            src={found.logo}
            alt={team}
            width={size}
            height={size}
            className="object-contain"
          />
        ) : (
          <span className="text-xs font-black text-slate-900">
            {team}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CARD
// ============================================================

function Card({
  title,
  children,
  tint = "",
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  tint?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 p-4 ${
        tint || "bg-white/[0.035]"
      } ${wide ? "lg:col-span-2" : ""}`}
    >
      <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
        {title}
      </div>

      {children}
    </div>
  );
}

// ============================================================
// PROBABILITY HELPERS
// ============================================================

function normalCdf(x: number) {
  const t =
    1 /
    (1 + 0.2316419 * Math.abs(x));

  const d =
    0.3989422804014327 *
    Math.exp((-x * x) / 2);

  const p =
    1 -
    d *
      t *
      (
        0.319381530 +
        t *
          (
            -0.356563782 +
            t *
              (
                1.781477937 +
                t *
                  (
                    -1.821255978 +
                    t * 1.330274429
                  )
              )
          )
      );

  return x >= 0 ? p : 1 - p;
}

function americanImplied(
  odds?: number
) {
  if (
    typeof odds !== "number" ||
    !Number.isFinite(odds) ||
    odds === 0
  ) {
    return undefined;
  }

  return odds > 0
    ? 10000 / (odds + 100)
    : (100 * -odds) / (100 - odds);
}

// ============================================================
// EDGE
// ============================================================

function PctEdge({
  model,
  odds,
}: {
  model?: number;
  odds?: number;
}) {
  const implied =
    americanImplied(odds);

  if (
    model === undefined ||
    implied === undefined
  ) {
    return (
      <span className="text-slate-500">
        —
      </span>
    );
  }

  const edge = model - implied;

  return (
    <span
      className={
        edge > 0
          ? "text-cyan-200"
          : "text-pink-200"
      }
    >
      {plus(edge)}%
    </span>
  );
}

// ============================================================
// MARKET PANEL
// ============================================================

function MarketPanel({
  game,
  p,
  market,
  teams,
}: {
  game: SlateGame;
  p: Projection;
  market?: Market;
  teams: Team[];
}) {
  const away = abbr(game, "away");
  const home = abbr(game, "home");

  const awayWin =
    p.away_win_probability;

  const homeWin =
    p.home_win_probability;

  const homeCover =
    market?.spread?.home_line !== undefined &&
    p.home_margin !== undefined &&
    typeof p.margin_sd === "number" &&
    p.margin_sd > 0
      ? normalCdf(
          (
            p.home_margin +
            market.spread.home_line
          ) / p.margin_sd
        ) * 100
      : undefined;

  const over =
    market?.total?.line !== undefined &&
    p.projected_total !== undefined &&
    typeof p.total_sd === "number" &&
    p.total_sd > 0
      ? normalCdf(
          (
            p.projected_total -
            market.total.line
          ) / p.total_sd
        ) * 100
      : undefined;

  const marketBox = "flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-4";
  const innerBox = "min-w-0 rounded-xl border border-white/10 bg-slate-950/40 p-3";
  const caption = "text-[10px] font-black uppercase tracking-widest text-slate-500";
  const value = "mt-1 break-words text-base font-black text-white";
  const metric = (label: string, content: React.ReactNode) => (
    <div className={innerBox}><p className={caption}>{label}</p><div className={value}>{content}</div></div>
  );
  const edge = (win?: number, odds?: number) => {
    const implied = americanImplied(odds);
    return win == null || implied == null ? "Unavailable" : plus(win - implied) + "%";
  };
  const spreadLine = market?.spread?.home_line;
  const homeMargin = p.home_margin;
  const spreadPick = spreadLine == null || homeMargin == null ? null :
    homeMargin + spreadLine >= 0 ? `${home} ${plus(spreadLine)}` : `${away} ${plus(market?.spread?.away_line)}`;
  const totalLine = market?.total?.line;
  const totalPick = totalLine == null || p.projected_total == null ? null :
    `${p.projected_total >= totalLine ? "OVER" : "UNDER"} ${fmt(totalLine)}`;
  const pick = (text: string | null) => (
    <div className="mt-3 rounded-xl border border-pink-300/25 bg-pink-300/10 px-4 py-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-pink-200/75">Alpha Pick</p>
      <p className="mt-1 text-xl font-black text-pink-200">{text || "Unavailable"}</p>
    </div>
  );
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className={marketBox}>
        <h3 className="mb-3 text-xs font-black uppercase text-slate-400">Moneyline</h3>
        <div className="grid min-h-[190px] gap-3 md:grid-cols-2">
          {(["away", "home"] as const).map(side => {
            const team = side === "away" ? away : home;
            const odds = market?.moneyline?.[side];
            const win = side === "away" ? awayWin : homeWin;
            return <div key={side} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center gap-3"><img src={teams.find(t => (t.abbr || t.abbreviation || "").toUpperCase() === team)?.logo || ""} alt="" width={34} height={34} className="h-[34px] w-[34px] shrink-0 object-contain" /><p className="text-lg font-black text-white">{team} ML {odds == null ? "Unavailable" : plus(odds)}</p></div>
              <div className="grid grid-cols-3 gap-2">
                {metric("Market Prob.", americanImplied(odds) == null ? "Unavailable" : fmt(americanImplied(odds)) + "%")}
                {metric("Alpha Prob.", win == null ? "Unavailable" : fmt(win) + "%")}
                {metric("Margin Edge", edge(win, odds))}
              </div>
            </div>;
          })}
        </div>
        <div className="mt-auto pt-3">{pick(awayWin == null || homeWin == null ? null : `${awayWin >= homeWin ? away : home} ML ${market?.moneyline?.[awayWin >= homeWin ? "away" : "home"] == null ? "" : plus(market?.moneyline?.[awayWin >= homeWin ? "away" : "home"])}`)}</div>
      </div>
      <div className={marketBox}>
        <h3 className="mb-3 text-xs font-black uppercase text-slate-400">Spread</h3>
        <div className="flex flex-1 flex-col rounded-xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4">
          <div className="grid min-h-[190px] gap-3 md:grid-cols-2">
            <div className={innerBox}>
              <p className={caption}>Sportsbook Spread</p>
              {(["away", "home"] as const).map(side => { const team = side === "away" ? away : home; const line = side === "away" ? market?.spread?.away_line : spreadLine; const price = side === "away" ? market?.spread?.away_odds : market?.spread?.home_odds; return <div key={side} className="mt-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><img src={teams.find(t => (t.abbr || t.abbreviation || "").toUpperCase() === team)?.logo || ""} alt="" width={30} height={30} className="h-[30px] w-[30px] shrink-0 object-contain" /><span className="font-black text-white">{team} {line == null ? "Unavailable" : plus(line)}</span></div><span className="text-sm font-black text-slate-400">{price == null ? "—" : plus(price)}</span></div>; })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {metric("Alpha Score", `${away} ${fmt(p.away_score)} · ${home} ${fmt(p.home_score)}`)}
              {metric("Alpha Margin", homeMargin == null ? "Unavailable" : `${homeMargin >= 0 ? home : away} by ${fmt(Math.abs(homeMargin))}`)}
              {metric("Market Margin", spreadLine == null ? "Unavailable" : fmt(Math.abs(spreadLine)))}
              {metric("Margin Edge", homeMargin == null || spreadLine == null ? "Unavailable" : plus(homeMargin + spreadLine))}
            </div>
          </div>
          <div className="mt-auto pt-3">{pick(spreadPick)}</div>
        </div>
      </div>
      <div className={marketBox + " lg:col-span-2"}>
        <h3 className="mb-3 text-xs font-black uppercase text-slate-400">Over / Under</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {metric("Sportsbook Line", totalLine == null ? "Unavailable" : fmt(totalLine))}
          {metric("Alpha Projection", fmt(p.projected_total))}
          {metric("Difference", totalLine == null || p.projected_total == null ? "Unavailable" : plus(p.projected_total - totalLine))}
          {metric("Over Probability", over == null ? "Unavailable" : fmt(over) + "%")}
        </div>
        {pick(totalPick)}
      </div>
      <div className={marketBox + " lg:col-span-2"}>
        <h3 className="mb-3 text-xs font-black uppercase text-slate-400">Team Totals</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          {(["away", "home"] as const).map(side => {
            const team = side === "away" ? away : home;
            const line = market?.team_totals?.[side];
            const projected = side === "away" ? p.away_score : p.home_score;
            return <div key={side} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <p className="mb-3 text-base font-black text-white">{team}</p>
              <div className="grid grid-cols-3 gap-2">
                {metric("Sportsbook Line", line == null ? "Unavailable" : fmt(line))}
                {metric("Alpha Projection", fmt(projected))}
                {metric("Difference", line == null || projected == null ? "Unavailable" : plus(projected - line))}
              </div>
              {pick(line == null || projected == null ? null : `${projected >= line ? "OVER" : "UNDER"} ${fmt(line)}`)}
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function NBAProjectionsPage() {
  const pathname = usePathname();
  const isNextSlate = pathname.startsWith("/nba/next");
  const [slate, setSlate] =
    useState<SlateGame[]>([]);

  // Full-game projections.
  const [
    projectionData,
    setProjectionData,
  ] =
    useState<ProjectionPayload | null>(
      null
    );

  // Quarter and half projections.
  const [
    periodData,
    setPeriodData,
  ] =
    useState<ProjectionPayload | null>(
      null
    );

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [
    marketGames,
    setMarketGames,
  ] =
    useState<MarketGame[]>([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState("");

  const [period, setPeriod] =
    useState<Period>("Full Game");

  const [loading, setLoading] =
    useState(true);

  const [
    projectionError,
    setProjectionError,
  ] = useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    const controller =
      new AbortController();

    async function read(
      path: string
    ) {
      try {
        const response = await fetch(
          path,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        return response.ok
          ? await response.json()
          : null;
      } catch {
        return null;
      }
    }

    async function load() {
      // Slate and ticker load independently
      // of the projection output.

      const [
        slateJson,
        teamsJson,
        primary,
        periodJson,
        marketJson,
      ] = await Promise.all([
        read(
          `${DATA_ROOT}/slate.json`
        ),

        read(
          `${DATA_ROOT}/teams.json`
        ),

        read(
          `${DATA_ROOT}/betting_projections.json`
        ),

        read(
          `${DATA_ROOT}/team_projections.json`
        ),

        read(
          `${DATA_ROOT}/live_team_markets.json`
        ),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      const slateGames =
        Array.isArray(slateJson?.games)
          ? (slateJson.games as SlateGame[])
          : [];

      // Keep full-game and period data separate.

      const base =
        primary as ProjectionPayload | null;

      const periods =
        periodJson as ProjectionPayload | null;

      const projected =
        Array.isArray(base?.games)
          ? base.games
          : Array.isArray(periods?.games)
            ? periods.games
            : [];

      setSlate(
        slateGames.length
          ? slateGames
          : projected
      );

      setTeams(
        Array.isArray(teamsJson)
          ? teamsJson
          : Array.isArray(
              teamsJson?.teams
            )
            ? teamsJson.teams
            : []
      );

      // Full-game model remains available
      // even if period data is missing.

      if (base) {
        setProjectionData(base);
      } else if (periods) {
        setProjectionData(periods);
      } else {
        setProjectionError(
          "Projection data is unavailable. The game ticker uses the NBA slate independently."
        );
      }

      // Store half/quarter projections separately.

      if (periods) {
        setPeriodData(periods);
      }

      setMarketGames(
        Array.isArray(
          marketJson?.games
        )
          ? marketJson.games
          : []
      );

      setLoading(false);
    }

    void load();

    return () =>
      controller.abort();
  }, []);

  // ==========================================================
  // GAME SELECTION
  // ==========================================================

  const games = useMemo(
    () =>
      [...slate].sort(
        (a, b) =>
          (
            a.game_datetime_utc ||
            ""
          ).localeCompare(
            b.game_datetime_utc ||
              ""
          )
      ),
    [slate]
  );

  const selected =
    games.find(
      (g) =>
        gameKey(g) === selectedId
    ) || games[0];

  // ==========================================================
  // FULL-GAME PROJECTION
  // ==========================================================

  const projectionGame = selected
    ? projectionData?.games?.find(
        (g) =>
          matching(g, selected)
      )
    : undefined;

  // ==========================================================
  // HALF / QUARTER PROJECTION
  // ==========================================================

  const periodGame = selected
    ? periodData?.games?.find(
        (g) =>
          matching(g, selected)
      )
    : undefined;

  // Convert display label to model JSON key.

  const periodKey =
    PERIOD_KEYS[period];

  // Full Game uses betting_projections.json.
  // All other periods use team_projections.json.

  const model =
    period === "Full Game"
      ? projectionGame?.model
      : periodGame?.periods?.[
          periodKey
        ];

  // ==========================================================
  // SPORTSBOOK MARKET
  // ==========================================================

  const marketGame = selected
    ? marketGames.find(
        (g) =>
          matching(g, selected)
      )
    : undefined;

  const market =
    period === "Full Game"
      ? marketGame?.full_game
      : marketGame?.periods?.[
          periodKey
        ];

  // ==========================================================
  // LOADED PROJECTION COUNT
  // ==========================================================

  const loaded = games.filter(
    (g) =>
      projectionData?.games?.some(
        (p) =>
          matching(g, p)
      )
  ).length;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {games.length} NBA Games Loaded
          For {isNextSlate ? "Next Slate" : "Current Slate"}
        </div>
      </div>

      {/* GAME TICKER */}

      <section className="glass mb-5 rounded-3xl px-4 py-4 sm:px-5">
        <div className="table-scroll overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            {games.map((g) => {
              const id = gameKey(g);

              const active =
                selected &&
                gameKey(selected) === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setSelectedId(id)
                  }
                  className={`min-w-[150px] rounded-xl border bg-slate-950/80 px-3 py-2 transition ${
                    active
                      ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]"
                      : "border-white/10 bg-white/[0.035] hover:border-pink-300/40"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Logo
                      team={abbr(
                        g,
                        "away"
                      )}
                      teams={teams}
                    />

                    <span className="text-xs font-black text-slate-400">
                      @
                    </span>

                    <Logo
                      team={abbr(
                        g,
                        "home"
                      )}
                      teams={teams}
                    />
                  </div>

                  <div className="mt-2 text-center text-sm font-black text-white">
                    {startTime(g)}
                  </div>
                </button>
              );
            })}

            {!loading &&
              games.length === 0 && (
                <span className="p-4 text-sm text-slate-400">
                  No games in the NBA slate. Check /public/data/nba/slate.json.
                </span>
              )}

            {loading && (
              <span className="p-4 text-sm text-slate-400">
                Loading NBA games…
              </span>
            )}
          </div>
        </div>
      </section>

      {/* PERIOD SELECTOR */}

      <div className="mb-5 flex flex-wrap justify-center gap-3">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() =>
              setPeriod(p)
            }
            className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
              p === period
                ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-pink-300/40"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* SELECTED GAME */}

      {selected && (
        <section className="glass rounded-3xl p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">
                {teams.find(
                  (t) =>
                    t.abbr ===
                    abbr(
                      selected,
                      "away"
                    )
                )?.name ||
                  abbr(
                    selected,
                    "away"
                  )}{" "}
                @{" "}
                {teams.find(
                  (t) =>
                    t.abbr ===
                    abbr(
                      selected,
                      "home"
                    )
                )?.name ||
                  abbr(
                    selected,
                    "home"
                  )}
              </h2>

              <p className="mt-1 text-sm font-bold text-slate-400">
                {selected.venue ||
                  selected.arena ||
                  "NBA"}{" "}
                ·{" "}
                {startTime(
                  selected
                )}
              </p>
            </div>

            <MostConfidentBet candidates={[
              { label: `${abbr(selected, "away")} ML`, probability: model?.away_win_probability },
              { label: `${abbr(selected, "home")} ML`, probability: model?.home_win_probability },
              { label: `${abbr(selected, "home")} ${market?.spread?.home_line && market.spread.home_line > 0 ? "+" : ""}${market?.spread?.home_line} spread`, probability: normalOutcomeProbability(model?.home_margin, market?.spread?.home_line == null ? null : -market.spread.home_line, model?.margin_sd) },
              { label: `${abbr(selected, "away")} ${market?.spread?.away_line && market.spread.away_line > 0 ? "+" : ""}${market?.spread?.away_line} spread`, probability: normalOutcomeProbability(model?.home_margin == null ? null : -model.home_margin, market?.spread?.away_line == null ? null : -market.spread.away_line, model?.margin_sd) },
              { label: `Over ${market?.total?.line}`, probability: normalOutcomeProbability(model?.projected_total, market?.total?.line, model?.total_sd) },
              { label: `Under ${market?.total?.line}`, probability: normalOutcomeProbability(market?.total?.line, model?.projected_total, model?.total_sd) },
            ]} note="Highest available model win probability. Odds and expected value are not selection factors; other markets need validated outcome probabilities." />
          </div>

          {model ? (
            <>
              {/* PROJECTION CARDS */}

              <div className="grid gap-3 md:grid-cols-3">
                <Card
                  title="Projected Score"
                  tint="border-cyan-400/20 bg-cyan-400/10"
                >
                  <p className="text-lg font-black">
                    {abbr(
                      selected,
                      "away"
                    )}
                    :{" "}
                    {fmt(
                      model.away_score
                    )}
                  </p>

                  <p className="text-lg font-black">
                    {abbr(
                      selected,
                      "home"
                    )}
                    :{" "}
                    {fmt(
                      model.home_score
                    )}
                  </p>
                </Card>

                <Card
                  title="Win Probability"
                  tint="border-pink-300/20 bg-pink-300/10"
                >
                  <p className="text-lg font-black">
                    {abbr(
                      selected,
                      "away"
                    )}
                    :{" "}
                    {fmt(
                      model.away_win_probability
                    )}
                    %
                  </p>

                  <p className="text-lg font-black">
                    {abbr(
                      selected,
                      "home"
                    )}
                    :{" "}
                    {fmt(
                      model.home_win_probability
                    )}
                    %
                  </p>
                </Card>

                <Card
                  title="Projected Total"
                  tint="border-white/10 bg-white/[0.055]"
                >
                  <p className="text-3xl font-black">
                    {fmt(
                      model.projected_total
                    )}
                  </p>

                  <p className="mt-1 text-xs font-black uppercase tracking-wider text-cyan-200">
                    {market?.total?.line !==
                    undefined
                      ? `Book total ${fmt(
                          market.total.line
                        )}`
                      : "Book total unavailable"}
                  </p>
                </Card>
              </div>

              {/* SPORTSBOOK COMPARISON */}

              <MarketPanel
                game={selected}
                p={model}
                market={market}
                teams={teams}
              />

              {market?.bookmaker && (
                <p className="mt-3 text-xs text-slate-500">
                </p>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-center text-sm text-amber-100">
              {period === "Full Game"
                ? projectionError ||
                  "Full-game projection unavailable for this matchup. The game ticker is still available."
                : `${period} projection unavailable. Run the quarter/half projection builder after generating the full-game model.`}
            </div>
          )}
        </section>
      )}

      {/* MODEL TIMESTAMP */}

      {(period === "Full Game"
        ? projectionData?.generated_at
        : periodData?.generated_at) && (
        <p className="mt-5 text-xs text-slate-500">
          Model updated:{" "}
          {new Date(
            (
              period === "Full Game"
                ? projectionData?.generated_at
                : periodData?.generated_at
            )!
          ).toLocaleString("en-US")}
        </p>
      )}
    </div>
  );
}