"use client";

import { useEffect, useMemo, useState } from "react";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";
import PlayerPropsModal from "@/components/nfl/PlayerPropsModal";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Shield,
  Trophy,
} from "lucide-react";

type NFLTeam = {
  abbr?: string;
  name?: string;
  logo?: string;
};

type NFLPlayer = {
  player_id?: string | number;
  player?: string;
  name?: string;
  position?: string;
  team?: string;

  games_vs_opponent?: number;

  pass_yards_per_game?: number;
  pass_tds_per_game?: number;
  interceptions_per_game?: number;

  carries_per_game?: number;
  rush_yards_per_game?: number;
  rush_tds_per_game?: number;

  targets_per_game?: number;
  receptions_per_game?: number;
  receiving_yards_per_game?: number;
  receiving_tds_per_game?: number;

  fantasy_points_per_game?: number;
};

type NFLGame = {
  game_id: string | number;

  game?: string;

  away_team: string;
  home_team: string;

  away_abbr?: string;
  home_abbr?: string;

  venue?: string;
  game_datetime?: string;
  game_datetime_utc?: string;

  game_date?: string;
  game_time?: string;

  week?: number | string;
  season?: number | string;

  away_record?: string;
  home_record?: string;

  players?: {
    away?: NFLPlayer[];
    home?: NFLPlayer[];
  };
};

type NFLOddsGame = {
  event_id?: string | number;
  game_id?: string | number;
  away_team?: string;
  home_team?: string;
};

type SelectedPlayer = {
  playerName: string;
  playerId?: string | null;
  team?: string | null;
  position?: string | null;
};

type PositionFilter =
  | "ALL"
  | "QB"
  | "RB"
  | "WR"
  | "TE";

type SortDirection =
  | "asc"
  | "desc";

type PlayerSortKey =
  | "player"
  | "position"
  | keyof Pick<
      NFLPlayer,
      | "games_vs_opponent"
      | "pass_yards_per_game"
      | "pass_tds_per_game"
      | "interceptions_per_game"
      | "carries_per_game"
      | "rush_yards_per_game"
      | "rush_tds_per_game"
      | "targets_per_game"
      | "receptions_per_game"
      | "receiving_yards_per_game"
      | "receiving_tds_per_game"
      | "fantasy_points_per_game"
    >;

type PlayerColumn = {
  key: PlayerSortKey;
  label: string;
  decimals?: number;
  align?: "left" | "center";
};

const POSITION_FILTERS: PositionFilter[] = [
  "QB",
  "RB",
  "WR",
  "TE",
];

const ALL_COLUMNS: PlayerColumn[] = [
  {
    key: "player",
    label: "Player",
    align: "left",
  },
  {
    key: "position",
    label: "Pos",
    align: "center",
  },
  {
    key: "games_vs_opponent",
    label: "Games vs Opp",
    decimals: 0,
    align: "center",
  },
  {
    key: "fantasy_points_per_game",
    label: "Fantasy/G",
    align: "center",
  },
];

const QB_COLUMNS: PlayerColumn[] = [
  {
    key: "player",
    label: "Player",
    align: "left",
  },
  {
    key: "position",
    label: "Pos",
    align: "center",
  },
  {
    key: "games_vs_opponent",
    label: "Games vs Opp",
    decimals: 0,
    align: "center",
  },
  {
    key: "pass_yards_per_game",
    label: "Pass Yds/G",
    align: "center",
  },
  {
    key: "pass_tds_per_game",
    label: "Pass TD/G",
    align: "center",
  },
  {
    key: "interceptions_per_game",
    label: "INT/G",
    align: "center",
  },
  {
    key: "rush_yards_per_game",
    label: "Rush Yds/G",
    align: "center",
  },
  {
    key: "rush_tds_per_game",
    label: "Rush TD/G",
    align: "center",
  },
  {
    key: "fantasy_points_per_game",
    label: "Fantasy/G",
    align: "center",
  },
];

