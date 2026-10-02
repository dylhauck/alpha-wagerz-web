"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Shield,
} from "lucide-react";


/* ============================================================
   TYPES
============================================================ */

type NBATeam = {
  abbr?: string;
  abbreviation?: string;
  name?: string;
  full_name?: string;
  logo?: string;
  conference?: string;
};

type TeamRecord = {
  wins?: number;
  losses?: number;
  win_pct?: number;
};

type TeamTotals = {
  min?: number;
  pts?: number;
  pts_allowed?: number;
  point_diff?: number;
  reb?: number;
  ast?: number;
  stl?: number;
  blk?: number;
  tov?: number;
  fgm?: number;
  fga?: number;
  fg3m?: number;
  fg3a?: number;
  ftm?: number;
  fta?: number;
};

type TeamPerGame = {
  min?: number;
  pts?: number;
  pts_allowed?: number;
  point_diff?: number;
  reb?: number;
  ast?: number;
  stl?: number;
  blk?: number;
  tov?: number;
  fg3m?: number;
};

type TeamPercentages = {
  fg_pct?: number;
  fg3_pct?: number;
  ft_pct?: number;
};

type ATSRecord = {
  wins?: number;
  losses?: number;
  pushes?: number;
  record?: string;
  games_with_line?: number;
  ats_pct?: number;
};

type OverUnderRecord = {
  overs?: number;
  unders?: number;
  pushes?: number;
  record?: string;
  games_with_total?: number;
  over_pct?: number;
  under_pct?: number;
};

type TeamSeasonStats = {
  season?: string;
  games?: number;
  record?: TeamRecord;
  per_game?: TeamPerGame;
  totals?: TeamTotals;
  percentages?: TeamPercentages;
  ats?: ATSRecord | null;
  over_under?: OverUnderRecord | null;
};

type TeamStatsRow = {
  team?: string;
  team_name?: string;
  conference?: string;
  current_season?: TeamSeasonStats;
  last_season?: TeamSeasonStats;
};

type TeamStatsPayload = {
  generated_at?: string;
  league?: string;
  current_season?: string;
  last_season?: string;
  season_type?: string;
  teams?: TeamStatsRow[];
};

type SeasonView =
  | "current"
  | "last";

type StatView =
  | "per_game"
  | "totals";

type ConferenceFilter =
  | "ALL"
  | "EAST"
  | "WEST";

type SortDirection =
  | "asc"
  | "desc";

type SortKey =
  | "team"
  | "games"
  | "wins"
  | "losses"
  | "win_pct"
  | "pts"
  | "pts_allowed"
  | "point_diff"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "fg3m"
  | "fg_pct"
  | "fg3_pct"
  | "ft_pct"
  | "ats_record"
  | "ats_pct"
  | "ou_record"
  | "over_pct"
  | "under_pct";


/* ============================================================
   HELPERS
============================================================ */

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function teamCode(team: TeamStatsRow) {
  return String(
    team.team || "",
  )
    .trim()
    .toUpperCase();
}

function teamName(team: TeamStatsRow) {
  return (
    team.team_name ||
    team.team ||
    "Unknown Team"
  );
}

function conferenceName(
  team: TeamStatsRow,
) {
  const conference =
    normalize(team.conference);

  if (
    conference === "EAST" ||
    conference === "EASTERN"
  ) {
    return "East";
  }

  if (
    conference === "WEST" ||
    conference === "WESTERN"
  ) {
    return "West";
  }

  return team.conference || "—";
}

function findTeam(
  team: TeamStatsRow,
  teams: NBATeam[],
) {
  const code =
    normalize(teamCode(team));

  const name =
    normalize(teamName(team));

  return teams.find((item) => {
    const itemCode =
      normalize(
        item.abbr ||
          item.abbreviation,
      );

    const itemName =
      normalize(
        item.name ||
          item.full_name,
      );

    return (
      (code &&
        itemCode === code) ||
      (name &&
        itemName === name)
    );
  });
}

