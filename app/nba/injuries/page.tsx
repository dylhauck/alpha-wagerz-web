"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";


// ============================================================
// TYPES
// ============================================================

type NBATeam = {
  abbr?: string;
  abbreviation?: string;
  name?: string;
  full_name?: string;
  logo?: string;
};

type NBAGame = {
  game_id: string | number;
  away_team: string;
  home_team: string;
  away_abbr?: string;
  home_abbr?: string;
  game_date?: string;
  game_time?: string;
  game_datetime?: string;
  game_datetime_utc?: string;
};

type NBAInjury = {
  player_id?: string;
  player_name: string;
  team: string;
  position?: string;
  status: string;
  injury?: string;
  detail?: string;
  estimated_return_date?: string;
  reported_date?: string;
  source?: string;
};

type InjuryPayload = {
  generated_at?: string;
  source?: string;
  status?: string;
  injuries?: NBAInjury[];
};

type SlatePayload = {
  games?: NBAGame[];
};

type TeamPayload = {
  teams?: NBATeam[];
};


// ============================================================
// HELPERS
// ============================================================

function normalizeTeam(value: unknown) {
  const team = String(value || "")
    .trim()
    .toUpperCase();

  const aliases: Record<string, string> = {
    GS: "GSW",
    NY: "NYK",
    SA: "SAS",
    NO: "NOP",
    NOLA: "NOP",
    BRK: "BKN",
    PHO: "PHX",
    CHO: "CHA",
  };

  return aliases[team] || team;
}

function sameTeam(a: unknown, b: unknown) {
  return normalizeTeam(a) === normalizeTeam(b);
}

function getGames(payload: unknown): NBAGame[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const data = payload as SlatePayload | null;

  return Array.isArray(data?.games)
    ? data.games
    : [];
}

function getTeams(payload: unknown): NBATeam[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const data = payload as TeamPayload | null;

  return Array.isArray(data?.teams)
    ? data.teams
    : [];
}

function getInjuries(payload: unknown): NBAInjury[] {
  const data = payload as InjuryPayload | null;

  return Array.isArray(data?.injuries)
    ? data.injuries
    : [];
}

function formatTime(game: NBAGame) {
  // Use the actual game datetime when available.
  const raw =
    game.game_datetime_utc ||
    game.game_datetime;

  if (raw) {
    const date = new Date(raw);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  // Fallback: game_time comes from the NBA's
  // Eastern Time schedule field.
  const value = game.game_time || "";

  const match = value.match(
    /(?:T|^)(\d{1,2}):(\d{2})/
  );

  if (match) {
    const easternHour = Number(match[1]);
    const minute = match[2];

    // Eastern is one hour ahead of Central.
    const centralHour = (easternHour + 23) % 24;

    return `${centralHour % 12 || 12}:${minute} ${
      centralHour >= 12 ? "PM" : "AM"
    }`;
  }

  return "TBD";
}

function formatUpdated(value?: string) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function statusOrder(status: string) {
  const value = status.toUpperCase();

  if (
    value.includes("OUT") ||
    value.includes("INJURED RESERVE")
  ) {
    return 0;
  }

  if (value.includes("DOUBTFUL")) {
    return 1;
  }

  if (value.includes("QUESTIONABLE")) {
    return 2;
  }

  if (value.includes("DAY-TO-DAY")) {
    return 3;
  }

  if (value.includes("PROBABLE")) {
    return 4;
  }

  return 5;
}

function statusClass(status: string) {
  const value = status.toUpperCase();

  if (
    value.includes("OUT") ||
    value.includes("INJURED RESERVE")
  ) {
    return (
      "border-red-400/30 " +
      "bg-red-500/10 text-red-300"
    );
  }

  if (value.includes("DOUBTFUL")) {
    return (
      "border-orange-400/30 " +
      "bg-orange-500/10 text-orange-300"
    );
  }

  if (
    value.includes("QUESTIONABLE") ||
    value.includes("DAY-TO-DAY")
  ) {
    return (
      "border-amber-300/30 " +
      "bg-amber-400/10 text-amber-200"
    );
  }

  if (value.includes("PROBABLE")) {
    return (
      "border-emerald-300/30 " +
      "bg-emerald-400/10 text-emerald-200"
    );
  }

  return (
    "border-white/10 " +
    "bg-white/[0.04] text-slate-300"
  );
}


// ============================================================
// NBA TEAM LOGO
// ============================================================

function NBATeamLogo({
  team,
  teams,
  size = 44,
}: {
  team: string;
  teams: NBATeam[];
  size?: number;
}) {
  const code = normalizeTeam(team);

  const info = teams.find((item) => {
    return (
      sameTeam(
        item.abbr || item.abbreviation,
        code
      ) ||
      sameTeam(
        item.name || item.full_name,
        code
      )
    );
  });

  if (!info?.logo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white"
        style={{
          width: size,
          height: size,
        }}
      >
        {code.slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={info.logo}
      alt={team}
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}


// ============================================================
// TICKER LOGOS
// ============================================================

function NBALogoGlow({
  team,
  teams,
}: {
  team: string;
  teams: NBATeam[];
}) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-white/50 blur-xl" />

      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]">
        <NBATeamLogo
          team={team}
          teams={teams}
          size={28}
        />
      </div>
    </div>
  );
}


