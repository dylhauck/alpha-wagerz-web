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

type Injury = {
  player_id?: string;
  player_name?: string;
  name?: string;

  team?: string;
  team_abbr?: string;

  position?: string;
  status?: string;

  injury?: string;
  description?: string;
  detail?: string;

  source?: string;
};

function getRows(
  payload: any,
): Injury[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of [
    "injuries",
    "players",
    "data",
    "rows",
  ]) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

function getGames(
  payload: any,
): NFLGame[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.games)
    ? payload.games
    : [];
}

function normalizeTeam(
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
    normalizeTeam(a);

  const right =
    normalizeTeam(b);

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

function statusOrder(
  status: string,
) {
  const key =
    status.toUpperCase();

  if (
    key.includes("OUT") ||
    key.includes("IR") ||
    key.includes("PUP")
  ) {
    return 0;
  }

  if (
    key.includes("DOUBTFUL")
  ) {
    return 1;
  }

  if (
    key.includes("QUESTION")
  ) {
    return 2;
  }

  if (
    key.includes("LIMIT")
  ) {
    return 3;
  }

  if (
    key.includes("PROBABLE")
  ) {
    return 4;
  }

  return 5;
}

function statusClass(
  status: string,
) {
  const key =
    status.toUpperCase();

  if (
    key.includes("OUT") ||
    key.includes("IR") ||
    key.includes("PUP")
  ) {
    return "border-red-400/30 bg-red-500/10 text-red-300";
  }

  if (
    key.includes("DOUBTFUL")
  ) {
    return "border-orange-400/30 bg-orange-500/10 text-orange-300";
  }

  if (
    key.includes("QUESTION")
  ) {
    return "border-amber-300/30 bg-amber-400/10 text-amber-200";
  }

  if (
    key.includes("LIMIT")
  ) {
    return "border-cyan-300/30 bg-cyan-300/10 text-cyan-200";
  }

  if (
    key.includes("PROBABLE")
  ) {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  }

  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function formatGameCardTime(
  game: NFLGame,
) {
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

function SummaryBox({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?:
    | "red"
    | "amber"
    | "cyan"
    | "slate";
}) {
  const valueClass =
    tone === "red"
      ? "text-red-300"
      : tone === "amber"
        ? "text-amber-200"
        : tone === "cyan"
          ? "text-cyan-200"
          : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div
        className={`mt-2 text-2xl font-black ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function InjuryTable({
  team,
  teams,
  injuries,
}: {
  team: string;
  teams: NFLTeam[];
  injuries: Injury[];
}) {
  return (
    <section className="glass overflow-hidden rounded-3xl">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <NFLTeamLogo
            team={team}
            teams={teams}
            size={44}
          />

          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">
              Team Injury Report
            </div>

            <h2 className="mt-1 text-xl font-black text-white">
              {team}
            </h2>
          </div>
        </div>

        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
          {injuries.length}{" "}
          {injuries.length === 1
            ? "Injury"
            : "Injuries"}
        </div>
      </div>

      {injuries.length === 0 ? (
        <div className="p-6 text-sm text-slate-400">
          No injuries are listed for{" "}
          {team} on this slate.
        </div>
      ) : (
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
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
                  Detail
                </th>
              </tr>
            </thead>

            <tbody>
              {injuries.map(
                (row, index) => {
                  const name =
                    row.player_name ||
                    row.name ||
                    "Unknown Player";

                  const status =
                    row.status ||
                    "Unknown";

                  return (
                    <tr
                      key={
                        row.player_id ||
                        `${team}-${name}-${index}`
                      }
                      className="border-b border-white/[0.06] last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <div className="font-black text-white">
                          {name}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-300">
                        {row.position ||
                          "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-300">
                        {row.injury ||
                          row.description ||
                          "—"}
                      </td>

                      <td className="max-w-xl px-4 py-4 text-sm text-slate-400">
                        {row.detail ||
                          "—"}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function NFLNextInjuryReportPage() {
  const [rows, setRows] =
    useState<Injury[]>([]);

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
          injuryRes,
          slateRes,
          teamsRes,
        ] = await Promise.all([
          fetch(
            "/data/nfl/injuries.json",
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

        const injuryPayload =
          injuryRes.ok
            ? await injuryRes.json()
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
            getGames(
              slatePayload,
            );

          setRows(
            getRows(
              injuryPayload,
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
          setRows([]);
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

  const selectedGame =
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

  const sortedRows =
    useMemo(
      () =>
        [...rows].sort(
          (a, b) => {
            const statusDiff =
              statusOrder(
                a.status || "",
              ) -
              statusOrder(
                b.status || "",
              );

            if (
              statusDiff !== 0
            ) {
              return statusDiff;
            }

            const teamA =
              normalizeTeam(
                a.team ||
                  a.team_abbr,
              );

            const teamB =
              normalizeTeam(
                b.team ||
                  b.team_abbr,
              );

            return (
              teamA.localeCompare(
                teamB,
              ) ||
              (
                a.player_name ||
                a.name ||
                ""
              ).localeCompare(
                b.player_name ||
                  b.name ||
                  "",
              )
            );
          },
        ),
      [rows],
    );

  const selectedAway =
    selectedGame
      ? selectedGame.away_abbr ||
        selectedGame.away_team ||
        "AWAY"
      : "AWAY";

  const selectedHome =
    selectedGame
      ? selectedGame.home_abbr ||
        selectedGame.home_team ||
        "HOME"
      : "HOME";

  const awayInjuries =
    useMemo(
      () =>
        sortedRows.filter(
          (row) =>
            sameTeam(
              row.team ||
                row.team_abbr,
              selectedAway,
            ),
        ),
      [
        sortedRows,
        selectedAway,
      ],
    );

  const homeInjuries =
    useMemo(
      () =>
        sortedRows.filter(
          (row) =>
            sameTeam(
              row.team ||
                row.team_abbr,
              selectedHome,
            ),
        ),
      [
        sortedRows,
        selectedHome,
      ],
    );

  const selectedInjuries =
    useMemo(
      () => [
        ...awayInjuries,
        ...homeInjuries,
      ],
      [
        awayInjuries,
        homeInjuries,
      ],
    );

  const outCount =
    selectedInjuries.filter(
      (row) => {
        const status =
          String(
            row.status || "",
          ).toUpperCase();

        return (
          status.includes(
            "OUT",
          ) ||
          status.includes("IR") ||
          status.includes("PUP")
        );
      },
    ).length;

  const doubtfulCount =
    selectedInjuries.filter(
      (row) =>
        String(
          row.status || "",
        )
          .toUpperCase()
          .includes("DOUBTFUL"),
    ).length;

  const questionableCount =
    selectedInjuries.filter(
      (row) =>
        String(
          row.status || "",
        )
          .toUpperCase()
          .includes("QUESTION"),
    ).length;

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NFL injuries...
      </section>
    );
  }

  if (!selectedGame) {
    return (
      <section className="glass rounded-3xl p-8 text-center">
        <div className="text-lg font-black text-white">
          No NFL Injury Data
        </div>

        <div className="mt-2 text-sm text-slate-400">
          No NFL slate is available
          yet.
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {rows.length} NFL{" "}
          {rows.length === 1
            ? "Injury"
            : "Injuries"}{" "}
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

      <section className="glass rounded-3xl p-5">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
            NFL Injury Report
          </div>

          <h1 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">
            {selectedAway} @{" "}
            {selectedHome}
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Injury status
            for the selected matchup.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <SummaryBox
            label="Total Injuries"
            value={
              selectedInjuries.length
            }
            tone="cyan"
          />

          <SummaryBox
            label="Out / IR / PUP"
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
            value={
              questionableCount
            }
            tone="amber"
          />
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-2">
        <InjuryTable
          team={selectedAway}
          teams={teams}
          injuries={
            awayInjuries
          }
        />

        <InjuryTable
          team={selectedHome}
          teams={teams}
          injuries={
            homeInjuries
          }
        />
      </div>
    </div>
  );
}
