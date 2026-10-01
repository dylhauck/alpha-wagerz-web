"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type NBATeam = {
  abbr?: string;
  abbreviation?: string;
  name?: string;
  full_name?: string;
  logo?: string;
};

type StatTotals = {
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
};

type StatPerGame = {
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fg3m: number;
};

type Percentages = {
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
};

type PlayerStatBlock = {
  games: number;
  totals: StatTotals;
  per_game: StatPerGame;
  percentages: Percentages;
  season?: string;
  seasons?: string[];
  season_count?: number;
};

type NBAPlayerStat = {
  player_id: number;
  player_name: string;
  team: string;
  team_name?: string;
  position: string;
  position_group?: string;
  number?: string;
  current_season: PlayerStatBlock;
  last_season: PlayerStatBlock;
  career: PlayerStatBlock;
};

type PlayerStatsPayload = {
  generated_at?: string;
  league?: string;
  current_season?: string;
  last_season?: string;
  players?: NBAPlayerStat[];
};

type SeasonView =
  | "current_season"
  | "last_season"
  | "career";

type StatView = "per_game" | "totals";

type NumericSortKey =
  | "games"
  | "min"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "fg3m"
  | "fg_pct"
  | "fg3_pct"
  | "ft_pct";

type SortKey =
  | "player_name"
  | "team"
  | "position"
  | NumericSortKey;

type SortDirection = "asc" | "desc";

type TableRow = {
  player: NBAPlayerStat;
  games: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fg3m: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
};

type HeaderDefinition = {
  key: SortKey;
  label: string;
  align: "text-left" | "text-center";
};

const PLAYERS_PER_PAGE = 25;

const NUMERIC_COLUMNS: NumericSortKey[] = [
  "games",
  "min",
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "tov",
  "fg3m",
  "fg_pct",
  "fg3_pct",
  "ft_pct",
];

const TABLE_HEADERS: HeaderDefinition[] = [
  {
    key: "player_name",
    label: "Player",
    align: "text-left",
  },
  {
    key: "team",
    label: "Team",
    align: "text-left",
  },
  {
    key: "position",
    label: "Pos",
    align: "text-center",
  },
  {
    key: "games",
    label: "GP",
    align: "text-center",
  },
  {
    key: "min",
    label: "MIN",
    align: "text-center",
  },
  {
    key: "pts",
    label: "PTS",
    align: "text-center",
  },
  {
    key: "reb",
    label: "REB",
    align: "text-center",
  },
  {
    key: "ast",
    label: "AST",
    align: "text-center",
  },
  {
    key: "stl",
    label: "STL",
    align: "text-center",
  },
  {
    key: "blk",
    label: "BLK",
    align: "text-center",
  },
  {
    key: "tov",
    label: "TOV",
    align: "text-center",
  },
  {
    key: "fg3m",
    label: "3PM",
    align: "text-center",
  },
  {
    key: "fg_pct",
    label: "FG%",
    align: "text-center",
  },
  {
    key: "fg3_pct",
    label: "3P%",
    align: "text-center",
  },
  {
    key: "ft_pct",
    label: "FT%",
    align: "text-center",
  },
];

