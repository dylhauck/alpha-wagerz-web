import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonObject = Record<string, unknown>;

type PlayerProjection = JsonObject & {
  player_id?: string;
  player_name?: string;
  player?: string;
  name?: string;
  team?: string;
  position?: string;
};

type PlayerPropRequest = {
  player?: string;
  player_name?: string;
  player_id?: string;
  team?: string;
  event_id?: string;
  game_id?: string;
  slate?: "current" | "next";
};

type PropResult = {
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

  pick: "OVER" | "UNDER" | "YES" | "NO" | null;

  over_odds: number | null;
  under_odds: number | null;
  yes_odds: number | null;
  no_odds: number | null;

  sportsbook: string | null;
  market_name: string | null;
};

const ODDS_BASE_URL =
  process.env.ODDS_API_IO_BASE_URL || "https://api.odds-api.io/v3";

const BOOKMAKERS = [
  "FanDuel",
  "DraftKings",
];

const PROP_MARKET_MAP: Record<string, string> = {
  "passing + rushing yards": "passing_rushing_yards",
  "passing+rushing yards": "passing_rushing_yards",
  "pass + rush yards": "passing_rushing_yards",

  "rushing + receiving yards": "rushing_receiving_yards",
  "rushing+receiving yards": "rushing_receiving_yards",
  "rush + receiving yards": "rushing_receiving_yards",

  "passing yards": "passing_yards",
  "pass yards": "passing_yards",

  "passing touchdowns": "passing_touchdowns",
  "passing tds": "passing_touchdowns",

  "passing attempts": "passing_attempts",

  "passing completions": "passing_completions",
  completions: "passing_completions",

  "passing interceptions": "interceptions",
  "interceptions thrown": "interceptions",

  "rushing yards": "rushing_yards",
  "rush yards": "rushing_yards",

  "rushing attempts": "rushing_attempts",
  "rush attempts": "rushing_attempts",
  carries: "rushing_attempts",

  receptions: "receptions",

  "receiving yards": "receiving_yards",
  "reception yards": "receiving_yards",

  "longest reception": "longest_reception",
  "reception longest": "longest_reception",

  "longest rush": "longest_rush",
  "rush longest": "longest_rush",

  "anytime touchdown": "anytime_touchdown",
  "anytime td": "anytime_touchdown",
  "anytime touchdown scorer": "anytime_touchdown",
};

const PROP_LABELS: Record<string, string> = {
  passing_rushing_yards: "Passing + Rushing Yards",
  rushing_receiving_yards: "Rushing + Receiving Yards",
  passing_yards: "Passing Yards",
  passing_touchdowns: "Passing Touchdowns",
  passing_attempts: "Passing Attempts",
  passing_completions: "Passing Completions",
  interceptions: "Interceptions",
  rushing_yards: "Rushing Yards",
  rushing_attempts: "Rushing Attempts",
  receptions: "Receptions",
  receiving_yards: "Receiving Yards",
  longest_reception: "Longest Reception",
  longest_rush: "Longest Rush",
  anytime_touchdown: "Anytime Touchdown",
};