function NBATeamLogo({
  team,
  teams,
  size = 38,
}: {
  team: TeamStatsRow;
  teams: NBATeam[];
  size?: number;
}) {
  const reference =
    findTeam(team, teams);

  if (!reference?.logo) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white"
        style={{
          width: size,
          height: size,
        }}
      >
        {teamCode(team).slice(
          0,
          3,
        )}
      </div>
    );
  }

  return (
    <img
      src={reference.logo}
      alt={teamName(team)}
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}

function safeNumber(
  value: unknown,
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatStat(
  value: unknown,
  decimals = 1,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(
    decimals,
  );
}

function formatTotal(
  value: unknown,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Math.round(
    number,
  ).toLocaleString();
}

function formatPct(
  value: unknown,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number
    .toFixed(3)
    .replace(/^0/, "");
}

function formatPercent(
  value: unknown,
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${(
    number * 100
  ).toFixed(1)}%`;
}

function seasonStats(
  team: TeamStatsRow,
  seasonView: SeasonView,
) {
  return seasonView ===
    "current"
    ? team.current_season
    : team.last_season;
}

function countingStats(
  stats:
    | TeamSeasonStats
    | undefined,
  statView: StatView,
) {
  if (!stats) {
    return {};
  }

  return statView ===
    "per_game"
    ? stats.per_game || {}
    : stats.totals || {};
}

function recordString(
  stats:
    | TeamSeasonStats
    | undefined,
) {
  const wins =
    safeNumber(
      stats?.record?.wins,
    );

  const losses =
    safeNumber(
      stats?.record?.losses,
    );

  return `${wins}-${losses}`;
}

function atsRecord(
  stats:
    | TeamSeasonStats
    | undefined,
) {
  if (!stats?.ats) {
    return "—";
  }

  if (stats.ats.record) {
    return stats.ats.record;
  }

  const wins =
    safeNumber(
      stats.ats.wins,
    );

  const losses =
    safeNumber(
      stats.ats.losses,
    );

  const pushes =
    safeNumber(
      stats.ats.pushes,
    );

  return `${wins}-${losses}-${pushes}`;
}

function overUnderRecord(
  stats:
    | TeamSeasonStats
    | undefined,
) {
  if (!stats?.over_under) {
    return "—";
  }

  if (
    stats.over_under.record
  ) {
    return (
      stats.over_under.record
    );
  }

  const overs =
    safeNumber(
      stats.over_under.overs,
    );

  const unders =
    safeNumber(
      stats.over_under.unders,
    );

  const pushes =
    safeNumber(
      stats.over_under.pushes,
    );

  return `${overs}-${unders}-${pushes}`;
}


/* ============================================================
   PAGE
============================================================ */

export default function NBATeamsPage() {
  const [
    teamStats,
    setTeamStats,
  ] =
    useState<TeamStatsRow[]>(
      [],
    );

  const [teams, setTeams] =
    useState<NBATeam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    seasonView,
    setSeasonView,
  ] =
    useState<SeasonView>(
      "current",
    );

  const [
    statView,
    setStatView,
  ] =
    useState<StatView>(
      "per_game",
    );

  const [
    conferenceFilter,
    setConferenceFilter,
  ] =
    useState<ConferenceFilter>(
      "ALL",
    );

  const [search, setSearch] =
    useState("");

  const [sortKey, setSortKey] =
    useState<SortKey>(
      "win_pct",
    );

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<SortDirection>(
      "desc",
    );


  /* ========================================================
     LOAD DATA
  ======================================================== */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          statsResponse,
          teamResponse,
        ] = await Promise.all([
          fetch(
            "/data/nba/team_stats.json",
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

        if (!statsResponse.ok) {
          throw new Error(
            "NBA team statistics unavailable.",
          );
        }

        const payload:
          TeamStatsPayload =
          await statsResponse.json();

        setTeamStats(
          Array.isArray(
            payload,
          )
            ? payload
            : payload.teams || [],
        );

        if (teamResponse.ok) {
          const teamPayload =
            await teamResponse.json();

          setTeams(
            Array.isArray(
              teamPayload,
            )
              ? teamPayload
              : teamPayload.teams ||
                  [],
          );
        }
      } catch (err) {
        setTeamStats([]);
        setTeams([]);

        setError(
          err instanceof Error
            ? err.message
            : "NBA team statistics unavailable.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);


  /* ========================================================
     FILTER + SORT
  ======================================================== */

  const rows = useMemo(() => {
    const normalizedSearch =
      search
        .trim()
        .toLowerCase();

    const filtered =
      teamStats.filter(
        (team) => {
          const conference =
            normalize(
              conferenceName(
                team,
              ),
            );

          if (
            conferenceFilter ===
              "EAST" &&
            conference !== "EAST"
          ) {
            return false;
          }

          if (
            conferenceFilter ===
              "WEST" &&
            conference !== "WEST"
          ) {
            return false;
          }

          if (
            normalizedSearch
          ) {
            const matches =
              teamName(team)
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ) ||
              teamCode(team)
                .toLowerCase()
                .includes(
                  normalizedSearch,
                );

            if (!matches) {
              return false;
            }
          }

          return true;
        },
      );

    filtered.sort((a, b) => {
      const aSeason =
        seasonStats(
          a,
          seasonView,
        );

      const bSeason =
        seasonStats(
          b,
          seasonView,
        );

      const aStats =
        countingStats(
          aSeason,
          statView,
        );

      const bStats =
        countingStats(
          bSeason,
          statView,
        );

      let comparison = 0;

      if (sortKey === "team") {
        comparison =
          teamName(a).localeCompare(
            teamName(b),
          );
      } else if (
        sortKey === "games"
      ) {
        comparison =
          safeNumber(
            aSeason?.games,
          ) -
          safeNumber(
            bSeason?.games,
          );
      } else if (
        sortKey === "wins"
      ) {
        comparison =
          safeNumber(
            aSeason?.record
              ?.wins,
          ) -
          safeNumber(
            bSeason?.record
              ?.wins,
          );
      } else if (
        sortKey === "losses"
      ) {
        comparison =
          safeNumber(
            aSeason?.record
              ?.losses,
          ) -
          safeNumber(
            bSeason?.record
              ?.losses,
          );
      } else if (
        sortKey === "win_pct"
      ) {
        comparison =
          safeNumber(
            aSeason?.record
              ?.win_pct,
          ) -
          safeNumber(
            bSeason?.record
              ?.win_pct,
          );
      } else if (
        sortKey === "fg_pct"
      ) {
        comparison =
          safeNumber(
            aSeason
              ?.percentages
              ?.fg_pct,
          ) -
          safeNumber(
            bSeason
              ?.percentages
              ?.fg_pct,
          );
      } else if (
        sortKey === "fg3_pct"
      ) {
        comparison =
          safeNumber(
            aSeason
              ?.percentages
              ?.fg3_pct,
          ) -
          safeNumber(
            bSeason
              ?.percentages
              ?.fg3_pct,
          );
      } else if (
        sortKey === "ft_pct"
      ) {
        comparison =
          safeNumber(
            aSeason
              ?.percentages
              ?.ft_pct,
          ) -
          safeNumber(
            bSeason
              ?.percentages
              ?.ft_pct,
          );
      } else if (
        sortKey === "ats_pct"
      ) {
        comparison =
          safeNumber(
            aSeason?.ats
              ?.ats_pct,
          ) -
          safeNumber(
            bSeason?.ats
              ?.ats_pct,
          );
      } else if (
        sortKey ===
        "over_pct"
      ) {
        comparison =
          safeNumber(
            aSeason
              ?.over_under
              ?.over_pct,
          ) -
          safeNumber(
            bSeason
              ?.over_under
              ?.over_pct,
          );
      } else if (
        sortKey ===
        "under_pct"
      ) {
        comparison =
          safeNumber(
            aSeason
              ?.over_under
              ?.under_pct,
          ) -
          safeNumber(
            bSeason
              ?.over_under
              ?.under_pct,
          );
      } else if (
        sortKey ===
        "ats_record"
      ) {
        comparison =
          safeNumber(
            aSeason?.ats
              ?.wins,
          ) -
          safeNumber(
            bSeason?.ats
              ?.wins,
          );
      } else if (
        sortKey ===
        "ou_record"
      ) {
        comparison =
          safeNumber(
            aSeason
              ?.over_under
              ?.overs,
          ) -
          safeNumber(
            bSeason
              ?.over_under
              ?.overs,
          );
      } else {
        comparison =
          safeNumber(
            aStats[
              sortKey as keyof typeof aStats
            ],
          ) -
          safeNumber(
            bStats[
              sortKey as keyof typeof bStats
            ],
          );
      }

      return sortDirection ===
        "asc"
        ? comparison
        : -comparison;
    });

    return filtered;
  }, [
    teamStats,
    seasonView,
    statView,
    conferenceFilter,
    search,
    sortKey,
    sortDirection,
  ]);


  /* ========================================================
     SORTING
  ======================================================== */

  function handleSort(
    key: SortKey,
  ) {
    if (sortKey === key) {
      setSortDirection(
        (current) =>
          current === "asc"
            ? "desc"
            : "asc",
      );

      return;
    }

    setSortKey(key);

    if (key === "team") {
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

    return sortDirection ===
      "asc"
      ? " ▲"
      : " ▼";
  }


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NBA team
        statistics...
      </section>
    );
  }


  /* ========================================================
     TABLE HEADER
  ======================================================== */

  const headers: {
    key: SortKey;
    label: string;
    align?: string;
  }[] = [
    {
      key: "team",
      label: "Team",
      align: "text-left",
    },
    {
      key: "games",
      label: "GP",
    },
    {
      key: "wins",
      label: "W",
    },
    {
      key: "losses",
      label: "L",
    },
    {
      key: "win_pct",
      label: "Win%",
    },
    {
      key: "pts",
      label: "PTS",
    },
    {
      key: "pts_allowed",
      label: "PTS Allowed",
    },
    {
      key: "point_diff",
      label: "Diff",
    },
    {
      key: "reb",
      label: "REB",
    },
    {
      key: "ast",
      label: "AST",
    },
    {
      key: "stl",
      label: "STL",
    },
    {
      key: "blk",
      label: "BLK",
    },
    {
      key: "tov",
      label: "TOV",
    },
    {
      key: "fg3m",
      label: "3PM",
    },
    {
      key: "fg_pct",
      label: "FG%",
    },
    {
      key: "fg3_pct",
      label: "3P%",
    },
    {
      key: "ft_pct",
      label: "FT%",
    },
    {
      key: "ats_record",
      label: "ATS Record",
    },
    {
      key: "ats_pct",
      label: "ATS%",
    },
    {
      key: "ou_record",
      label: "O/U Record",
    },
    {
      key: "over_pct",
      label: "Over%",
    },
    {
      key: "under_pct",
      label: "Under%",
    },
  ];


  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <div className="space-y-5">
      <section className="glass overflow-hidden rounded-3xl">

        {/* ==================================================
            TITLE / CONTROLS
        ================================================== */}

        <div className="border-b border-white/10 px-6 py-7">

          <div className="flex flex-col items-center text-center">

            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
              <Shield size={16} />
              Alpha Wagerz NBA
            </div>

            <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
              NBA Team Statistics
            </h1>

            {/* SEASON */}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSeasonView(
                    "current",
                  )
                }
                className={`rounded-xl border px-5 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                  seasonView ===
                  "current"
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100"
                }`}
              >
                Current Season
              </button>

              <button
                type="button"
                onClick={() =>
                  setSeasonView(
                    "last",
                  )
                }
                className={`rounded-xl border px-5 py-2.5 text-xs font-black uppercase tracking-wide transition ${
                  seasonView ===
                  "last"
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100"
                }`}
              >
                Last Season
              </button>
            </div>


            {/* PER GAME / TOTALS */}

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setStatView(
                    "per_game",
                  )
                }
                className={`rounded-xl border px-5 py-2 text-xs font-black uppercase tracking-wide transition ${
                  statView ===
                  "per_game"
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100"
                }`}
              >
                Per Game
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatView(
                    "totals",
                  )
                }
                className={`rounded-xl border px-5 py-2 text-xs font-black uppercase tracking-wide transition ${
                  statView ===
                  "totals"
                    ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100"
                }`}
              >
                Totals
              </button>
            </div>


            {/* CONFERENCE */}

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[
                {
                  key: "ALL",
                  label: "All",
                },
                {
                  key: "EAST",
                  label: "East",
                },
                {
                  key: "WEST",
                  label: "West",
                },
              ].map(
                (option) => {
                  const active =
                    conferenceFilter ===
                    option.key;

                  return (
                    <button
                      key={
                        option.key
                      }
                      type="button"
                      onClick={() =>
                        setConferenceFilter(
                          option.key as ConferenceFilter,
                        )
                      }
                      className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                        active
                          ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-slate-950/40 text-slate-400 hover:border-cyan-300/35 hover:text-cyan-100"
                      }`}
                    >
                      {
                        option.label
                      }
                    </button>
                  );
                },
              )}
            </div>


            {/* SEARCH */}

            <div className="relative mt-5 w-full max-w-[360px]">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
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
                placeholder="Search team..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
              />
            </div>

          </div>
        </div>


        {/* ==================================================
            ERROR / TABLE
        ================================================== */}

        {error ? (
          <div className="px-6 py-10 text-center">
            <div className="font-black text-red-300">
              {error}
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-white/10 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {rows.length} NBA Teams
              {" • "}
              {seasonView ===
              "current"
                ? "Current Season"
                : "Last Season"}
              {" • "}
              {statView ===
              "per_game"
                ? "Per Game"
                : "Totals"}
            </div>

            <div className="table-scroll overflow-x-auto">
              <table className="w-full min-w-[2450px] border-collapse text-sm">

                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/50">
                    {headers.map(
                      (header) => (
                        <th
                          key={
                            header.key
                          }
                          className={`whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 ${
                            header.align ||
                            "text-center"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleSort(
                                header.key,
                              )
                            }
                            className="transition hover:text-white"
                          >
                            {
                              header.label
                            }
                            {sortIndicator(
                              header.key,
                            )}
                          </button>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>


                <tbody>
                  {rows.map(
                    (
                      team,
                      index,
                    ) => {
                      const stats =
                        seasonStats(
                          team,
                          seasonView,
                        );

                      const counting =
                        countingStats(
                          stats,
                          statView,
                        );

                      const percentages =
                        stats
                          ?.percentages ||
                        {};

                      const ats =
                        stats?.ats;

                      const ou =
                        stats
                          ?.over_under;

                      const games =
                        safeNumber(
                          stats?.games,
                        );

                      return (
                        <tr
                          key={`${teamCode(
                            team,
                          )}-${index}`}
                          className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.035]"
                        >

                          {/* TEAM */}

                          <td className="sticky left-0 z-10 whitespace-nowrap bg-[#0a111f]/95 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <NBATeamLogo
                                team={
                                  team
                                }
                                teams={
                                  teams
                                }
                                size={
                                  38
                                }
                              />

                              <div>
                                <div className="font-black text-white">
                                  {teamName(
                                    team,
                                  )}
                                </div>

                                <div className="mt-0.5 text-xs font-black text-slate-500">
                                  {teamCode(
                                    team,
                                  )}
                                  {" • "}
                                  {conferenceName(
                                    team,
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>


                          {/* GP */}

                          <td className="px-4 py-3 text-center font-black text-white">
                            {games}
                          </td>


                          {/* W */}

                          <td className="px-4 py-3 text-center font-black text-white">
                            {safeNumber(
                              stats
                                ?.record
                                ?.wins,
                            )}
                          </td>


                          {/* L */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {safeNumber(
                              stats
                                ?.record
                                ?.losses,
                            )}
                          </td>


                          {/* WIN % */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? formatPct(
                                  stats
                                    ?.record
                                    ?.win_pct,
                                )
                              : "—"}
                          </td>


                          {/* PTS */}

                          <td className="px-4 py-3 text-center font-black text-white">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.pts,
                                  )
                                : formatTotal(
                                    counting.pts,
                                  )
                              : "—"}
                          </td>


                          {/* PTS ALLOWED */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.pts_allowed,
                                  )
                                : formatTotal(
                                    counting.pts_allowed,
                                  )
                              : "—"}
                          </td>


                          {/* DIFF */}

                          <td className="px-4 py-3 text-center font-black text-white">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.point_diff,
                                  )
                                : formatTotal(
                                    counting.point_diff,
                                  )
                              : "—"}
                          </td>


                          {/* REB */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.reb,
                                  )
                                : formatTotal(
                                    counting.reb,
                                  )
                              : "—"}
                          </td>


                          {/* AST */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.ast,
                                  )
                                : formatTotal(
                                    counting.ast,
                                  )
                              : "—"}
                          </td>


                          {/* STL */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.stl,
                                  )
                                : formatTotal(
                                    counting.stl,
                                  )
                              : "—"}
                          </td>


                          {/* BLK */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.blk,
                                  )
                                : formatTotal(
                                    counting.blk,
                                  )
                              : "—"}
                          </td>


                          {/* TOV */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.tov,
                                  )
                                : formatTotal(
                                    counting.tov,
                                  )
                              : "—"}
                          </td>


                          {/* 3PM */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? statView ===
                                "per_game"
                                ? formatStat(
                                    counting.fg3m,
                                  )
                                : formatTotal(
                                    counting.fg3m,
                                  )
                              : "—"}
                          </td>


                          {/* FG % */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? formatPct(
                                  percentages.fg_pct,
                                )
                              : "—"}
                          </td>


                          {/* 3P % */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? formatPct(
                                  percentages.fg3_pct,
                                )
                              : "—"}
                          </td>


                          {/* FT % */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {games > 0
                              ? formatPct(
                                  percentages.ft_pct,
                                )
                              : "—"}
                          </td>


                          {/* ATS RECORD */}

                          <td className="px-4 py-3 text-center font-black text-white">
                            {atsRecord(
                              stats,
                            )}
                          </td>


                          {/* ATS % */}

                          <td className="px-4 py-3 text-center font-bold text-cyan-100">
                            {ats
                              ? formatPercent(
                                  ats.ats_pct,
                                )
                              : "—"}
                          </td>


                          {/* O/U RECORD */}

                          <td className="px-4 py-3 text-center font-black text-white">
                            {overUnderRecord(
                              stats,
                            )}
                          </td>


                          {/* OVER % */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {ou
                              ? formatPercent(
                                  ou.over_pct,
                                )
                              : "—"}
                          </td>


                          {/* UNDER % */}

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {ou
                              ? formatPercent(
                                  ou.under_pct,
                                )
                              : "—"}
                          </td>

                        </tr>
                      );
                    },
                  )}


                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={
                          headers.length
                        }
                        className="px-6 py-12 text-center text-sm font-bold text-slate-500"
                      >
                        No teams match
                        the selected
                        filters.
                      </td>
                    </tr>
                  ) : null}

                </tbody>
              </table>
            </div>
          </>
        )}

      </section>
    </div>
  );
}