function normalizeTeam(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function findTeam(
  team: string,
  teams: NBATeam[],
) {
  const normalized = normalizeTeam(team);

  return teams.find((item) => {
    const abbr = normalizeTeam(
      item.abbr || item.abbreviation,
    );

    const name = normalizeTeam(
      item.name || item.full_name,
    );

    return (
      abbr === normalized ||
      name === normalized
    );
  });
}

function NBATeamLogo({
  team,
  teams,
  size = 30,
}: {
  team: string;
  teams: NBATeam[];
  size?: number;
}) {
  const teamData = findTeam(team, teams);

  if (!teamData?.logo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white"
        style={{
          width: size,
          height: size,
        }}
      >
        {normalizeTeam(team).slice(0, 3)}
      </div>
    );
  }

  return (
    <img
      src={teamData.logo}
      alt={team}
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value
    .toFixed(3)
    .replace(/^0/, "");
}

function formatPerGame(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(1);
}

function formatTotal(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

function getPositionGroup(position: string) {
  const value = String(position || "")
    .trim()
    .toUpperCase();

  if (!value) {
    return "N/A";
  }

  return value;
}

function isNumericSortKey(
  key: SortKey,
): key is NumericSortKey {
  return NUMERIC_COLUMNS.includes(
    key as NumericSortKey,
  );
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export default function NBAPlayersPage() {
  const [players, setPlayers] =
    useState<NBAPlayerStat[]>([]);

  const [teams, setTeams] =
    useState<NBATeam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [seasonView, setSeasonView] =
    useState<SeasonView>("last_season");

  const [statView, setStatView] =
    useState<StatView>("per_game");

  const [positionFilter, setPositionFilter] =
    useState("ALL");

  const [search, setSearch] =
    useState("");

  const [sortKey, setSortKey] =
    useState<SortKey>("pts");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          playerResponse,
          teamResponse,
        ] = await Promise.all([
          fetch(
            "/data/nba/player_stats.json",
            {
              cache: "no-store",
            },
          ),
          fetch(
            "/data/nba/teams.json",
            {
              cache: "no-store",
            },
          ),
        ]);

        if (!playerResponse.ok) {
          throw new Error(
            "NBA player statistics unavailable.",
          );
        }

        const playerPayload:
          | PlayerStatsPayload
          | NBAPlayerStat[] =
          await playerResponse.json();

        const loadedPlayers =
          Array.isArray(playerPayload)
            ? playerPayload
            : playerPayload.players || [];

        setPlayers(loadedPlayers);

        if (teamResponse.ok) {
          const teamPayload =
            await teamResponse.json();

          setTeams(
            Array.isArray(teamPayload)
              ? teamPayload
              : teamPayload.teams || [],
          );
        }
      } catch (err) {
        setPlayers([]);
        setTeams([]);

        setError(
          err instanceof Error
            ? err.message
            : "NBA player statistics unavailable.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const availablePositions =
    useMemo(() => {
      const actual = new Set(
        players.map((player) =>
          getPositionGroup(
            player.position,
          ),
        ),
      );

      const preferred = [
        "G",
        "G-F",
        "F-G",
        "F",
        "F-C",
        "C-F",
        "C",
        "N/A",
      ];

      return preferred.filter(
        (position) =>
          actual.has(position),
      );
    }, [players]);

  const rows = useMemo<TableRow[]>(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const mapped: TableRow[] = players
      .filter((player) => {
        if (
          positionFilter !== "ALL" &&
          getPositionGroup(
            player.position,
          ) !== positionFilter
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          player.player_name
            .toLowerCase()
            .includes(normalizedSearch) ||
          player.team
            .toLowerCase()
            .includes(normalizedSearch) ||
          String(
            player.team_name || "",
          )
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
      .map((player) => {
        const block =
          player[seasonView];

        const stats =
          statView === "per_game"
            ? block?.per_game
            : block?.totals;

        return {
          player,
          games:
            Number(block?.games) || 0,
          min:
            Number(stats?.min) || 0,
          pts:
            Number(stats?.pts) || 0,
          reb:
            Number(stats?.reb) || 0,
          ast:
            Number(stats?.ast) || 0,
          stl:
            Number(stats?.stl) || 0,
          blk:
            Number(stats?.blk) || 0,
          tov:
            Number(stats?.tov) || 0,
          fg3m:
            Number(stats?.fg3m) || 0,
          fg_pct:
            Number(
              block?.percentages?.fg_pct,
            ) || 0,
          fg3_pct:
            Number(
              block?.percentages?.fg3_pct,
            ) || 0,
          ft_pct:
            Number(
              block?.percentages?.ft_pct,
            ) || 0,
        };
      });

    mapped.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "player_name") {
        comparison =
          a.player.player_name.localeCompare(
            b.player.player_name,
          );
      } else if (sortKey === "team") {
        comparison =
          a.player.team.localeCompare(
            b.player.team,
          );
      } else if (
        sortKey === "position"
      ) {
        comparison =
          a.player.position.localeCompare(
            b.player.position,
          );
      } else if (
        isNumericSortKey(sortKey)
      ) {
        comparison =
          a[sortKey] - b[sortKey];
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return mapped;
  }, [
    players,
    seasonView,
    statView,
    positionFilter,
    search,
    sortKey,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      rows.length / PLAYERS_PER_PAGE,
    ),
  );

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      PLAYERS_PER_PAGE;

    return rows.slice(
      startIndex,
      startIndex + PLAYERS_PER_PAGE,
    );
  }, [rows, currentPage]);

  const visiblePages = useMemo(
    () =>
      getVisiblePages(
        currentPage,
        totalPages,
      ),
    [currentPage, totalPages],
  );

  const firstPlayer =
    rows.length === 0
      ? 0
      : (currentPage - 1) *
          PLAYERS_PER_PAGE +
        1;

  const lastPlayer = Math.min(
    currentPage * PLAYERS_PER_PAGE,
    rows.length,
  );

  function resetPage() {
    setCurrentPage(1);
  }

  function handleSeasonChange(
    value: SeasonView,
  ) {
    setSeasonView(value);
    resetPage();
  }

  function handleStatViewChange(
    value: StatView,
  ) {
    setStatView(value);
    resetPage();
  }

  function handlePositionChange(
    value: string,
  ) {
    setPositionFilter(value);
    resetPage();
  }

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value);
    resetPage();
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc"
          ? "desc"
          : "asc",
      );

      resetPage();
      return;
    }

    setSortKey(key);

    if (
      key === "player_name" ||
      key === "team" ||
      key === "position"
    ) {
      setSortDirection("asc");
    } else {
      setSortDirection("desc");
    }

    resetPage();
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) {
      return "";
    }

    return sortDirection === "asc"
      ? " ▲"
      : " ▼";
  }

  function formatValue(
    value: number,
    key: NumericSortKey,
  ) {
    if (
      key === "fg_pct" ||
      key === "fg3_pct" ||
      key === "ft_pct"
    ) {
      return formatPercentage(value);
    }

    if (key === "games") {
      return Math.round(
        value,
      ).toLocaleString();
    }

    return statView === "per_game"
      ? formatPerGame(value)
      : formatTotal(value);
  }

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NBA player statistics...
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 px-6 py-7">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <h1 className="text-3xl font-black neon-text sm:text-5xl">
              NBA Player Statistics
            </h1>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                {
                  key: "current_season",
                  label: "Current Season",
                },
                {
                  key: "last_season",
                  label: "Last Season",
                },
                {
                  key: "career",
                  label: "Career",
                },
              ].map((option) => {
                const active =
                  seasonView ===
                  option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      handleSeasonChange(
                        option.key as SeasonView,
                      )
                    }
                    className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                      active
                        ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                        : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[
                {
                  key: "per_game",
                  label: "Per Game",
                },
                {
                  key: "totals",
                  label: "Totals",
                },
              ].map((option) => {
                const active =
                  statView ===
                  option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      handleStatViewChange(
                        option.key as StatView,
                      )
                    }
                    className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                      active
                        ? "border-pink-300/60 bg-pink-500/15 text-pink-100"
                        : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-pink-300/35 hover:text-pink-100"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[
                "ALL",
                ...availablePositions,
              ].map((position) => {
                const active =
                  positionFilter ===
                  position;

                return (
                  <button
                    key={position}
                    type="button"
                    onClick={() =>
                      handlePositionChange(
                        position,
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${
                      active
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/10 bg-slate-950/40 text-slate-500 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {position}
                  </button>
                );
              })}
            </div>

            <div className="relative mt-5 w-full max-w-md">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  handleSearchChange(
                    event.target.value,
                  )
                }
                placeholder="Search player or team..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center">
            <div className="font-black text-red-300">
              {error}
            </div>

            <div className="mt-2 text-sm font-bold text-slate-500">
              Run the NBA player statistics
              pipeline to regenerate
              player_stats.json.
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center gap-1 border-b border-white/10 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:flex-row sm:gap-3">
              <span>
                {rows.length.toLocaleString()}{" "}
                Players
              </span>

              <span className="hidden sm:inline">
                •
              </span>

              <span>
                {seasonView ===
                "current_season"
                  ? "Current Season"
                  : seasonView ===
                      "last_season"
                    ? "Last Season"
                    : "Career"}{" "}
                •{" "}
                {statView === "per_game"
                  ? "Per Game"
                  : "Totals"}
              </span>
            </div>

            <div className="table-scroll overflow-x-auto">
              <table className="w-full min-w-[1450px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/50">
                    {TABLE_HEADERS.map(
                      ({
                        key,
                        label,
                        align,
                      }) => (
                        <th
                          key={key}
                          className={`whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 ${align}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleSort(key)
                            }
                            className="transition hover:text-white"
                          >
                            {label}
                            {sortIndicator(
                              key,
                            )}
                          </button>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map(
                    (row) => (
                      <tr
                        key={
                          row.player
                            .player_id
                        }
                        className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.035]"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="font-black text-white">
                            {
                              row.player
                                .player_name
                            }
                          </div>

                          {row.player
                            .number ? (
                            <div className="mt-0.5 text-xs font-bold text-slate-600">
                              #
                              {
                                row.player
                                  .number
                              }
                            </div>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <NBATeamLogo
                              team={
                                row.player
                                  .team
                              }
                              teams={teams}
                              size={28}
                            />

                            <span className="font-black text-slate-300">
                              {
                                row.player
                                  .team
                              }
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center font-black text-slate-300">
                          {row.player
                            .position ||
                            "N/A"}
                        </td>

                        {NUMERIC_COLUMNS.map(
                          (key) => (
                            <td
                              key={key}
                              className={`px-4 py-3 text-center ${
                                key ===
                                "pts"
                                  ? "font-black text-white"
                                  : "font-bold text-slate-300"
                              }`}
                            >
                              {formatValue(
                                row[key],
                                key,
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ),
                  )}

                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={15}
                        className="px-6 py-12 text-center text-sm font-bold text-slate-500"
                      >
                        No players match
                        the selected
                        filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {rows.length > 0 ? (
              <div className="border-t border-white/10 px-4 py-5 sm:px-6">
                <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
                  <div className="text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:text-left">
                    Showing{" "}
                    <span className="text-slate-300">
                      {firstPlayer}–
                      {lastPlayer}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-300">
                      {rows.length.toLocaleString()}
                    </span>{" "}
                    players
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1,
                            ),
                        )
                      }
                      disabled={
                        currentPage === 1
                      }
                      className="rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Previous
                    </button>

                    {visiblePages.map(
                      (page, index) => {
                        if (
                          page ===
                          "ellipsis"
                        ) {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-1 text-sm font-black text-slate-600"
                            >
                              ...
                            </span>
                          );
                        }

                        const active =
                          currentPage ===
                          page;

                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() =>
                              setCurrentPage(
                                page,
                              )
                            }
                            className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-black transition ${
                              active
                                ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                                : "border-white/10 bg-slate-950/50 text-slate-400 hover:border-cyan-300/40 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1,
                            ),
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      className="rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>

                  <div className="text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:text-right">
                    Page{" "}
                    <span className="text-slate-300">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-300">
                      {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}