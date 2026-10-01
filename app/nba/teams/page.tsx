"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Shield,
} from "lucide-react";

type NBATeam = {
  abbr?: string;
  abbreviation?: string;
  name?: string;
  full_name?: string;
  logo?: string;
  conference?: string;
};

type RankingTeam = {
  team?: string;
  abbreviation?: string;
  abbr?: string;
  team_name?: string;
  name?: string;
  conference?: string;
  rank?: number;
  conference_rank?: number;
  wins?: number;
  losses?: number;
  win_pct?: number;
  win_percentage?: number;
  home_record?: string;
  road_record?: string;
  away_record?: string;
  last_10?: string;
  streak?: string;
  games_back?: number | string;
  gb?: number | string;
};

type RankingsPayload = {
  generated_at?: string;
  league?: string;
  season?: string;
  teams?: RankingTeam[];
};

type ConferenceFilter =
  | "ALL"
  | "EAST"
  | "WEST";

type SortKey =
  | "team"
  | "conference"
  | "rank"
  | "wins"
  | "losses"
  | "win_pct"
  | "games_back";

type SortDirection = "asc" | "desc";

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function teamCode(team: RankingTeam) {
  return (
    team.abbreviation ||
    team.abbr ||
    team.team ||
    ""
  );
}

function teamName(team: RankingTeam) {
  return (
    team.team_name ||
    team.name ||
    team.team ||
    teamCode(team) ||
    "Unknown Team"
  );
}