// ============================================================
// GAME SELECTOR
// ============================================================

function GameSelector({
  games,
  teams,
  selectedId,
  onSelect,
}: {
  games: NBAGame[];
  teams: NBATeam[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-scroll mt-2 pb-2">
      <div className="flex min-w-max gap-2">
        {games.map((game, index) => {
          const id = String(
            game.game_id ??
              `${game.away_team}-${game.home_team}-${index}`
          );

          const selected = id === selectedId;

          const away =
            game.away_abbr || game.away_team;

          const home =
            game.home_abbr || game.home_team;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`min-w-[150px] rounded-xl border px-3 py-2 transition ${
                selected
                  ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]"
                  : "border-white/10 bg-slate-950/80 hover:border-pink-300/40"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <NBALogoGlow
                  team={away}
                  teams={teams}
                />

                <span className="text-xs font-black text-slate-400">
                  @
                </span>

                <NBALogoGlow
                  team={home}
                  teams={teams}
                />
              </div>

              <div className="mt-2 text-center text-sm font-black text-white">
                {formatTime(game)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryBox({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: number;
  tone?: "cyan" | "red" | "amber";
}) {
  const color =
    tone === "red"
      ? "text-red-300"
      : tone === "amber"
        ? "text-amber-200"
        : "text-cyan-200";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div
        className={`mt-2 text-2xl font-black ${color}`}
      >
        {value}
      </div>
    </div>
  );
}


// ============================================================
// TEAM INJURY TABLE
// ============================================================

function InjuryTable({
  team,
  teams,
  injuries,
  dataAvailable,
}: {
  team: string;
  teams: NBATeam[];
  injuries: NBAInjury[];
  dataAvailable: boolean;
}) {
  return (
    <section className="glass overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <NBATeamLogo
            team={team}
            teams={teams}
            size={44}
          />

          <h2 className="text-xl font-black text-white">
            {team}
          </h2>
        </div>

        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
          {injuries.length}{" "}
          {injuries.length === 1
            ? "Injury"
            : "Injuries"}
        </div>
      </div>

      {!dataAvailable ? (
        <div className="p-6 text-sm text-slate-400">
          Injury report data is currently unavailable.
        </div>
      ) : injuries.length === 0 ? (
        <div className="p-6 text-sm text-slate-400">
          No injuries currently listed for {team}.
        </div>
      ) : (
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white/[0.04]">
              <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                <th className="px-4 py-3">
                  Player
                </th>

                <th className="px-4 py-3">
                  Pos
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  Injury
                </th>

                <th className="px-4 py-3">
                  Est. Return
                </th>

                <th className="px-4 py-3">
                  Details
                </th>
              </tr>
            </thead>

            <tbody>
              {injuries.map((row, index) => (
                <tr
                  key={
                    row.player_id ||
                    `${team}-${row.player_name}-${index}`
                  }
                  className="border-b border-white/[0.06] last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <div className="font-black text-white">
                      {row.player_name}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-300">
                    {row.position || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(
                        row.status
                      )}`}
                    >
                      {row.status || "Unknown"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-300">
                    {row.injury || "—"}
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-300">
                    {row.estimated_return_date || "—"}
                  </td>

                  <td className="max-w-xl px-4 py-4 text-sm text-slate-400">
                    {row.detail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function NBAInjuryReportPage() {
  const [rows, setRows] = useState<NBAInjury[]>([]);

  const [games, setGames] = useState<NBAGame[]>([]);

  const [teams, setTeams] = useState<NBATeam[]>([]);

  const [selectedGameId, setSelectedGameId] =
    useState("");

  const [generatedAt, setGeneratedAt] =
    useState("");

  const [dataAvailable, setDataAvailable] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  // ----------------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);

      try {
        const [
          injuryResponse,
          slateResponse,
          teamsResponse,
        ] = await Promise.all([
          fetch("/data/nba/injuries.json", {
            cache: "no-store",
          }),

          fetch("/data/nba/slate.json", {
            cache: "no-store",
          }),

          fetch("/data/nba/teams.json", {
            cache: "no-store",
          }),
        ]);

        const injuryPayload: InjuryPayload =
          injuryResponse.ok
            ? await injuryResponse.json()
            : {};

        const slatePayload =
          slateResponse.ok
            ? await slateResponse.json()
            : {};

        const teamsPayload =
          teamsResponse.ok
            ? await teamsResponse.json()
            : {};

        if (cancelled) {
          return;
        }

        const loadedGames =
          getGames(slatePayload);

        const loadedRows =
          getInjuries(injuryPayload);

        setGames(loadedGames);

        setRows(loadedRows);

        setTeams(getTeams(teamsPayload));

        setGeneratedAt(
          injuryPayload.generated_at || ""
        );

        setDataAvailable(
          injuryResponse.ok &&
            injuryPayload.status === "ok" &&
            Array.isArray(injuryPayload.injuries)
        );

        if (loadedGames.length) {
          setSelectedGameId(
            String(loadedGames[0].game_id)
          );
        }
      } catch (error) {
        console.error(
          "NBA injury report loading failed:",
          error
        );

        if (!cancelled) {
          setDataAvailable(false);
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

  // ----------------------------------------------------------
  // SELECTED MATCHUP
  // ----------------------------------------------------------

  const selectedGame = useMemo(() => {
    return (
      games.find(
        (game) =>
          String(game.game_id) ===
          selectedGameId
      ) ||
      games[0] ||
      null
    );
  }, [games, selectedGameId]);

  const selectedAway = selectedGame
    ? selectedGame.away_abbr ||
      selectedGame.away_team
    : "";

  const selectedHome = selectedGame
    ? selectedGame.home_abbr ||
      selectedGame.home_team
    : "";

  // ----------------------------------------------------------
  // SORT INJURIES
  // ----------------------------------------------------------

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const statusDifference =
        statusOrder(a.status || "") -
        statusOrder(b.status || "");

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return a.player_name.localeCompare(
        b.player_name
      );
    });
  }, [rows]);

  // ----------------------------------------------------------
  // TEAM INJURIES
  // ----------------------------------------------------------

  const awayInjuries = useMemo(() => {
    return sortedRows.filter((row) =>
      sameTeam(row.team, selectedAway)
    );
  }, [sortedRows, selectedAway]);

  const homeInjuries = useMemo(() => {
    return sortedRows.filter((row) =>
      sameTeam(row.team, selectedHome)
    );
  }, [sortedRows, selectedHome]);

  const selectedInjuries = useMemo(() => {
    return [
      ...awayInjuries,
      ...homeInjuries,
    ];
  }, [awayInjuries, homeInjuries]);

  // ----------------------------------------------------------
  // SUMMARY COUNTS
  // ----------------------------------------------------------

  const outCount = selectedInjuries.filter(
    (row) =>
      row.status
        .toUpperCase()
        .includes("OUT")
  ).length;

  const doubtfulCount = selectedInjuries.filter(
    (row) =>
      row.status
        .toUpperCase()
        .includes("DOUBTFUL")
  ).length;

  const questionableCount =
    selectedInjuries.filter((row) =>
      row.status
        .toUpperCase()
        .includes("QUESTIONABLE")
    ).length;

  // ----------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NBA injury reports...
      </section>
    );
  }

  // ----------------------------------------------------------
  // NO SLATE
  // ----------------------------------------------------------

  if (!selectedGame) {
    return (
      <div className="space-y-5">
        <h1 className="text-center text-3xl font-black neon-text">
          NBA Injury Report
        </h1>

        <section className="glass rounded-3xl p-8 text-center">
          <div className="text-lg font-black text-white">
            No NBA Games Available
          </div>

          <p className="mt-2 text-sm text-slate-400">
            The current NBA slate has not been loaded.
          </p>
        </section>
      </div>
    );
  }

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* PAGE TITLE */}

      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-3xl font-black neon-text">
          NBA Injury Report
        </h1>

        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {dataAvailable
            ? `${rows.length} NBA Injuries Loaded`
            : "Injury Data Unavailable"}
        </div>
      </div>

      {/* GAME TICKER */}

      <section className="glass rounded-3xl p-4">
        <GameSelector
          games={games}
          teams={teams}
          selectedId={selectedGameId}
          onSelect={setSelectedGameId}
        />
      </section>

      {/* MATCHUP SUMMARY */}

      <section className="glass rounded-3xl p-5">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
            NBA Injury Report
          </div>

          <h2 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">
            {selectedAway} @ {selectedHome}
          </h2>

          <p className="mt-1 text-sm font-bold text-slate-400">
            Current injury status for the selected matchup
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Last updated: {formatUpdated(generatedAt)}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <SummaryBox
            label="Total Injuries"
            value={selectedInjuries.length}
            tone="cyan"
          />

          <SummaryBox
            label="Out"
            value={outCount}
            tone="red"
          />

          <SummaryBox
            label="Doubtful"
            value={doubtfulCount}
            tone="amber"
          />

          <SummaryBox
            label="Questionable"
            value={questionableCount}
            tone="amber"
          />
        </div>
      </section>

      {/* TEAM REPORTS */}

      <div className="grid gap-5 2xl:grid-cols-2">
        <InjuryTable
          team={selectedAway}
          teams={teams}
          injuries={awayInjuries}
          dataAvailable={dataAvailable}
        />

        <InjuryTable
          team={selectedHome}
          teams={teams}
          injuries={homeInjuries}
          dataAvailable={dataAvailable}
        />
      </div>

      {/* DATA SOURCE */}

      <div className="pb-4 text-center text-xs text-slate-500">
        Injury information sourced from ESPN.
        Player availability may change before tipoff.
      </div>
    </div>
  );
}