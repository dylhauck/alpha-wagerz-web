"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trophy,
  History,
  Swords,
  BarChart3,
  Sigma,
} from "lucide-react";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type DataView =
  | "season"
  | "career"
  | "matchup";

type StatMode =
  | "totals"
  | "averages";

type PositionFilter =
  | "ALL"
  | "QB"
  | "RB"
  | "WR"
  | "TE";

type NFLPlayer = {
  career_totals?: {
    games?: number;

    passing_yards?: number;
    passing_tds?: number;
    interceptions?: number;

    carries?: number;
    rushing_yards?: number;
    rushing_tds?: number;

    targets?: number;
    receptions?: number;
    receiving_yards?: number;
    receiving_tds?: number;

    fantasy_points?: number;
    fantasy_points_ppr?: number;
  };

  career_averages?: {
    passing_yards?: number;
    passing_tds?: number;
    interceptions?: number;

    carries?: number;
    rushing_yards?: number;
    rushing_tds?: number;

    targets?: number;
    receptions?: number;
    receiving_yards?: number;
    receiving_tds?: number;

    fantasy_points?: number;
    fantasy_points_ppr?: number;
  };

  seasons?: {
    season?: number;

    totals?: Record<string, number>;
    averages?: Record<string, number>;
  }[];

  season?: number | string;

  player_id?: string;
  player?: string;
  name?: string;

  team?: string;
  position?: string;

  games?: number;
  games_vs_opponent?: number;

  opponent?: string;

  passing?: {
    completions?: number;
    attempts?: number;
    yards?: number;
    tds?: number;
    interceptions?: number;
  };

  rushing?: {
    carries?: number;
    yards?: number;
    tds?: number;
  };

  receiving?: {
    targets?: number;
    receptions?: number;
    yards?: number;
    tds?: number;
  };

  fantasy?: {
    points?: number;
    ppr_points?: number;
  };

  averages?: {
    completions?: number;
    attempts?: number;

    passing_yards?: number;
    passing_tds?: number;
    interceptions?: number;

    carries?: number;
    rushing_yards?: number;
    rushing_tds?: number;

    targets?: number;
    receptions?: number;
    receiving_yards?: number;
    receiving_tds?: number;

    fantasy_points?: number;
    fantasy_points_ppr?: number;
  };

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
  fantasy_points_ppr_per_game?: number;
};

function safeNumber(
  value: unknown,
) {
  const number = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(number)
  ) {
    return 0;
  }

  return number;
}

function formatNumber(
  value: unknown,
  decimals = 1,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "—";
  }

  if (Number.isInteger(number)) {
    return number.toLocaleString();
  }

  return number.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        decimals,
    },
  );
}

function getPlayerName(
  player: NFLPlayer,
) {
  return (
    player.player ||
    player.name ||
    "Unknown Player"
  );
}

function getPosition(
  player: NFLPlayer,
) {
  return String(
    player.position || "",
  )
    .trim()
    .toUpperCase();
}

function getGames(
  player: NFLPlayer,
  view: DataView,
) {
  if (view === "matchup") {
    return safeNumber(
      player.games_vs_opponent,
    );
  }

  if (view === "career") {
    return safeNumber(
      player.career_totals?.games,
    );
  }

  return safeNumber(
    player.games,
  );
}

function divide(
  value: unknown,
  games: number,
  decimals = 1,
) {
  if (!games) {
    return 0;
  }

  return Number(
    (
      safeNumber(value) /
      games
    ).toFixed(decimals),
  );
}

function PlayerCell({
  player,
}: {
  player: NFLPlayer;
}) {
  return (
    <div className="min-w-0">
      <button
        type="button"
        className="max-w-full truncate text-left text-sm font-black text-white transition hover:text-cyan-200"
      >
        {getPlayerName(player)}
      </button>
    </div>
  );
}

function TeamCell({
  team,
}: {
  team?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <NFLTeamLogo
        team={team || ""}
        size={30}
      />

      <span className="text-xs font-black text-slate-300">
        {team || "—"}
      </span>
    </div>
  );
}

function PositionCell({
  position,
}: {
  position?: string;
}) {
  return (
    <div className="flex justify-center">
      <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black text-cyan-200">
        {position || "—"}
      </span>
    </div>
  );
}

