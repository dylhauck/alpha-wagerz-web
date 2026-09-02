"use client";

import { useEffect, useMemo, useState } from "react";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";
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

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-black text-white">
        {value}
      </div>
    </div>
  );
}

function QuarterbackRow({
  player,
}: {
  player: NFLPlayer;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-3 lg:grid-cols-[190px_repeat(7,minmax(82px,1fr))]">
      <div className="min-w-0">
        <div className="truncate font-black text-white">
          {getPlayerName(player)}
        </div>

        <div className="text-xs font-bold text-slate-500">
          QB
        </div>
      </div>

      <StatBox
        label="Games vs Opp"
        value={formatNumber(
          player.games_vs_opponent,
          0,
        )}
      />

      <StatBox
        label="Pass Yds/G"
        value={formatNumber(
          player.pass_yards_per_game,
        )}
      />

      <StatBox
        label="Pass TD/G"
        value={formatNumber(
          player.pass_tds_per_game,
        )}
      />

      <StatBox
        label="INT/G"
        value={formatNumber(
          player.interceptions_per_game,
        )}
      />

      <StatBox
        label="Rush Yds/G"
        value={formatNumber(
          player.rush_yards_per_game,
        )}
      />

      <StatBox
        label="Rush TD/G"
        value={formatNumber(
          player.rush_tds_per_game,
        )}
      />

      <StatBox
        label="Fantasy/G"
        value={formatNumber(
          player.fantasy_points_per_game,
        )}
      />
    </div>
  );
}

function SkillPlayerRow({
  player,
}: {
  player: NFLPlayer;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-3 lg:grid-cols-[190px_repeat(7,minmax(82px,1fr))]">
      <div className="min-w-0">
        <div className="truncate font-black text-white">
          {getPlayerName(player)}
        </div>

        <div className="text-xs font-bold text-slate-500">
          {player.position || "—"}
        </div>
      </div>

      <StatBox
        label="Games vs Opp"
        value={formatNumber(
          player.games_vs_opponent,
          0,
        )}
      />

      <StatBox
        label="Carries/G"
        value={formatNumber(
          player.carries_per_game,
        )}
      />

      <StatBox
        label="Rush Yds/G"
        value={formatNumber(
          player.rush_yards_per_game,
        )}
      />

      <StatBox
        label="Targets/G"
        value={formatNumber(
          player.targets_per_game,
        )}
      />

      <StatBox
        label="Rec/G"
        value={formatNumber(
          player.receptions_per_game,
        )}
      />

      <StatBox
        label="Rec Yds/G"
        value={formatNumber(
          player.receiving_yards_per_game,
        )}
      />

      <StatBox
        label="Fantasy/G"
        value={formatNumber(
          player.fantasy_points_per_game,
        )}
      />
    </div>
  );
}

function PlayerMatchupTable({
  title,
  players,
}: {
  title: string;
  players: NFLPlayer[];
}) {
  const quarterbacks = players.filter(
    (player) =>
      String(
        player.position || "",
      ).toUpperCase() === "QB",
  );

  const skillPlayers = players.filter(
    (player) =>
      String(
        player.position || "",
      ).toUpperCase() !== "QB",
  );

  return (
    <section className="glass rounded-3xl p-4">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
          Opponent History
        </div>

        <h2 className="mt-1 text-xl font-black text-white">
          {title}
        </h2>
      </div>

      <div className="space-y-2">
        {quarterbacks.map(
          (player, index) => (
            <QuarterbackRow
              key={`qb-${player.player_id || getPlayerName(player)}-${index}`}
              player={player}
            />
          ),
        )}

        {skillPlayers.map(
          (player, index) => (
            <SkillPlayerRow
              key={`skill-${player.player_id || getPlayerName(player)}-${index}`}
              player={player}
            />
          ),
        )}

        {!players.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-center text-sm text-slate-500">
            Player matchup data not loaded yet.
          </div>
        ) : null}
      </div>
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

export default function NFLNextPage() {
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
    async function loadSlate() {
      try {
        const [
          slateResponse,
          teamsResponse,
        ] = await Promise.all([
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
          {games.length} NFL Games Loaded For Next Slate
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

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
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
      />

      <PlayerMatchupTable
        title={`${homeCode} Players vs ${awayCode}`}
        players={homePlayers}
      />
    </div>
  );
}