const PROJECTION_KEYS: Record<string, string[]> = {
  passing_yards: [
    "passing_yards",
    "pass_yards",
    "projected_passing_yards",
    "projected_pass_yards",
  ],

  passing_touchdowns: [
    "passing_touchdowns",
    "passing_tds",
    "pass_tds",
    "projected_passing_touchdowns",
    "projected_passing_tds",
  ],

  passing_attempts: [
    "passing_attempts",
    "pass_attempts",
    "projected_passing_attempts",
  ],

  passing_completions: [
    "passing_completions",
    "completions",
    "projected_passing_completions",
    "projected_completions",
  ],

  interceptions: [
    "interceptions",
    "passing_interceptions",
    "interceptions_thrown",
    "projected_interceptions",
  ],

  rushing_yards: [
    "rushing_yards",
    "rush_yards",
    "projected_rushing_yards",
    "projected_rush_yards",
  ],

  rushing_attempts: [
    "rushing_attempts",
    "rush_attempts",
    "carries",
    "projected_rushing_attempts",
  ],

  receptions: [
    "receptions",
    "projected_receptions",
  ],

  receiving_yards: [
    "receiving_yards",
    "rec_yards",
    "projected_receiving_yards",
  ],

  longest_reception: [
    "longest_reception",
    "projected_longest_reception",
  ],

  longest_rush: [
    "longest_rush",
    "projected_longest_rush",
  ],
};

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeName(value: unknown): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTeam(value: unknown): string {
  const team = cleanText(value).toUpperCase();

  const aliases: Record<string, string> = {
    LA: "LAR",
    JAC: "JAX",
    WSH: "WAS",
    OAK: "LV",
    SD: "LAC",
    STL: "LAR",
  };

  return aliases[team] ?? team;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function decimalToAmerican(
  decimalOdds: number | null
): number | null {
  if (
    decimalOdds === null ||
    decimalOdds <= 1
  ) {
    return null;
  }

  if (decimalOdds >= 2) {
    return Math.round(
      (decimalOdds - 1) * 100
    );
  }

  return Math.round(
    -100 / (decimalOdds - 1)
  );
}


function firstNumber(
  object: JsonObject,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = numberValue(object[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function identifyPropType(value: unknown): string | null {
  const raw = cleanText(value)
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  /*
   * Odds-API.io player labels look like:
   *   Drake Maye (Passing + Rushing Yards)
   *   Drake Maye (Rushing Yards)
   *
   * Parse the parenthetical descriptor first. This prevents
   * "Passing + Rushing Yards" from being incorrectly classified
   * as plain "Rushing Yards".
   */
  const parenthetical = raw.match(/\(([^()]*)\)\s*$/);
  const key = (
    parenthetical?.[1] || raw
  )
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s+/g, " ")
    .trim();

  const exact: Record<string, string> = {
    "passing + rushing yards": "passing_rushing_yards",
    "pass + rush yards": "passing_rushing_yards",

    "rushing + receiving yards": "rushing_receiving_yards",
    "rush + receiving yards": "rushing_receiving_yards",

    "passing yards": "passing_yards",
    "pass yards": "passing_yards",
    "passing touchdowns": "passing_touchdowns",
    "passing tds": "passing_touchdowns",
    "td passes": "passing_touchdowns",
    "passing attempts": "passing_attempts",
    "completions": "passing_completions",
    "passing completions": "passing_completions",
    "interceptions": "interceptions",
    "interceptions thrown": "interceptions",

    "rushing yards": "rushing_yards",
    "rush yards": "rushing_yards",
    "rushing attempts": "rushing_attempts",
    "rush attempts": "rushing_attempts",
    "carries": "rushing_attempts",

    "receiving yards": "receiving_yards",
    "reception yards": "receiving_yards",
    "receptions": "receptions",

    "longest reception": "longest_reception",
    "longest rush": "longest_rush",

    "anytime touchdown": "anytime_touchdown",
    "anytime td": "anytime_touchdown",
    "anytime touchdown scorer": "anytime_touchdown",
  };

  return exact[key] ?? null;
}

function getPlayerName(player: PlayerProjection): string {
  return cleanText(
    player.player_name ||
      player.player ||
      player.name
  );
}

function getProjectionRows(payload: unknown): PlayerProjection[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (row): row is PlayerProjection =>
        typeof row === "object" &&
        row !== null
    );
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const object = payload as JsonObject;

  for (const key of [
    "players",
    "projections",
    "player_projections",
    "rows",
    "data",
  ]) {
    const value = object[key];

    if (Array.isArray(value)) {
      return value.filter(
        (row): row is PlayerProjection =>
          typeof row === "object" &&
          row !== null
      );
    }
  }

  return [];
}

async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function loadProjections(
  slate: "current" | "next"
): Promise<PlayerProjection[]> {
  const publicRoot = path.join(process.cwd(), "public");

  const candidates =
    slate === "next"
      ? [
          path.join(
            publicRoot,
            "data",
            "nfl",
            "next",
            "player_projections.json"
          ),
          path.join(
            publicRoot,
            "data",
            "nfl",
            "player_projections.json"
          ),
        ]
      : [
          path.join(
            publicRoot,
            "data",
            "nfl",
            "player_projections.json"
          ),
        ];

  for (const candidate of candidates) {
    const payload = await readJsonFile(candidate);
    const rows = getProjectionRows(payload);

    if (rows.length > 0) {
      return rows;
    }
  }

  return [];
}

function findProjectionPlayer(
  rows: PlayerProjection[],
  playerName: string,
  playerId?: string,
  team?: string
): PlayerProjection | null {
  const wantedName = normalizeName(playerName);
  const wantedTeam = normalizeTeam(team);

  if (playerId) {
    const byId = rows.find(
      (row) =>
        cleanText(row.player_id) ===
        cleanText(playerId)
    );

    if (byId) {
      return byId;
    }
  }

  const exactNameAndTeam = rows.find((row) => {
    const sameName =
      normalizeName(getPlayerName(row)) === wantedName;

    if (!sameName) {
      return false;
    }

    if (!wantedTeam) {
      return true;
    }

    return normalizeTeam(row.team) === wantedTeam;
  });

  if (exactNameAndTeam) {
    return exactNameAndTeam;
  }

  return (
    rows.find(
      (row) =>
        normalizeName(getPlayerName(row)) ===
        wantedName
    ) ?? null
  );
}

function deepFindProjection(
  value: unknown,
  keys: string[]
): number | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = deepFindProjection(item, keys);

      if (result !== null) {
        return result;
      }
    }

    return null;
  }

  const object = value as JsonObject;

  for (const key of keys) {
    if (key in object) {
      const result = numberValue(object[key]);

      if (result !== null) {
        return result;
      }
    }
  }

  for (const child of Object.values(object)) {
    if (child && typeof child === "object") {
      const result = deepFindProjection(child, keys);

      if (result !== null) {
        return result;
      }
    }
  }

  return null;
}