function OpponentCell({
  opponent,
}: {
  opponent?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <NFLTeamLogo
        team={opponent || ""}
        size={26}
      />

      <span className="text-xs font-black text-pink-200">
        {opponent || "—"}
      </span>
    </div>
  );
}

function StatValue({
  value,
  decimals = 1,
}: {
  value: unknown;
  decimals?: number;
}) {
  return (
    <div className="text-center text-sm font-black text-white">
      {formatNumber(
        value,
        decimals,
      )}
    </div>
  );
}

function getQBValues(
  player: NFLPlayer,
  view: DataView,
  mode: StatMode,
) {
  const games =
    getGames(player, view);

  if (view === "career") {
    if (mode === "totals") {
      return {
        games,

        completions: "—",
        attempts: "—",

        passingYards:
          player.career_totals
            ?.passing_yards,

        passingTDs:
          player.career_totals
            ?.passing_tds,

        interceptions:
          player.career_totals
            ?.interceptions,

        rushingYards:
          player.career_totals
            ?.rushing_yards,

        rushingTDs:
          player.career_totals
            ?.rushing_tds,

        fantasyPoints:
          player.career_totals
            ?.fantasy_points,

        pprPoints:
          player.career_totals
            ?.fantasy_points_ppr,
      };
    }

    return {
      games,

      completions: "—",
      attempts: "—",

      passingYards:
        player.career_averages
          ?.passing_yards,

      passingTDs:
        player.career_averages
          ?.passing_tds,

      interceptions:
        player.career_averages
          ?.interceptions,

      rushingYards:
        player.career_averages
          ?.rushing_yards,

      rushingTDs:
        player.career_averages
          ?.rushing_tds,

      fantasyPoints:
        player.career_averages
          ?.fantasy_points,

      pprPoints:
        player.career_averages
          ?.fantasy_points_ppr,
    };
  }

  if (mode === "totals") {
    return {
      games,

      completions:
        player.passing
          ?.completions,

      attempts:
        player.passing
          ?.attempts,

      passingYards:
        player.passing?.yards,

      passingTDs:
        player.passing?.tds,

      interceptions:
        player.passing
          ?.interceptions,

      rushingYards:
        player.rushing?.yards,

      rushingTDs:
        player.rushing?.tds,

      fantasyPoints:
        player.fantasy?.points,

      pprPoints:
        player.fantasy
          ?.ppr_points,
    };
  }

  return {
    games,

    completions:
      player.averages
        ?.completions ??
      divide(
        player.passing
          ?.completions,
        games,
        1,
      ),

    attempts:
      player.averages
        ?.attempts ??
      divide(
        player.passing
          ?.attempts,
        games,
        1,
      ),

    passingYards:
      player.averages
        ?.passing_yards ??
      player.pass_yards_per_game ??
      divide(
        player.passing?.yards,
        games,
        1,
      ),

    passingTDs:
      player.averages
        ?.passing_tds ??
      player.pass_tds_per_game ??
      divide(
        player.passing?.tds,
        games,
        2,
      ),

    interceptions:
      player.averages
        ?.interceptions ??
      player.interceptions_per_game ??
      divide(
        player.passing
          ?.interceptions,
        games,
        2,
      ),

    rushingYards:
      player.averages
        ?.rushing_yards ??
      player.rush_yards_per_game ??
      divide(
        player.rushing?.yards,
        games,
        1,
      ),

    rushingTDs:
      player.averages
        ?.rushing_tds ??
      player.rush_tds_per_game ??
      divide(
        player.rushing?.tds,
        games,
        2,
      ),

    fantasyPoints:
      player.averages
        ?.fantasy_points ??
      player.fantasy_points_per_game ??
      divide(
        player.fantasy?.points,
        games,
        1,
      ),

    pprPoints:
      player.averages
        ?.fantasy_points_ppr ??
      player.fantasy_points_ppr_per_game ??
      divide(
        player.fantasy
          ?.ppr_points,
        games,
        1,
      ),
  };
}