const RB_COLUMNS: PlayerColumn[] = [
  {
    key: "player",
    label: "Player",
    align: "left",
  },
  {
    key: "position",
    label: "Pos",
    align: "center",
  },
  {
    key: "games_vs_opponent",
    label: "Games vs Opp",
    decimals: 0,
    align: "center",
  },
  {
    key: "carries_per_game",
    label: "Carries/G",
    align: "center",
  },
  {
    key: "rush_yards_per_game",
    label: "Rush Yds/G",
    align: "center",
  },
  {
    key: "rush_tds_per_game",
    label: "Rush TD/G",
    align: "center",
  },
  {
    key: "targets_per_game",
    label: "Targets/G",
    align: "center",
  },
  {
    key: "receptions_per_game",
    label: "Rec/G",
    align: "center",
  },
  {
    key: "receiving_yards_per_game",
    label: "Rec Yds/G",
    align: "center",
  },
  {
    key: "receiving_tds_per_game",
    label: "Rec TD/G",
    align: "center",
  },
  {
    key: "fantasy_points_per_game",
    label: "Fantasy/G",
    align: "center",
  },
];

const RECEIVER_COLUMNS: PlayerColumn[] = [
  {
    key: "player",
    label: "Player",
    align: "left",
  },
  {
    key: "position",
    label: "Pos",
    align: "center",
  },
  {
    key: "games_vs_opponent",
    label: "Games vs Opp",
    decimals: 0,
    align: "center",
  },
  {
    key: "targets_per_game",
    label: "Targets/G",
    align: "center",
  },
  {
    key: "receptions_per_game",
    label: "Rec/G",
    align: "center",
  },
  {
    key: "receiving_yards_per_game",
    label: "Rec Yds/G",
    align: "center",
  },
  {
    key: "receiving_tds_per_game",
    label: "Rec TD/G",
    align: "center",
  },
  {
    key: "fantasy_points_per_game",
    label: "Fantasy/G",
    align: "center",
  },
];

function safeNumber(value: unknown) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return null;
  }

  return numeric;
}

function formatNumber(
  value: unknown,
  decimals = 1,
) {
  const numeric = safeNumber(value);

  if (numeric === null) {
    return "—";
  }

  if (Number.isInteger(numeric)) {
    return numeric.toString();
  }

  return numeric
    .toFixed(decimals)
    .replace(/\.0$/, "");
}

function formatGameTime(game: NFLGame) {
  if (game.game_date && game.game_time) {
    const [year, month, day] =
      game.game_date
        .split("-")
        .map(Number);

    const [hour, minute] =
      game.game_time
        .split(":")
        .map(Number);

    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      Number.isFinite(hour) &&
      Number.isFinite(minute)
    ) {
      const date = new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
      );

      return date.toLocaleString(
        "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        },
      );
    }
  }

  const raw =
    game.game_datetime_utc ||
    game.game_datetime;

  if (!raw) {
    return "TBD";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function formatGameCardTime(game: NFLGame) {
  if (game.game_time) {
    const [hourString, minuteString] =
      game.game_time.split(":");

    const hour = Number(hourString);
    const minute = Number(minuteString);

    if (
      Number.isFinite(hour) &&
      Number.isFinite(minute)
    ) {
      const period =
        hour >= 12 ? "PM" : "AM";

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

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
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

function getPlayerName(player: NFLPlayer) {
  return (
    player.player ||
    player.name ||
    "Unknown Player"
  );
}

function normalizePosition(
  value?: string,
): PositionFilter | "" {
  const position =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    position === "QB" ||
    position === "RB" ||
    position === "WR" ||
    position === "TE"
  ) {
    return position;
  }

  return "";
}

function columnsForPosition(
  position: PositionFilter,
) {
  if (position === "QB") {
    return QB_COLUMNS;
  }

  if (position === "RB") {
    return RB_COLUMNS;
  }

  if (
    position === "WR" ||
    position === "TE"
  ) {
    return RECEIVER_COLUMNS;
  }

  return ALL_COLUMNS;
}

function playerSortValue(
  player: NFLPlayer,
  key: PlayerSortKey,
): string | number | null {
  if (key === "player") {
    return getPlayerName(player);
  }

  if (key === "position") {
    return normalizePosition(
      player.position,
    );
  }

  const value = player[key];

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric)
    ? numeric
    : null;
}

function comparePlayerValues(
  a: string | number | null,
  b: string | number | null,
  direction: SortDirection,
) {
  const aMissing =
    a === null ||
    a === undefined ||
    a === "";

  const bMissing =
    b === null ||
    b === undefined ||
    b === "";

  if (aMissing && bMissing) {
    return 0;
  }

  if (aMissing) {
    return 1;
  }

  if (bMissing) {
    return -1;
  }

  let comparison = 0;

  if (
    typeof a === "number" &&
    typeof b === "number"
  ) {
    comparison = a - b;
  } else {
    comparison = String(a).localeCompare(
      String(b),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      },
    );
  }

  return direction === "asc"
    ? comparison
    : -comparison;
}

function defaultSortForPosition(
  position: PositionFilter,
): {
  key: PlayerSortKey;
  direction: SortDirection;
} {
  if (position === "ALL") {
    return {
      key: "player",
      direction: "asc",
    };
  }

  return {
    key: "fantasy_points_per_game",
    direction: "desc",
  };
}

function TeamMatchupCard({
  team,
  teams,
  record,
  align = "left",
}: {
  team: string;
  teams: NFLTeam[];
  record?: string;
  align?: "left" | "right";
}) {
  const right = align === "right";

  return (
    <div
      className={`flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 ${
        right
          ? "justify-end text-right"
          : ""
      }`}
    >
      {!right ? (
        <NFLTeamLogo
          team={team}
          teams={teams}
          size={78}
        />
      ) : null}

      <div>
        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {right
            ? "Home Team"
            : "Away Team"}
        </div>

        <div className="mt-1 text-2xl font-black text-white">
          {team}
        </div>

        <div className="mt-1 text-sm font-bold text-slate-400">
          {record || "Record —"}
        </div>
      </div>

      {right ? (
        <NFLTeamLogo
          team={team}
          teams={teams}
          size={78}
        />
      ) : null}
    </div>
  );
}

function PositionButton({
  position,
  active,
  onClick,
}: {
  position: PositionFilter;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-5 py-3 text-sm font-black transition ${
        active
          ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.12)]"
          : "border-white/10 bg-white/[0.025] text-slate-500 hover:border-white/20 hover:text-white"
      }`}
    >
      {position}
    </button>
  );
}

function SortablePlayerHeader({
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  column: PlayerColumn;
  sortKey: PlayerSortKey;
  sortDirection: SortDirection;
  onSort: (key: PlayerSortKey) => void;
}) {
  const active =
    sortKey === column.key;

  return (
    <th
      className={`whitespace-nowrap px-4 py-3 ${
        column.align === "center"
          ? "text-center"
          : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          onSort(column.key)
        }
        className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
          active
            ? "text-cyan-200"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <span>{column.label}</span>

        <span
          className={
            active
              ? "opacity-100"
              : "opacity-35"
          }
        >
          {active
            ? sortDirection === "asc"
              ? "▲"
              : "▼"
            : "↕"}
        </span>
      </button>
    </th>
  );
}