function getProjectionForProp(
  player: PlayerProjection | null,
  propType: string
): number | null {
  if (!player) {
    return null;
  }

  /*
   * player_projections.json stores projections in nested football
   * categories:
   *
   * projection.passing.yards
   * projection.rushing.yards
   * projection.receiving.yards
   *
   * Use those exact paths so a generic "yards" lookup can never
   * accidentally pull the wrong stat.
   */
  const projection =
    player.projection &&
    typeof player.projection === "object"
      ? (player.projection as JsonObject)
      : null;

  const passing =
    projection?.passing &&
    typeof projection.passing === "object"
      ? (projection.passing as JsonObject)
      : null;

  const rushing =
    projection?.rushing &&
    typeof projection.rushing === "object"
      ? (projection.rushing as JsonObject)
      : null;

  const receiving =
    projection?.receiving &&
    typeof projection.receiving === "object"
      ? (projection.receiving as JsonObject)
      : null;

  switch (propType) {
    case "passing_rushing_yards": {
      const passYards = numberValue(passing?.yards);
      const rushYards = numberValue(rushing?.yards);

      return (
        passYards !== null &&
        rushYards !== null
      )
        ? Number((passYards + rushYards).toFixed(2))
        : null;
    }

    case "rushing_receiving_yards": {
      const rushYards = numberValue(rushing?.yards);
      const receivingYards = numberValue(receiving?.yards);

      return (
        rushYards !== null &&
        receivingYards !== null
      )
        ? Number((rushYards + receivingYards).toFixed(2))
        : null;
    }

    case "anytime_touchdown": {
      /*
       * Anytime TD means the PLAYER scores a TD.
       * Passing TDs do not count as the quarterback scoring.
       */
      const rushingTd =
        numberValue(rushing?.touchdowns) ?? 0;
      const receivingTd =
        numberValue(receiving?.touchdowns) ?? 0;

      return Number(
        (rushingTd + receivingTd).toFixed(4)
      );
    }

    case "passing_yards":
      return numberValue(passing?.yards);

    case "passing_touchdowns":
      return numberValue(passing?.touchdowns);

    case "passing_attempts":
      return numberValue(passing?.attempts);

    case "passing_completions":
      return numberValue(passing?.completions);

    case "interceptions":
      return numberValue(passing?.interceptions);

    case "rushing_yards":
      return numberValue(rushing?.yards);

    case "rushing_attempts":
      return numberValue(
        rushing?.carries ??
          rushing?.attempts
      );

    case "receptions":
      return numberValue(receiving?.receptions);

    case "receiving_yards":
      return numberValue(receiving?.yards);

    default:
      return null;
  }
}