function getSkillValues(
  player: NFLPlayer,
  view: DataView,
  mode: StatMode,
) {
  const games =
    getGames(player, view);

  if (view === "career") {
    if (mode === "totals") {
      return {
        games,

        carries:
          player.career_totals
            ?.carries,

        rushingYards:
          player.career_totals
            ?.rushing_yards,

        rushingTDs:
          player.career_totals
            ?.rushing_tds,

        targets:
          player.career_totals
            ?.targets,

        receptions:
          player.career_totals
            ?.receptions,

        receivingYards:
          player.career_totals
            ?.receiving_yards,

        receivingTDs:
          player.career_totals
            ?.receiving_tds,

        fantasyPoints:
          player.career_totals
            ?.fantasy_points,

        pprPoints:
          player.career_totals
            ?.fantasy_points_ppr,
      };
    }

    return {
      games,

      carries:
        player.career_averages
          ?.carries,

      rushingYards:
        player.career_averages
          ?.rushing_yards,

      rushingTDs:
        player.career_averages
          ?.rushing_tds,

      targets:
        player.career_averages
          ?.targets,

      receptions:
        player.career_averages
          ?.receptions,

      receivingYards:
        player.career_averages
          ?.receiving_yards,

      receivingTDs:
        player.career_averages
          ?.receiving_tds,

      fantasyPoints:
        player.career_averages
          ?.fantasy_points,

      pprPoints:
        player.career_averages
          ?.fantasy_points_ppr,
    };
  }

  if (mode === "totals") {
    return {
      games,

      carries:
        player.rushing
          ?.carries,

      rushingYards:
        player.rushing?.yards,

      rushingTDs:
        player.rushing?.tds,

      targets:
        player.receiving
          ?.targets,

      receptions:
        player.receiving
          ?.receptions,

      receivingYards:
        player.receiving
          ?.yards,

      receivingTDs:
        player.receiving
          ?.tds,

      fantasyPoints:
        player.fantasy?.points,

      pprPoints:
        player.fantasy
          ?.ppr_points,
    };
  }

  return {
    games,

    carries:
      player.averages
        ?.carries ??
      player.carries_per_game ??
      divide(
        player.rushing
          ?.carries,
        games,
        1,
      ),

    rushingYards:
      player.averages
        ?.rushing_yards ??
      player.rush_yards_per_game ??
      divide(
        player.rushing?.yards,
        games,
        1,
      ),

    rushingTDs:
      player.averages
        ?.rushing_tds ??
      player.rush_tds_per_game ??
      divide(
        player.rushing?.tds,
        games,
        2,
      ),

    targets:
      player.averages
        ?.targets ??
      player.targets_per_game ??
      divide(
        player.receiving
          ?.targets,
        games,
        1,
      ),

    receptions:
      player.averages
        ?.receptions ??
      player.receptions_per_game ??
      divide(
        player.receiving
          ?.receptions,
        games,
        1,
      ),

    receivingYards:
      player.averages
        ?.receiving_yards ??
      player.receiving_yards_per_game ??
      divide(
        player.receiving
          ?.yards,
        games,
        1,
      ),

    receivingTDs:
      player.averages
        ?.receiving_tds ??
      player.receiving_tds_per_game ??
      divide(
        player.receiving
          ?.tds,
        games,
        2,
      ),

    fantasyPoints:
      player.averages
        ?.fantasy_points ??
      player.fantasy_points_per_game ??
      divide(
        player.fantasy?.points,
        games,
        1,
      ),

    pprPoints:
      player.averages
        ?.fantasy_points_ppr ??
      player.fantasy_points_ppr_per_game ??
      divide(
        player.fantasy
          ?.ppr_points,
        games,
        1,
      ),
  };
}