function PlayerMatchupTable({
  title,
  players,
  onPlayerClick,
}: {
  title: string;
  players: NFLPlayer[];
  onPlayerClick: (player: NFLPlayer) => void;
}) {
  const [
    positionFilter,
    setPositionFilter,
  ] =
    useState<PositionFilter>("ALL");

  const [sortKey, setSortKey] =
    useState<PlayerSortKey>("player");

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<SortDirection>("asc");

  const columns =
    useMemo(
      () =>
        columnsForPosition(
          positionFilter,
        ),
      [positionFilter],
    );

  const filteredPlayers =
    useMemo(() => {
      if (positionFilter === "ALL") {
        return players.filter((player) =>
          Boolean(
            normalizePosition(
              player.position,
            ),
          ),
        );
      }

      return players.filter(
        (player) =>
          normalizePosition(
            player.position,
          ) === positionFilter,
      );
    }, [
      players,
      positionFilter,
    ]);

  const sortedPlayers =
    useMemo(
      () =>
        [...filteredPlayers].sort(
          (a, b) => {
            const comparison =
              comparePlayerValues(
                playerSortValue(
                  a,
                  sortKey,
                ),
                playerSortValue(
                  b,
                  sortKey,
                ),
                sortDirection,
              );

            if (comparison !== 0) {
              return comparison;
            }

            return getPlayerName(
              a,
            ).localeCompare(
              getPlayerName(b),
            );
          },
        ),
      [
        filteredPlayers,
        sortKey,
        sortDirection,
      ],
    );

  function handlePositionChange(
    position: PositionFilter,
  ) {
    setPositionFilter(position);

    const nextSort =
      defaultSortForPosition(
        position,
      );

    setSortKey(nextSort.key);
    setSortDirection(
      nextSort.direction,
    );
  }

  function handleSort(
    key: PlayerSortKey,
  ) {
    if (key === sortKey) {
      setSortDirection(
        (current) =>
          current === "asc"
            ? "desc"
            : "asc",
      );

      return;
    }

    setSortKey(key);

    if (
      key === "player" ||
      key === "position"
    ) {
      setSortDirection("asc");
    } else {
      setSortDirection("desc");
    }
  }

  return (
    <section className="glass overflow-hidden rounded-3xl">
      <div className="p-5">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
          Matchup History
        </div>

        <h2 className="mt-1 text-xl font-black text-white">
          {title}
        </h2>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {POSITION_FILTERS.map(
            (position) => (
              <PositionButton
                key={position}
                position={position}
                active={
                  positionFilter ===
                  position
                }
                onClick={() =>
                  handlePositionChange(
                    position,
                  )
                }
              />
            ),
          )}
        </div>
      </div>

      {sortedPlayers.length ? (
        <div className="table-scroll overflow-x-auto border-t border-white/10">
          <table className="w-full min-w-[920px]">
            <thead className="bg-white/[0.04]">
              <tr className="border-b border-white/10">
                {columns.map(
                  (column) => (
                    <SortablePlayerHeader
                      key={column.key}
                      column={column}
                      sortKey={sortKey}
                      sortDirection={
                        sortDirection
                      }
                      onSort={
                        handleSort
                      }
                    />
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {sortedPlayers.map(
                (player, index) => (
                  <tr
                    key={
                      player.player_id ||
                      `${getPlayerName(
                        player,
                      )}-${index}`
                    }
                    className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.025]"
                  >
                    {columns.map(
                      (column) => {
                        if (
                          column.key ===
                          "player"
                        ) {
                          return (
                            <td
                              key={
                                column.key
                              }
                              className="min-w-[220px] px-4 py-4"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  onPlayerClick(
                                    player,
                                  )
                                }
                                className="font-black text-white transition hover:text-cyan-200 hover:underline"
                              >
                                {getPlayerName(
                                  player,
                                )}
                              </button>
                            </td>
                          );
                        }

                        if (
                          column.key ===
                          "position"
                        ) {
                          return (
                            <td
                              key={
                                column.key
                              }
                              className="px-4 py-4 text-center text-sm font-black text-slate-300"
                            >
                              {normalizePosition(
                                player.position,
                              ) || "—"}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={
                              column.key
                            }
                            className="px-4 py-4 text-center text-sm font-black text-white"
                          >
                            {formatNumber(
                              player[
                                column.key
                              ],
                              column.decimals ??
                                1,
                            )}
                          </td>
                        );
                      },
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-white/10 p-6 text-center text-sm text-slate-500">
          {players.length
            ? `No ${positionFilter} players loaded for this matchup.`
            : "Player matchup data not loaded yet."}
        </div>
      )}
    </section>
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
    <div className="mb-4">
      <div className="table-scroll mt-2 pb-2">
        <div className="flex min-w-max gap-2">
          {games.map((game) => {
            const id = String(
              game.game_id,
            );

            const selected =
              id === selectedId;

            const awayCode =
              game.away_abbr ||
              game.away_team;

            const homeCode =
              game.home_abbr ||
              game.home_team;

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
          })}
        </div>
      </div>
    </div>
  );
}

export default function NFLPage() {
  const [games, setGames] =
    useState<NFLGame[]>([]);

  const [teams, setTeams] =
    useState<NFLTeam[]>([]);

  const [oddsGames, setOddsGames] =
    useState<NFLOddsGame[]>([]);

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] = useState<SelectedPlayer | null>(
    null,
  );

  const [
    selectedGameId,
    setSelectedGameId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadSlate() {
      try {
        const [
          slateResponse,
          teamsResponse,
          oddsResponse,
        ] = await Promise.all([
          fetch(
            "/data/nfl/slate.json",
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

          fetch(
            "/data/nfl/odds.json",
            {
              cache: "no-store",
            },
          ),
        ]);

        if (!slateResponse.ok) {
          throw new Error(
            "NFL slate unavailable",
          );
        }

        const slatePayload =
          await slateResponse.json();

        const loadedGames: NFLGame[] =
          Array.isArray(slatePayload)
            ? slatePayload
            : slatePayload.games || [];

        setGames(loadedGames);

        if (teamsResponse.ok) {
          const teamsPayload =
            await teamsResponse.json();

          setTeams(
            Array.isArray(teamsPayload)
              ? teamsPayload
              : [],
          );
        }

        if (oddsResponse.ok) {
          const oddsPayload =
            await oddsResponse.json();

          setOddsGames(
            Array.isArray(oddsPayload)
              ? oddsPayload
              : oddsPayload.games || [],
          );
        }

        if (loadedGames.length) {
          setSelectedGameId(
            String(
              loadedGames[0].game_id,
            ),
          );
        }
      } catch {
        setGames([]);
        setTeams([]);
        setOddsGames([]);
      } finally {
        setLoading(false);
      }
    }

    loadSlate();
  }, []);

  const selectedGame =
    useMemo(() => {
      if (!games.length) {
        return null;
      }

      return (
        games.find(
          (game) =>
            String(game.game_id) ===
            selectedGameId,
        ) || games[0]
      );
    }, [
      games,
      selectedGameId,
    ]);

  const selectedOddsGame =
    useMemo(() => {
      if (!selectedGame) {
        return null;
      }

      const gameId = String(
        selectedGame.game_id || "",
      );

      return (
        oddsGames.find(
          (game) =>
            String(game.game_id || "") ===
            gameId,
        ) || null
      );
    }, [oddsGames, selectedGame]);

  function handlePlayerClick(
    player: NFLPlayer,
  ) {
    setSelectedPlayer({
      playerName: getPlayerName(player),
      playerId:
        player.player_id != null
          ? String(player.player_id)
          : null,
      team: player.team || null,
      position: player.position || null,
    });
  }

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NFL slate...
      </section>
    );
  }

  if (!selectedGame) {
    return (
      <div className="space-y-5">
        <section className="glass rounded-3xl p-6">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
              Alpha Wagerz NFL
            </div>

            <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
              NFL Slate Summary
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              NFL slate data has not
              been generated yet.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const awayCode =
    selectedGame.away_abbr ||
    selectedGame.away_team;

  const homeCode =
    selectedGame.home_abbr ||
    selectedGame.home_team;

  const awayPlayers =
    selectedGame.players?.away || [];

  const homePlayers =
    selectedGame.players?.home || [];

  return (
    <div className="space-y-5">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {games.length} NFL Games Loaded For Current Slate
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

        <div className="rounded-3xl border border-cyan-300/15 bg-white/[0.035] p-5">
          <div className="mb-5 text-center">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
              NFL Slate Summary
            </div>

            <h1 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">
              {selectedGame.game ||
                `${selectedGame.away_team} @ ${selectedGame.home_team}`}
            </h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-400">
              <span className="flex items-center gap-2">
                <CalendarDays
                  size={15}
                />

                Week{" "}
                {selectedGame.week ||
                  "—"}
              </span>

              <span className="flex items-center gap-2">
                <Clock3 size={15} />

                {formatGameTime(
                  selectedGame,
                )}
              </span>

              <span className="flex items-center gap-2">
                <MapPin size={15} />

                {selectedGame.venue ||
                  "Venue TBD"}
              </span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
            <TeamMatchupCard
              team={awayCode}
              teams={teams}
              record={
                selectedGame.away_record
              }
              align="left"
            />

            <div className="hidden items-center justify-center xl:flex">
              <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-xl font-black text-white">
                @
              </div>
            </div>

            <TeamMatchupCard
              team={homeCode}
              teams={teams}
              record={
                selectedGame.home_record
              }
              align="right"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                <Shield size={15} />
                Away Matchup
              </div>

              <div className="mt-2 text-lg font-black text-white">
                {awayCode} offense vs{" "}
                {homeCode} defense
              </div>
            </div>

            <div className="rounded-2xl border border-pink-300/15 bg-pink-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-pink-200">
                <Trophy size={15} />
                Home Matchup
              </div>

              <div className="mt-2 text-lg font-black text-white">
                {homeCode} offense vs{" "}
                {awayCode} defense
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlayerMatchupTable
        title={`${awayCode} Players vs ${homeCode}`}
        players={awayPlayers}
        onPlayerClick={handlePlayerClick}
      />

      <PlayerMatchupTable
        title={`${homeCode} Players vs ${awayCode}`}
        players={homePlayers}
        onPlayerClick={handlePlayerClick}
      />

      <PlayerPropsModal
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
        playerName={
          selectedPlayer?.playerName || null
        }
        playerId={
          selectedPlayer?.playerId || null
        }
        team={selectedPlayer?.team || null}
        position={
          selectedPlayer?.position || null
        }
        eventId={
          selectedOddsGame?.event_id != null
            ? String(selectedOddsGame.event_id)
            : null
        }
        gameId={
          selectedGame.game_id != null
            ? String(selectedGame.game_id)
            : null
        }
        slate="current"
      />
    </div>
  );
}
