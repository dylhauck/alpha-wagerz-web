"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Shield,
  Trophy,
} from "lucide-react";

type NBATeam = {
  abbr?: string;
  abbreviation?: string;
  name?: string;
  full_name?: string;
  logo?: string;
};

type NBAGame = {
  game_id: string | number;

  game?: string;

  away_team: string;
  home_team: string;

  away_abbr?: string;
  home_abbr?: string;

  away_record?: string;
  home_record?: string;

  venue?: string;
  arena?: string;

  game_datetime?: string;
  game_datetime_utc?: string;

  game_date?: string;
  game_time?: string;

  season?: number | string;
};

type MatchupStats = {
  games: number;
  min_per_game: number;
  pts_per_game: number;
  reb_per_game: number;
  ast_per_game: number;
  stl_per_game: number;
  blk_per_game: number;
  tov_per_game: number;
  fg3m_per_game: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  fantasy_per_game: number;
};

type SeasonSplit = MatchupStats & {
  season?: string;
  seasons?: string[];
};

type PlayerSplits = {
  current_season: SeasonSplit;
  last_season: SeasonSplit;
  last_3_seasons: SeasonSplit;
};

type NBAPlayerMatchup = {
  player_id: number;
  player_name: string;
  team: string;
  opponent: string;
  position: string;
  position_group?: string;
  number?: string;
  splits: PlayerSplits;
};

type NBAPlayerMatchupGame = {
  game_id: string | number;
  game_date?: string;
  away_team: string;
  home_team: string;
  away_players: NBAPlayerMatchup[];
  home_players: NBAPlayerMatchup[];
};

type NBAPlayerMatchupPayload = {
  generated_at?: string;
  league?: string;
  slate_type?: string;
  slate_date?: string;
  game_count?: number;
  games?: NBAPlayerMatchupGame[];
};

type SeasonFilter =
  | "current_season"
  | "last_season"
  | "last_3_seasons";

type SortKey =
  | "player_name"
  | "position"
  | "games"
  | "min_per_game"
  | "pts_per_game"
  | "reb_per_game"
  | "ast_per_game"
  | "stl_per_game"
  | "blk_per_game"
  | "tov_per_game"
  | "fg3m_per_game"
  | "fg_pct"
  | "fg3_pct"
  | "ft_pct"
  | "fantasy_per_game";

type SortDirection = "asc" | "desc";

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
  size = 44,
}: {
  team: string;
  teams: NBATeam[];
  size?: number;
}) {
  const teamData = findTeam(team, teams);

  if (!teamData?.logo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white"
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

function formatGameTime(game: NBAGame) {
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

      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
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

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGameCardTime(game: NBAGame) {
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

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function TeamMatchupCard({
  team,
  teams,
  record,
  align = "left",
}: {
  team: string;
  teams: NBATeam[];
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
        <NBATeamLogo
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
        <NBATeamLogo
          team={team}
          teams={teams}
          size={78}
        />
      ) : null}
    </div>
  );
}

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
                  <NBALogoGlow
                    team={awayCode}
                    teams={teams}
                  />

                  <span className="text-xs font-black text-slate-400">
                    @
                  </span>

                  <NBALogoGlow
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

function formatPercentage(
  value: number,
) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (value === 0) {
    return ".000";
  }

  return value.toFixed(3).replace(
    /^0/,
    "",
  );
}

function formatStat(
  value: number,
  digits = 1,
) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(digits);
}

function positionMatches(
  position: string,
  filter: string,
) {
  if (filter === "ALL") {
    return true;
  }

  const normalized =
    String(position || "N/A")
      .trim()
      .toUpperCase();

  return normalized === filter;
}