function getBookmakerEntries(
  payload: unknown
): Array<[string, unknown]> {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const object = payload as JsonObject;

  const bookmakers =
    object.bookmakers ||
    object.books ||
    object.odds;

  if (Array.isArray(bookmakers)) {
    return bookmakers.map((book, index) => {
      if (!book || typeof book !== "object") {
        return [`book-${index}`, book];
      }

      const row = book as JsonObject;

      return [
        cleanText(
          row.name ||
            row.title ||
            row.key ||
            `book-${index}`
        ),
        row.markets || row.odds || row,
      ];
    });
  }

  if (bookmakers && typeof bookmakers === "object") {
    return Object.entries(bookmakers as JsonObject);
  }

  /*
   * Odds-API.io can also return bookmaker names
   * directly as top-level properties.
   */
  const preferred = new Set(
    BOOKMAKERS.map((book) => book.toLowerCase())
  );

  return Object.entries(object).filter(([key]) =>
    preferred.has(key.toLowerCase())
  );
}

function getMarkets(value: unknown): JsonObject[] {
  if (Array.isArray(value)) {
    return value.filter(
      (row): row is JsonObject =>
        typeof row === "object" &&
        row !== null
    );
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const object = value as JsonObject;

  for (const key of ["markets", "odds", "data"]) {
    const child = object[key];

    if (Array.isArray(child)) {
      return child.filter(
        (row): row is JsonObject =>
          typeof row === "object" &&
          row !== null
      );
    }
  }

  return Object.entries(object).flatMap(
    ([name, child]) => {
      if (Array.isArray(child)) {
        return child
          .filter(
            (row): row is JsonObject =>
              typeof row === "object" &&
              row !== null
          )
          .map((row) => ({
            market_name: name,
            ...row,
          }));
      }

      return [];
    }
  );
}

function marketName(market: JsonObject): string {
  return cleanText(
    market.market_name ||
      market.marketName ||
      market.name ||
      market.key ||
      market.label ||
      market.type
  );
}

function getOddsRows(market: JsonObject): JsonObject[] {
  for (const key of [
    "outcomes",
    "odds",
    "selections",
    "participants",
    "players",
    "values",
    "rows",
  ]) {
    const value = market[key];

    if (Array.isArray(value)) {
      return value.filter(
        (row): row is JsonObject =>
          typeof row === "object" &&
          row !== null
      );
    }
  }

  return [];
}

function playerMatches(
  row: JsonObject,
  playerName: string
): boolean {
  const wanted = normalizeName(playerName);

  const candidate = normalizeName(
    row.player_name ||
      row.player ||
      row.label ||
      row.name ||
      row.participant ||
      row.description
  );

  if (!candidate) {
    return false;
  }

  return (
    candidate === wanted ||
    candidate.startsWith(`${wanted} `) ||
    candidate.endsWith(` ${wanted}`)
  );
}

function buildPropResult(
  playerName: string,
  projectionPlayer: PlayerProjection | null,
  sportsbook: string,
  market: JsonObject,
  row: JsonObject
): PropResult | null {
  const name = marketName(market);

  // Odds-API.io groups NFL player props inside a generic
  // "Player Props" market. The actual prop type is in the
  // individual row label, e.g. "Drake Maye (Passing Yards)".
  const rowPropName = cleanText(
    row.label ||
      row.name ||
      row.description ||
      row.participant
  );

  const propType =
    identifyPropType(rowPropName) ||
    identifyPropType(name);

  if (!propType) {
    return null;
  }

  if (!playerMatches(row, playerName)) {
    return null;
  }

  let line = firstNumber(
    row,
    "hdp",
    "line",
    "point",
    "total"
  );

  if (line === null) {
    line = firstNumber(
      market,
      "hdp",
      "line",
      "point",
      "total"
    );
  }

  /*
   * Standard Over/Under props require an actual
   * sportsbook line. We never manufacture one.
   */
  if (
    line === null &&
    propType !== "anytime_touchdown"
  ) {
    return null;
  }

  const overOdds = decimalToAmerican(
    firstNumber(
      row,
      "over",
      "overOdds",
      "over_odds",
      "overPrice",
      "over_price"
    )
  );

  const underOdds = decimalToAmerican(
    firstNumber(
      row,
      "under",
      "underOdds",
      "under_odds",
      "underPrice",
      "under_price"
    )
  );

  let yesOdds = decimalToAmerican(
    firstNumber(
      row,
      "yes",
      "yesOdds",
      "yes_odds"
    )
  );

  const noOdds = decimalToAmerican(
    firstNumber(
      row,
      "no",
      "noOdds",
      "no_odds"
    )
  );

  if (
    propType === "anytime_touchdown" &&
    yesOdds === null
  ) {
    /*
     * Odds-API.io represents Anytime TD as an "over" price
     * on a 0.5 touchdown line rather than a yes_odds field.
     */
    yesOdds =
      overOdds ??
      decimalToAmerican(
        firstNumber(
          row,
          "price",
          "odds",
          "value"
        )
      );
  }

  /*
   * Anytime TD is a YES/NO prediction. Alpha derives the scoring
   * probability from its projected rushing + receiving TD expectation,
   * independent of sportsbook odds:
   *
   * P(score >= 1 TD) = 1 - exp(-expected TDs)
   */
  if (propType === "anytime_touchdown") {
    const expectedTouchdowns =
      getProjectionForProp(
        projectionPlayer,
        propType
      );

    const touchdownProbability =
      expectedTouchdowns !== null
        ? Number(
            (
              (1 - Math.exp(-expectedTouchdowns))
              * 100
            ).toFixed(1)
          )
        : null;

    const tdPick: "YES" | "NO" | null =
      touchdownProbability === null
        ? null
        : touchdownProbability >= 50
          ? "YES"
          : "NO";

    return {
      player_name: playerName,
      player_id:
        cleanText(projectionPlayer?.player_id) ||
        null,
      team:
        normalizeTeam(projectionPlayer?.team) ||
        null,
      position:
        cleanText(projectionPlayer?.position) ||
        null,

      prop_type: propType,
      label: PROP_LABELS[propType] ?? rowPropName ?? name,

      line: line ?? 0.5,
      projection: touchdownProbability,
      difference: null,
      edge_percent: null,
      pick: tdPick,

      over_odds: null,
      under_odds: null,
      yes_odds: yesOdds,
      no_odds: noOdds,

      sportsbook,
      market_name: name || null,
    };
  }

  if (line === null) {
    return null;
  }

  const projection = getProjectionForProp(
    projectionPlayer,
    propType
  );

  const difference =
    projection !== null
      ? Number((projection - line).toFixed(2))
      : null;

  const edgePercent =
    difference !== null && line !== 0
      ? Number(
          ((difference / line) * 100).toFixed(2)
        )
      : null;

  let pick: "OVER" | "UNDER" | "YES" | "NO" | null = null;

  if (projection !== null) {
    if (projection > line) {
      pick = "OVER";
    } else if (projection < line) {
      pick = "UNDER";
    }
  }

  return {
    player_name: playerName,
    player_id:
      cleanText(projectionPlayer?.player_id) ||
      null,
    team:
      normalizeTeam(projectionPlayer?.team) ||
      null,
    position:
      cleanText(projectionPlayer?.position) ||
      null,

    prop_type: propType,
    label: PROP_LABELS[propType] ?? rowPropName ?? name,

    line,
    projection,
    difference,
    edge_percent: edgePercent,
    pick,

    over_odds: overOdds,
    under_odds: underOdds,
    yes_odds: yesOdds,
    no_odds: noOdds,

    sportsbook,
    market_name: name || null,
  };
}

async function fetchEventOdds(
  eventId: string
): Promise<unknown> {
  const apiKey =
    process.env.ODDS_API_IO_KEY ||
    process.env.ODDS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing ODDS_API_IO_KEY environment variable."
    );
  }

  const params = new URLSearchParams({
    apiKey,
    eventId,
    bookmakers: BOOKMAKERS.join(","),
  });

  const response = await fetch(
    `${ODDS_BASE_URL}/odds?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Odds-API.io returned ${response.status}: ${text.slice(
        0,
        500
      )}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "Odds-API.io returned invalid JSON."
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body =
      (await request.json()) as PlayerPropRequest;

    const playerName = cleanText(
      body.player_name || body.player
    );

    const eventId = cleanText(body.event_id);

    const slate =
      body.slate === "next" ? "next" : "current";

    if (!playerName) {
      return NextResponse.json(
        {
          ok: false,
          error: "player is required",
        },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        {
          ok: false,
          error: "event_id is required",
        },
        { status: 400 }
      );
    }

    const [oddsPayload, projections] =
      await Promise.all([
        fetchEventOdds(eventId),
        loadProjections(slate),
      ]);

    const projectionPlayer =
      findProjectionPlayer(
        projections,
        playerName,
        body.player_id,
        body.team
      );

    const props: PropResult[] = [];

    for (const [sportsbook, bookData] of
      getBookmakerEntries(oddsPayload)) {
      const markets = getMarkets(bookData);

      for (const market of markets) {
        for (const row of getOddsRows(market)) {
          const prop = buildPropResult(
            playerName,
            projectionPlayer,
            sportsbook,
            market,
            row
          );

          if (prop) {
            props.push(prop);
          }
        }
      }
    }

    /*
     * Keep one card per actual prop type. If both books post the same
     * market, prefer our configured order (FanDuel, then DraftKings).
     *
     * Also suppress unsupported statistical markets (such as Longest Rush)
     * when Alpha does not currently project that metric. We do not show a
     * blank card or manufacture a projection.
     */
    const usableProps = props.filter((prop) =>
      prop.prop_type === "anytime_touchdown" ||
      prop.projection !== null
    );

    usableProps.sort((a, b) => {
      const typeCompare =
        a.prop_type.localeCompare(b.prop_type);

      if (typeCompare !== 0) {
        return typeCompare;
      }

      return (
        BOOKMAKERS.indexOf(a.sportsbook ?? "") -
        BOOKMAKERS.indexOf(b.sportsbook ?? "")
      );
    });

    const uniqueProps: PropResult[] = [];
    const seenPropTypes = new Set<string>();

    for (const prop of usableProps) {
      if (seenPropTypes.has(prop.prop_type)) {
        continue;
      }

      seenPropTypes.add(prop.prop_type);
      uniqueProps.push(prop);
    }

    return NextResponse.json({
      ok: true,

      player: {
        player_name: playerName,
        player_id:
          cleanText(
            projectionPlayer?.player_id ||
              body.player_id
          ) || null,
        team:
          normalizeTeam(
            projectionPlayer?.team ||
              body.team
          ) || null,
        position:
          cleanText(
            projectionPlayer?.position
          ) || null,
      },

      game: {
        event_id: eventId,
        game_id: body.game_id || null,
        slate,
      },

      counts: {
        props: uniqueProps.length,
        projections_loaded:
          projections.length,
      },

      props: uniqueProps,
    });
  } catch (error) {
    console.error(
      "NFL player props route error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load NFL player props.",
      },
      { status: 500 }
    );
  }
}