function QuarterbackTable({
  players,
  view,
  mode,
}: {
  players: NFLPlayer[];
  view: DataView;
  mode: StatMode;
}) {
  const matchup =
    view === "matchup";

  const grid = matchup
    ? "grid-cols-[minmax(180px,1.7fr)_100px_75px_90px_75px_repeat(9,minmax(78px,1fr))]"
    : "grid-cols-[minmax(180px,1.7fr)_100px_75px_75px_repeat(9,minmax(78px,1fr))]";

  const labels =
    mode === "totals"
      ? [
          "Player",
          "Team",
          "Position",
          ...(matchup
            ? ["Opp"]
            : []),
          matchup
            ? "GP vs Opp"
            : "GP",
          "Comp",
          "Att",
          "Pass Yds",
          "Pass TD",
          "INT",
          "Rush Yds",
          "Rush TD",
          "FP",
          "PPR",
        ]
      : [
          "Player",
          "Team",
          "Position",
          ...(matchup
            ? ["Opp"]
            : []),
          matchup
            ? "GP vs Opp"
            : "GP",
          "Comp/G",
          "Att/G",
          "Pass Y/G",
          "Pass TD/G",
          "INT/G",
          "Rush Y/G",
          "Rush TD/G",
          "FP/G",
          "PPR/G",
        ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1325]/70">
      <div className="overflow-x-auto">
        <div
          className={
            matchup
              ? "min-w-[1420px]"
              : "min-w-[1320px]"
          }
        >
          <div
            className={`grid ${grid} items-center gap-2 border-b border-white/10 bg-[#091120] px-4 py-3`}
          >
            {labels.map(
              (label, index) => (
                <div
                  key={label}
                  className={`text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 ${
                    index < 2
                      ? "text-left"
                      : "text-center"
                  }`}
                >
                  {label}
                </div>
              ),
            )}
          </div>

          <div className="divide-y divide-white/[0.06]">
            {players.map(
              (player, index) => {
                const values =
                  getQBValues(
                    player,
                    view,
                    mode,
                  );

                return (
                  <div
                    key={`${player.player_id || getPlayerName(player)}-${index}`}
                    className={`grid ${grid} items-center gap-2 px-4 py-3 transition hover:bg-cyan-300/[0.035]`}
                  >
                    <PlayerCell
                      player={player}
                    />

                    <TeamCell
                      team={
                        player.team
                      }
                    />

                    <PositionCell
                      position={
                        player.position
                      }
                    />

                    {matchup ? (
                      <OpponentCell
                        opponent={
                          player.opponent
                        }
                      />
                    ) : null}

                    <StatValue
                      value={
                        values.games
                      }
                      decimals={0}
                    />

                    <StatValue
                      value={
                        values.completions
                      }
                    />

                    <StatValue
                      value={
                        values.attempts
                      }
                    />

                    <StatValue
                      value={
                        values.passingYards
                      }
                    />

                    <StatValue
                      value={
                        values.passingTDs
                      }
                      decimals={
                        mode ===
                        "totals"
                          ? 0
                          : 2
                      }
                    />

                    <StatValue
                      value={
                        values.interceptions
                      }
                      decimals={
                        mode ===
                        "totals"
                          ? 0
                          : 2
                      }
                    />

                    <StatValue
                      value={
                        values.rushingYards
                      }
                    />

                    <StatValue
                      value={
                        values.rushingTDs
                      }
                      decimals={
                        mode ===
                        "totals"
                          ? 0
                          : 2
                      }
                    />

                    <StatValue
                      value={
                        values.fantasyPoints
                      }
                    />

                    <StatValue
                      value={
                        values.pprPoints
                      }
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillPlayerTable({
  players,
  view,
  mode,
}: {
  players: NFLPlayer[];
  view: DataView;
  mode: StatMode;
}) {
  const matchup =
    view === "matchup";

  const grid = matchup
    ? "grid-cols-[minmax(180px,1.7fr)_100px_75px_90px_75px_repeat(9,minmax(78px,1fr))]"
    : "grid-cols-[minmax(180px,1.7fr)_100px_75px_75px_repeat(9,minmax(78px,1fr))]";

  const labels =
    mode === "totals"
      ? [
          "Player",
          "Team",
          "Position",
          ...(matchup
            ? ["Opp"]
            : []),
          matchup
            ? "GP vs Opp"
            : "GP",
          "Carries",
          "Rush Yds",
          "Rush TD",
          "Targets",
          "Rec",
          "Rec Yds",
          "Rec TD",
          "FP",
          "PPR",
        ]
      : [
          "Player",
          "Team",
          "Position",
          ...(matchup
            ? ["Opp"]
            : []),
          matchup
            ? "GP vs Opp"
            : "GP",
          "Carries/G",
          "Rush Y/G",
          "Rush TD/G",
          "Targets/G",
          "Rec/G",
          "Rec Y/G",
          "Rec TD/G",
          "FP/G",
          "PPR/G",
        ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1325]/70">
      <div className="overflow-x-auto">
        <div
          className={
            matchup
              ? "min-w-[1420px]"
              : "min-w-[1320px]"
          }
        >
          <div
            className={`grid ${grid} items-center gap-2 border-b border-white/10 bg-[#091120] px-4 py-3`}
          >
            {labels.map(
              (label, index) => (
                <div
                  key={label}
                  className={`text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 ${
                    index < 2
                      ? "text-left"
                      : "text-center"
                  }`}
                >
                  {label}
                </div>
              ),
            )}
          </div>

          <div className="divide-y divide-white/[0.06]">
            {players.map(
              (player, index) => {
                const values =
                  getSkillValues(
                    player,
                    view,
                    mode,
                  );

                return (
                  <div
                    key={`${player.player_id || getPlayerName(player)}-${index}`}
                    className={`grid ${grid} items-center gap-2 px-4 py-3 transition hover:bg-cyan-300/[0.035]`}
                  >
                    <PlayerCell
                      player={player}
                    />

                    <TeamCell
                      team={
                        player.team
                      }
                    />

                    <PositionCell
                      position={
                        player.position
                      }
                    />

                    {matchup ? (
                      <OpponentCell
                        opponent={
                          player.opponent
                        }
                      />
                    ) : null}

                    <StatValue
                      value={
                        values.games
                      }
                      decimals={0}
                    />

                    <StatValue
                      value={
                        values.carries
                      }
                    />

                    <StatValue
                      value={
                        values.rushingYards
                      }
                    />

                    <StatValue
                      value={
                        values.rushingTDs
                      }
                      decimals={
                        mode ===
                        "totals"
                          ? 0
                          : 2
                      }
                    />

                    <StatValue
                      value={
                        values.targets
                      }
                    />

                    <StatValue
                      value={
                        values.receptions
                      }
                    />

                    <StatValue
                      value={
                        values.receivingYards
                      }
                    />

                    <StatValue
                      value={
                        values.receivingTDs
                      }
                      decimals={
                        mode ===
                        "totals"
                          ? 0
                          : 2
                      }
                    />

                    <StatValue
                      value={
                        values.fantasyPoints
                      }
                    />

                    <StatValue
                      value={
                        values.pprPoints
                      }
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NFLPlayersPage() {
  const [
    seasonPlayers,
    setSeasonPlayers,
  ] = useState<NFLPlayer[]>(
    [],
  );

  const [
    careerPlayers,
    setCareerPlayers,
  ] = useState<NFLPlayer[]>(
    [],
  );

  const [
    rosterPlayers,
    setRosterPlayers,
  ] = useState<NFLPlayer[]>(
    [],
  );

  const [
    matchupPlayers,
    setMatchupPlayers,
  ] = useState<NFLPlayer[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    dataView,
    setDataView,
  ] =
    useState<DataView>(
      "season",
    );

  const [
    statMode,
    setStatMode,
  ] =
    useState<StatMode>(
      "totals",
    );

  const [
    positionFilter,
    setPositionFilter,
  ] =
    useState<PositionFilter>(
      "ALL",
    );

  useEffect(() => {
    async function loadData() {
      try {
        const [
          seasonResponse,
          careerResponse,
          slateResponse,
          rosterResponse,
        ] = await Promise.all([
          fetch(
            "/data/nfl/player_stats.json",
            {
              cache: "no-store",
            },
          ),

          fetch(
            "/data/nfl/career_stats.json",
            {
              cache: "no-store",
            },
          ),

          fetch(
            "/data/nfl/slate.json",
            {
              cache: "no-store",
            },
          ),

          fetch(
            "/data/nfl/rosters.json",
            {
              cache: "no-store",
            },
          ),
        ]);

        if (
          !seasonResponse.ok
        ) {
          throw new Error(
            "NFL season stats unavailable",
          );
        }

        const seasonPayload =
          await seasonResponse.json();

        const loadedSeason:
          NFLPlayer[] =
          Array.isArray(
            seasonPayload,
          )
            ? seasonPayload
            : seasonPayload.players ||
              [];

        setSeasonPlayers(
          loadedSeason,
        );

        if (
          careerResponse.ok
        ) {
          const careerPayload =
            await careerResponse.json();

          setCareerPlayers(
            Array.isArray(
              careerPayload,
            )
              ? careerPayload
              : careerPayload.players ||
                  [],
          );
        }

        if (
          rosterResponse.ok
        ) {
          const rosterPayload =
            await rosterResponse.json();

          setRosterPlayers(
            Array.isArray(
              rosterPayload,
            )
              ? rosterPayload
              : rosterPayload.players ||
                  [],
          );
        }

        if (
          slateResponse.ok
        ) {
          const slatePayload =
            await slateResponse.json();

          const games =
            Array.isArray(
              slatePayload,
            )
              ? slatePayload
              : slatePayload.games ||
                [];

          const loadedMatchups:
            NFLPlayer[] = [];

          for (
            const game of games
          ) {
            const awayPlayers =
              game.players?.away ||
              [];

            const homePlayers =
              game.players?.home ||
              [];

            loadedMatchups.push(
              ...awayPlayers,
              ...homePlayers,
            );
          }

          setMatchupPlayers(
            loadedMatchups,
          );
        }
      } catch (error) {
        console.error(
          "Failed to load NFL player data:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activePlayers =
    useMemo(() => {
      if (
        dataView === "career"
      ) {
        const rosterById =
          new Map(
            rosterPlayers.map(
              (player) => [
                String(
                  player.player_id ||
                    "",
                ),
                player,
              ],
            ),
          );

        return careerPlayers.map(
          (player) => {
            const rosterPlayer =
              rosterById.get(
                String(
                  player.player_id ||
                    "",
                ),
              );

            return {
              ...player,

              team:
                rosterPlayer?.team ||
                player.team ||
                "",

              position:
                rosterPlayer?.position ||
                player.position ||
                "",
            };
          },
        );
      }

      if (
        dataView === "matchup"
      ) {
        return matchupPlayers;
      }

      return seasonPlayers;
    }, [
      dataView,
      seasonPlayers,
      careerPlayers,
      matchupPlayers,
      rosterPlayers,
    ]);

  const filteredPlayers =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return activePlayers
        .filter((player) => {
          const position =
            getPosition(
              player,
            );

          if (
            ![
              "QB",
              "RB",
              "FB",
              "WR",
              "TE",
            ].includes(position)
          ) {
            return false;
          }

          if (
            positionFilter !==
              "ALL" &&
            position !==
              positionFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            getPlayerName(
              player,
            )
              .toLowerCase()
              .includes(query) ||
            String(
              player.team ||
                "",
            )
              .toLowerCase()
              .includes(query) ||
            String(
              player.opponent ||
                "",
            )
              .toLowerCase()
              .includes(query) ||
            position
              .toLowerCase()
              .includes(query)
          );
        })
        .sort((a, b) => {
          const aGames =
            getGames(
              a,
              dataView,
            );

          const bGames =
            getGames(
              b,
              dataView,
            );

          if (
            dataView ===
              "matchup" &&
            bGames !== aGames
          ) {
            return (
              bGames - aGames
            );
          }

          function getSortPPR(
            player: NFLPlayer,
          ) {
            if (
              dataView ===
              "career"
            ) {
              return statMode ===
                "totals"
                ? safeNumber(
                    player
                      .career_totals
                      ?.fantasy_points_ppr,
                  )
                : safeNumber(
                    player
                      .career_averages
                      ?.fantasy_points_ppr,
                  );
            }

            return statMode ===
              "totals"
              ? safeNumber(
                  player.fantasy
                    ?.ppr_points,
                )
              : safeNumber(
                  player.averages
                    ?.fantasy_points_ppr ??
                    player
                      .fantasy_points_ppr_per_game,
                );
          }

          const aPPR =
            getSortPPR(a);

          const bPPR =
            getSortPPR(b);

          return bPPR - aPPR;
        });
    }, [
      activePlayers,
      search,
      positionFilter,
      dataView,
      statMode,
    ]);

  const quarterbacks =
    filteredPlayers.filter(
      (player) =>
        getPosition(
          player,
        ) === "QB",
    );

  const skillPlayers =
    filteredPlayers.filter(
      (player) =>
        getPosition(
          player,
        ) !== "QB",
    );

  const lastSeason =
    seasonPlayers.find(
      (player) =>
        player.season,
    )?.season || "2025";

  const viewTitle =
    dataView === "season"
      ? `${lastSeason} Season`
      : dataView === "career"
        ? "Career"
        : "Current Matchup";

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NFL player stats...
      </section>
    );
  }

  return (
    <div className="space-y-5 pt-4">
      <section className="glass rounded-3xl p-5">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
            Alpha Wagerz NFL
          </div>

          <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
            NFL Players
          </h1>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
            <Trophy
              size={16}
              className="text-cyan-300"
            />

            {viewTitle}{" "}
            {statMode ===
            "totals"
              ? "Totals"
              : "Per-Game Averages"}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-[#091120]/80 p-2">
            <button
              type="button"
              onClick={() =>
                setDataView(
                  "season",
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-black transition ${
                dataView ===
                "season"
                  ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.12)]"
                  : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <BarChart3
                size={15}
              />

              Last Season
            </button>

            <button
              type="button"
              onClick={() =>
                setDataView(
                  "career",
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-black transition ${
                dataView ===
                "career"
                  ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.12)]"
                  : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <History
                size={15}
              />

              Career
            </button>

            <button
              type="button"
              onClick={() =>
                setDataView(
                  "matchup",
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-black transition ${
                dataView ===
                "matchup"
                  ? "border-pink-300/40 bg-pink-500/15 text-pink-100 shadow-[0_0_18px_rgba(244,114,182,0.12)]"
                  : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Swords
                size={15}
              />

              vs Matchup
            </button>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.025] p-1">
            <button
              type="button"
              onClick={() =>
                setStatMode(
                  "totals",
                )
              }
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] transition ${
                statMode ===
                "totals"
                  ? "bg-cyan-300/15 text-cyan-200"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              <Sigma size={14} />

              Totals
            </button>

            <button
              type="button"
              onClick={() =>
                setStatMode(
                  "averages",
                )
              }
              className={`rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] transition ${
                statMode ===
                "averages"
                  ? "bg-cyan-300/15 text-cyan-200"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Averages
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[420px]">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder={
                dataView ===
                "matchup"
                  ? "Search player, team, or opponent..."
                  : "Search player or team..."
              }
              className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-3 pl-10 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "ALL",
                "QB",
                "RB",
                "WR",
                "TE",
              ] as PositionFilter[]
            ).map(
              (position) => (
                <button
                  key={
                    position
                  }
                  type="button"
                  onClick={() =>
                    setPositionFilter(
                      position,
                    )
                  }
                  className={`rounded-xl border px-4 py-2 text-xs font-black transition ${
                    positionFilter ===
                    position
                      ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.10)]"
                      : "border-white/10 bg-white/[0.025] text-slate-500 hover:border-pink-300/30 hover:text-white"
                  }`}
                >
                  {position}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            {
              filteredPlayers.length
            }{" "}
            Players
          </div>

          <div className="text-xs font-bold text-slate-500">
            {dataView ===
            "season"
              ? `${lastSeason} regular-season stats`
              : dataView ===
                  "career"
                ? "Career regular-season stats"
                : "Career history vs current opponent"}
          </div>
        </div>
      </section>

      {(positionFilter ===
        "ALL" ||
        positionFilter ===
          "QB") &&
      quarterbacks.length ? (
        <section className="glass rounded-3xl p-4">
          <div className="mb-4">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
              {dataView ===
              "matchup"
                ? "Quarterback Opponent History"
                : statMode ===
                    "totals"
                  ? "Passing Totals"
                  : "Passing Averages"}
            </div>

            <h2 className="mt-1 text-xl font-black text-white">
              Quarterbacks
            </h2>
          </div>

          <QuarterbackTable
            players={
              quarterbacks
            }
            view={dataView}
            mode={statMode}
          />
        </section>
      ) : null}

      {skillPlayers.length ? (
        <section className="glass rounded-3xl p-4">
          <div className="mb-4">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-pink-200/70">
              {dataView ===
              "matchup"
                ? "Skill Player Opponent History"
                : statMode ===
                    "totals"
                  ? "Rushing & Receiving Totals"
                  : "Rushing & Receiving Averages"}
            </div>

            <h2 className="mt-1 text-xl font-black text-white">
              Skill Players
            </h2>
          </div>

          <SkillPlayerTable
            players={
              skillPlayers
            }
            view={dataView}
            mode={statMode}
          />
        </section>
      ) : null}

      {!filteredPlayers.length ? (
        <section className="glass rounded-3xl p-8 text-center">
          <div className="text-lg font-black text-white">
            No player data available
          </div>

          <div className="mt-2 text-sm text-slate-500">
            {dataView ===
            "matchup"
              ? "No players on the current slate match these filters."
              : "No NFL players match the selected filters."}
          </div>
        </section>
      ) : null}
    </div>
  );
}