function PlayerMatchupTable({
  title,
  team,
  opponent,
  players,
  teams,
  accent,
}: {
  title: string;
  team: string;
  opponent: string;
  players: NBAPlayerMatchup[];
  teams: NBATeam[];
  accent: "cyan" | "pink";
}) {
  const [seasonFilter, setSeasonFilter] =
    useState<SeasonFilter>(
      "last_3_seasons",
    );

  const [positionFilter, setPositionFilter] =
    useState("ALL");

  const [sortKey, setSortKey] =
    useState<SortKey>("fantasy_per_game");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const availablePositions =
    useMemo(() => {
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

      const actual = new Set(
        players.map((player) =>
          String(
            player.position || "N/A",
          )
            .trim()
            .toUpperCase(),
        ),
      );

      return preferred.filter(
        (position) =>
          actual.has(position),
      );
    }, [players]);

  useEffect(() => {
    setPositionFilter("ALL");
  }, [team, opponent]);

  const rows = useMemo(() => {
    const filtered = players
      .filter((player) =>
        positionMatches(
          player.position,
          positionFilter,
        ),
      )
      .map((player) => ({
        player,
        stats:
          player.splits?.[
            seasonFilter
          ] || {
            games: 0,
            min_per_game: 0,
            pts_per_game: 0,
            reb_per_game: 0,
            ast_per_game: 0,
            stl_per_game: 0,
            blk_per_game: 0,
            tov_per_game: 0,
            fg3m_per_game: 0,
            fg_pct: 0,
            fg3_pct: 0,
            ft_pct: 0,
            fantasy_per_game: 0,
          },
      }));

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "player_name") {
        comparison =
          a.player.player_name.localeCompare(
            b.player.player_name,
          );
      } else if (
        sortKey === "position"
      ) {
        comparison =
          a.player.position.localeCompare(
            b.player.position,
          );
      } else {
        const aValue =
          Number(a.stats[sortKey]) || 0;

        const bValue =
          Number(b.stats[sortKey]) || 0;

        comparison = aValue - bValue;
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return filtered;
  }, [
    players,
    seasonFilter,
    positionFilter,
    sortKey,
    sortDirection,
  ]);

  function handleSort(
    key: SortKey,
  ) {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc"
          ? "desc"
          : "asc",
      );

      return;
    }

    setSortKey(key);

    if (
      key === "player_name" ||
      key === "position"
    ) {
      setSortDirection("asc");
    } else {
      setSortDirection("desc");
    }
  }

  function sortIndicator(
    key: SortKey,
  ) {
    if (sortKey !== key) {
      return "";
    }

    return sortDirection === "asc"
      ? " ▲"
      : " ▼";
  }

  const accentClasses =
    accent === "cyan"
      ? {
          border:
            "border-cyan-300/15",
          background:
            "bg-cyan-300/[0.045]",
          title:
            "text-cyan-200",
          active:
            "border-cyan-300/60 bg-cyan-300/15 text-cyan-100",
          hover:
            "hover:border-cyan-300/35 hover:text-cyan-100",
        }
      : {
          border:
            "border-pink-300/15",
          background:
            "bg-pink-500/[0.045]",
          title:
            "text-pink-200",
          active:
            "border-pink-300/60 bg-pink-500/15 text-pink-100",
          hover:
            "hover:border-pink-300/35 hover:text-pink-100",
        };

  return (
    <div
      className={`overflow-hidden rounded-3xl border ${accentClasses.border} ${accentClasses.background}`}
    >
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <NBATeamLogo
              team={team}
              teams={teams}
              size={46}
            />

            <div>
              <div
                className={`text-xs font-black uppercase tracking-[0.2em] ${accentClasses.title}`}
              >
                {title}
              </div>

              <div className="mt-1 text-xl font-black text-white">
                {team} Players vs{" "}
                {opponent}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
                key: "last_3_seasons",
                label: "Last 3 Seasons",
              },
            ].map((option) => {
              const active =
                seasonFilter ===
                option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    setSeasonFilter(
                      option.key as SeasonFilter,
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wide transition ${
                    active
                      ? accentClasses.active
                      : `border-white/10 bg-slate-950/40 text-slate-400 ${accentClasses.hover}`
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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
                  setPositionFilter(
                    position,
                  )
                }
                className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${
                  active
                    ? accentClasses.active
                    : `border-white/10 bg-slate-950/40 text-slate-400 ${accentClasses.hover}`
                }`}
              >
                {position}
              </button>
            );
          })}
        </div>
      </div>

      <div className="table-scroll overflow-x-auto">
        <table className="min-w-[1450px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/50">
              {[
                [
                  "player_name",
                  "Player",
                  "text-left",
                ],
                [
                  "position",
                  "Pos",
                  "text-center",
                ],
                [
                  "games",
                  "Games vs Opp",
                  "text-center",
                ],
                [
                  "min_per_game",
                  "Min/G",
                  "text-center",
                ],
                [
                  "pts_per_game",
                  "Pts/G",
                  "text-center",
                ],
                [
                  "fg3m_per_game",
                  "3PT/G",
                  "text-center",
        ],
                [
                  "reb_per_game",
                  "Reb/G",
                  "text-center",
                ],
                [
                  "ast_per_game",
                  "Ast/G",
                  "text-center",
                ],
                [
                  "stl_per_game",
                  "Stl/G",
                  "text-center",
                ],
                [
                  "blk_per_game",
                  "Blk/G",
                  "text-center",
                ],
                [
                  "tov_per_game",
                  "Tov/G",
                  "text-center",
                ],
                [
                  "fg_pct",
                  "FG%",
                  "text-center",
                ],
                [
                  "fg3_pct",
                  "3PT%",
                  "text-center",
                ],
                [
                  "ft_pct",
                  "FT%",
                  "text-center",
                ],
                [
                  "fantasy_per_game",
                  "Fantasy/G",
                  "text-center",
                ],
              ].map(
                ([
                  key,
                  label,
                  align,
                ]) => (
                  <th
                    key={key}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 ${align}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleSort(
                          key as SortKey,
                        )
                      }
                      className="transition hover:text-white"
                    >
                      {label}
                      {sortIndicator(
                        key as SortKey,
                      )}
                    </button>
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map(
              ({ player, stats }) => (
                <tr
                  key={player.player_id}
                  className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.035]"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-black text-white">
                      {player.player_name}
                    </div>

                    <div className="mt-0.5 text-xs font-bold text-slate-500">
                      {player.team} vs{" "}
                      {player.opponent}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center font-black text-slate-300">
                    {player.position ||
                      "N/A"}
                  </td>

                  <td className="px-4 py-3 text-center font-black text-white">
                    {stats.games}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.min_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.pts_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.fg3m_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.reb_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.ast_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.stl_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.blk_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatStat(
                      stats.tov_per_game,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatPercentage(
                      stats.fg_pct,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatPercentage(
                      stats.fg3_pct,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-slate-300">
                    {formatPercentage(
                      stats.ft_pct,
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-black text-white">
                    {formatStat(
                      stats.fantasy_per_game,
                    )}
                  </td>
                </tr>
              ),
            )}

            {!rows.length ? (
              <tr>
                <td
                  colSpan={15}
                  className="px-6 py-10 text-center text-sm font-bold text-slate-500"
                >
                  No players available for
                  this position filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function NBAPage() {
  const [games, setGames] =
    useState<NBAGame[]>([]);

  const [teams, setTeams] =
    useState<NBATeam[]>([]);

  const [
    matchupGames,
    setMatchupGames,
  ] = useState<
    NBAPlayerMatchupGame[]
  >([]);

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
          matchupResponse,
        ] = await Promise.all([
          fetch(
            "/data/nba/slate.json",
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

          fetch(
            "/data/nba/player_matchups.json",
            {
              cache: "no-store",
            },
          ),
        ]);

        if (!slateResponse.ok) {
          throw new Error(
            "NBA slate unavailable",
          );
        }

        const slatePayload =
          await slateResponse.json();

        const loadedGames: NBAGame[] =
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
              : teamsPayload.teams || [],
          );
        }

        if (matchupResponse.ok) {
          const matchupPayload: NBAPlayerMatchupPayload =
            await matchupResponse.json();

          setMatchupGames(
            Array.isArray(
              matchupPayload,
            )
              ? matchupPayload
              : matchupPayload.games ||
                  [],
          );
        } else {
          setMatchupGames([]);
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
        setMatchupGames([]);
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

  const selectedMatchupGame =
    useMemo(() => {
      if (!selectedGame) {
        return null;
      }

      const selectedAway =
        normalizeTeam(
          selectedGame.away_abbr ||
            selectedGame.away_team,
        );

      const selectedHome =
        normalizeTeam(
          selectedGame.home_abbr ||
            selectedGame.home_team,
        );

      return (
        matchupGames.find(
          (game) =>
            String(game.game_id) ===
            String(
              selectedGame.game_id,
            ),
        ) ||
        matchupGames.find(
          (game) =>
            normalizeTeam(
              game.away_team,
            ) === selectedAway &&
            normalizeTeam(
              game.home_team,
            ) === selectedHome,
        ) ||
        null
      );
    }, [
      matchupGames,
      selectedGame,
    ]);

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NBA slate...
      </section>
    );
  }

  if (!selectedGame) {
    return (
      <div className="space-y-5">
        <section className="glass rounded-3xl p-6">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
              Alpha Wagerz NBA
            </div>

            <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
              NBA Slate Summary
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              NBA slate data has not
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

  const venue =
    selectedGame.arena ||
    selectedGame.venue ||
    "Arena TBD";

  const awayPlayers =
    selectedMatchupGame?.away_players ||
    [];

  const homePlayers =
    selectedMatchupGame?.home_players ||
    [];

  return (
    <div className="space-y-5">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {games.length} NBA Games Loaded
          For Current Slate
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
              NBA Slate Summary
            </div>

            <h1 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">
              {selectedGame.game ||
                `${awayCode} @ ${homeCode}`}
            </h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-400">
              <span className="flex items-center gap-2">
                <CalendarDays
                  size={15}
                />

                {selectedGame.game_date ||
                  "Date TBD"}
              </span>

              <span className="flex items-center gap-2">
                <Clock3 size={15} />

                {formatGameTime(
                  selectedGame,
                )}
              </span>

              <span className="flex items-center gap-2">
                <MapPin size={15} />

                {venue}
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

          <div className="mt-7">
            <div className="mb-4 text-center">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
                Matchup History
              </div>

              <h2 className="mt-1 text-2xl font-black text-white">
                Player Matchup History
              </h2>
            </div>

            {selectedMatchupGame ? (
              <div className="space-y-5">
                <PlayerMatchupTable
                  title="Away Players"
                  team={awayCode}
                  opponent={homeCode}
                  players={awayPlayers}
                  teams={teams}
                  accent="cyan"
                />

                <PlayerMatchupTable
                  title="Home Players"
                  team={homeCode}
                  opponent={awayCode}
                  players={homePlayers}
                  teams={teams}
                  accent="pink"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-6 py-10 text-center">
                <div className="text-sm font-black text-slate-300">
                  Player matchup data
                  unavailable for{" "}
                  {awayCode} @ {homeCode}.
                </div>

                <div className="mt-2 text-xs font-bold text-slate-500">
                  Run the NBA player
                  matchup pipeline to
                  regenerate
                  player_matchups.json.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}