function conferenceName(team: RankingTeam) {
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

function numericWinPct(team: RankingTeam) {
  const value =
    team.win_pct ??
    team.win_percentage ??
    0;

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number > 1
    ? number / 100
    : number;
}

function findTeam(
  team: RankingTeam,
  teams: NBATeam[],
) {
  const code = normalize(
    teamCode(team),
  );

  const name = normalize(
    teamName(team),
  );

  return teams.find((item) => {
    const itemCode = normalize(
      item.abbr ||
        item.abbreviation,
    );

    const itemName = normalize(
      item.name ||
        item.full_name,
    );

    return (
      (code && itemCode === code) ||
      (name && itemName === name)
    );
  });
}

function NBATeamLogo({
  team,
  teams,
  size = 38,
}: {
  team: RankingTeam;
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
        {normalize(
          teamCode(team),
        ).slice(0, 3)}
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

function formatWinPct(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value
    .toFixed(3)
    .replace(/^0/, "");
}

function numericGamesBack(
  team: RankingTeam,
) {
  const raw =
    team.games_back ??
    team.gb ??
    0;

  if (
    raw === "-" ||
    raw === "—"
  ) {
    return 0;
  }

  const value = Number(raw);

  return Number.isFinite(value)
    ? value
    : 0;
}

export default function NBATeamsPage() {
  const [rankings, setRankings] =
    useState<RankingTeam[]>([]);

  const [teams, setTeams] =
    useState<NBATeam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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
    useState<SortKey>("rank");

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<SortDirection>("asc");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          rankingResponse,
          teamResponse,
        ] = await Promise.all([
          fetch(
            "/data/nba/team_rankings.json",
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

        if (!rankingResponse.ok) {
          throw new Error(
            "NBA team rankings unavailable.",
          );
        }

        const rankingPayload:
          | RankingsPayload
          | RankingTeam[] =
          await rankingResponse.json();

        setRankings(
          Array.isArray(
            rankingPayload,
          )
            ? rankingPayload
            : rankingPayload.teams ||
                [],
        );

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
        setRankings([]);
        setTeams([]);

        setError(
          err instanceof Error
            ? err.message
            : "NBA team rankings unavailable.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const rows = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const filtered =
      rankings.filter((team) => {
        const conference =
          normalize(
            conferenceName(team),
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

        if (!normalizedSearch) {
          return true;
        }

        return (
          teamName(team)
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          teamCode(team)
            .toLowerCase()
            .includes(
              normalizedSearch,
            )
        );
      });

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "team") {
        comparison =
          teamName(a).localeCompare(
            teamName(b),
          );
      } else if (
        sortKey === "conference"
      ) {
        comparison =
          conferenceName(
            a,
          ).localeCompare(
            conferenceName(b),
          );
      } else if (
        sortKey === "rank"
      ) {
        comparison =
          Number(
            a.conference_rank ??
              a.rank ??
              999,
          ) -
          Number(
            b.conference_rank ??
              b.rank ??
              999,
          );
      } else if (
        sortKey === "wins"
      ) {
        comparison =
          Number(a.wins || 0) -
          Number(b.wins || 0);
      } else if (
        sortKey === "losses"
      ) {
        comparison =
          Number(a.losses || 0) -
          Number(b.losses || 0);
      } else if (
        sortKey === "win_pct"
      ) {
        comparison =
          numericWinPct(a) -
          numericWinPct(b);
      } else {
        comparison =
          numericGamesBack(a) -
          numericGamesBack(b);
      }

      return sortDirection ===
        "asc"
        ? comparison
        : -comparison;
    });

    return filtered;
  }, [
    rankings,
    conferenceFilter,
    search,
    sortKey,
    sortDirection,
  ]);

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

    if (
      key === "team" ||
      key === "conference" ||
      key === "rank"
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

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NBA teams...
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
                <Shield size={16} />
                Alpha Wagerz NBA
              </div>

              <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
                NBA Teams
              </h1>

              <p className="mt-3 text-sm font-medium text-slate-400">
                NBA standings and team
                records.
              </p>
            </div>

            <div className="relative w-full xl:w-[320px]">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search team..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              {
                key: "ALL",
                label: "All",
              },
              {
                key: "EAST",
                label: "Eastern",
              },
              {
                key: "WEST",
                label: "Western",
              },
            ].map((option) => {
              const active =
                conferenceFilter ===
                option.key;

              return (
                <button
                  key={option.key}
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
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center">
            <div className="font-black text-red-300">
              {error}
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-white/10 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {rows.length} NBA Teams
            </div>

            <div className="table-scroll overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/50">
                    {[
                      [
                        "rank",
                        "Rank",
                        "text-center",
                      ],
                      [
                        "team",
                        "Team",
                        "text-left",
                      ],
                      [
                        "conference",
                        "Conference",
                        "text-center",
                      ],
                      [
                        "wins",
                        "W",
                        "text-center",
                      ],
                      [
                        "losses",
                        "L",
                        "text-center",
                      ],
                      [
                        "win_pct",
                        "PCT",
                        "text-center",
                      ],
                      [
                        "games_back",
                        "GB",
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

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Home
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Away
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Last 10
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      Streak
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map(
                    (team, index) => {
                      const rank =
                        team.conference_rank ??
                        team.rank ??
                        index + 1;

                      return (
                        <tr
                          key={`${teamCode(team)}-${index}`}
                          className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.035]"
                        >
                          <td className="px-4 py-4 text-center font-black text-white">
                            {rank}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-3">
                              <NBATeamLogo
                                team={team}
                                teams={teams}
                                size={38}
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
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {conferenceName(
                              team,
                            )}
                          </td>

                          <td className="px-4 py-3 text-center font-black text-white">
                            {team.wins ??
                              0}
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {team.losses ??
                              0}
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {formatWinPct(
                              numericWinPct(
                                team,
                              ),
                            )}
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {team.games_back ??
                              team.gb ??
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {team.home_record ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {team.road_record ||
                              team.away_record ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-center font-bold text-slate-300">
                            {team.last_10 ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-center font-black text-white">
                            {team.streak ||
                              "—"}
                          </td>
                        </tr>
                      );
                    },
                  )}

                  {!rows.length ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-6 py-12 text-center text-sm font-bold text-slate-500"
                      >
                        No teams match the
                        selected filters.
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