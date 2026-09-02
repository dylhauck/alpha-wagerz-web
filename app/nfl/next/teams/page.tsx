"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Shield, Trophy } from "lucide-react";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type ConferenceFilter = "ALL" | "AFC" | "NFC";
type StatsView = "overall" | "offense" | "defense";
type SortDirection = "asc" | "desc";

type Standings = {
  games_played: number;
  wins: number;
  losses: number;
  ties: number;
  record: string;
  win_pct: number | null;

  nfl_rank: number | null;
  conference_rank: number | null;
  division_rank: number | null;

  points_for: number;
  points_against: number;
  point_differential: number;

  home_record: string;
  away_record: string;
  division_record: string;
  conference_record: string;

  streak: string;
};

type OffenseStats = {
  points_per_game: number | null;
  td_per_game: number | null;
  field_goals_per_game: number | null;

  rush_attempts_per_game: number | null;
  rush_yards_per_game: number | null;

  receptions_per_game: number | null;
  receiving_yards_per_game: number | null;

  passing_yards_per_game: number | null;
  total_yards_per_game: number | null;

  yards_per_play: number | null;
  turnovers_per_game: number | null;
};

type DefenseStats = {
  points_allowed_per_game: number | null;
  td_allowed_per_game: number | null;
  field_goals_allowed_per_game: number | null;

  rush_attempts_allowed_per_game: number | null;
  rush_yards_allowed_per_game: number | null;

  receptions_allowed_per_game: number | null;
  receiving_yards_allowed_per_game: number | null;

  passing_yards_allowed_per_game: number | null;
  total_yards_allowed_per_game: number | null;

  yards_per_play_allowed: number | null;
  takeaways_per_game: number | null;
};

type TeamRanks = {
  offense?: Record<string, number | null>;
  defense?: Record<string, number | null>;
};

type TeamRecord = {
  team: string;
  conference: "AFC" | "NFC";
  division: "East" | "North" | "South" | "West";

  standings: Standings;
  offense: OffenseStats;
  defense: DefenseStats;
  ranks?: TeamRanks;
};

type NFLTeamMeta = {
  abbr?: string;
  name?: string;
  logo?: string;
};

type TeamRankingsPayload = {
  generated_at?: string;
  season?: number;
  season_type?: string;
  completed_games?: number;
  teams?: TeamRecord[];
};

type StatDefinition = {
  key: string;
  label: string;
  side: "offense" | "defense";
  value: (team: TeamRecord) => number | null;
};

const TEAM_NAMES: Record<string, string> = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  JAC: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LV: "Las Vegas Raiders",
  LAC: "Los Angeles Chargers",
  LAR: "Los Angeles Rams",
  LA: "Los Angeles Rams",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

const OFFENSE_STATS: StatDefinition[] = [
  {
    key: "points_per_game",
    label: "PTS/G",
    side: "offense",
    value: (team) => team.offense.points_per_game,
  },
  {
    key: "td_per_game",
    label: "TD/G",
    side: "offense",
    value: (team) => team.offense.td_per_game,
  },
  {
    key: "field_goals_per_game",
    label: "FG/G",
    side: "offense",
    value: (team) => team.offense.field_goals_per_game,
  },
  {
    key: "rush_attempts_per_game",
    label: "Rush Att/G",
    side: "offense",
    value: (team) => team.offense.rush_attempts_per_game,
  },
  {
    key: "rush_yards_per_game",
    label: "Rush Yds/G",
    side: "offense",
    value: (team) => team.offense.rush_yards_per_game,
  },
  {
    key: "receptions_per_game",
    label: "Rec/G",
    side: "offense",
    value: (team) => team.offense.receptions_per_game,
  },
  {
    key: "receiving_yards_per_game",
    label: "Rec Yds/G",
    side: "offense",
    value: (team) => team.offense.receiving_yards_per_game,
  },
  {
    key: "passing_yards_per_game",
    label: "Pass Yds/G",
    side: "offense",
    value: (team) => team.offense.passing_yards_per_game,
  },
  {
    key: "total_yards_per_game",
    label: "Total Yds/G",
    side: "offense",
    value: (team) => team.offense.total_yards_per_game,
  },
  {
    key: "yards_per_play",
    label: "Yds/Play",
    side: "offense",
    value: (team) => team.offense.yards_per_play,
  },
  {
    key: "turnovers_per_game",
    label: "TO/G",
    side: "offense",
    value: (team) => team.offense.turnovers_per_game,
  },
];

const DEFENSE_STATS: StatDefinition[] = [
  {
    key: "points_allowed_per_game",
    label: "PTS Allowed/G",
    side: "defense",
    value: (team) => team.defense.points_allowed_per_game,
  },
  {
    key: "td_allowed_per_game",
    label: "TD Allowed/G",
    side: "defense",
    value: (team) => team.defense.td_allowed_per_game,
  },
  {
    key: "field_goals_allowed_per_game",
    label: "FG Allowed/G",
    side: "defense",
    value: (team) => team.defense.field_goals_allowed_per_game,
  },
  {
    key: "rush_attempts_allowed_per_game",
    label: "Rush Att Allowed/G",
    side: "defense",
    value: (team) => team.defense.rush_attempts_allowed_per_game,
  },
  {
    key: "rush_yards_allowed_per_game",
    label: "Rush Yds Allowed/G",
    side: "defense",
    value: (team) => team.defense.rush_yards_allowed_per_game,
  },
  {
    key: "receptions_allowed_per_game",
    label: "Rec Allowed/G",
    side: "defense",
    value: (team) => team.defense.receptions_allowed_per_game,
  },
  {
    key: "receiving_yards_allowed_per_game",
    label: "Rec Yds Allowed/G",
    side: "defense",
    value: (team) => team.defense.receiving_yards_allowed_per_game,
  },
  {
    key: "passing_yards_allowed_per_game",
    label: "Pass Yds Allowed/G",
    side: "defense",
    value: (team) => team.defense.passing_yards_allowed_per_game,
  },
  {
    key: "total_yards_allowed_per_game",
    label: "Total Yds Allowed/G",
    side: "defense",
    value: (team) => team.defense.total_yards_allowed_per_game,
  },
  {
    key: "yards_per_play_allowed",
    label: "Yds/Play Allowed",
    side: "defense",
    value: (team) => team.defense.yards_per_play_allowed,
  },
  {
    key: "takeaways_per_game",
    label: "Takeaways/G",
    side: "defense",
    value: (team) => team.defense.takeaways_per_game,
  },
];

function teamName(team: string) {
  return TEAM_NAMES[team] || team;
}

function formatNumber(
  value: number | null | undefined,
  digits = 1,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return numeric.toFixed(digits);
}

function formatInteger(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return Math.round(numeric).toString();
}

function formatWinPct(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return numeric.toFixed(3).replace(/^0/, "");
}

function formatDifferential(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  if (numeric > 0) {
    return `+${numeric.toFixed(0)}`;
  }

  return numeric.toFixed(0);
}

function ordinal(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  const mod100 = numeric % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${numeric}th`;
  }

  switch (numeric % 10) {
    case 1:
      return `${numeric}st`;
    case 2:
      return `${numeric}nd`;
    case 3:
      return `${numeric}rd`;
    default:
      return `${numeric}th`;
  }
}

function rankText(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `#${value}`;
}

function getRank(
  team: TeamRecord,
  side: "offense" | "defense",
  key: string,
) {
  return team.ranks?.[side]?.[key] ?? null;
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
        active
          ? "border border-cyan-300/30 bg-cyan-300/15 text-cyan-200 shadow-[0_0_18px_rgba(35,216,255,0.15)]"
          : "border border-transparent text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function RankValue({
  value,
}: {
  value: number | null | undefined;
}) {
  return (
    <span
      className={
        value === 1
          ? "font-black text-cyan-200"
          : "font-bold text-slate-300"
      }
    >
      {rankText(value)}
    </span>
  );
}

function TeamCell({
  team,
  logoTeams,
}: {
  team: TeamRecord;
  logoTeams: NFLTeamMeta[];
}) {
  return (
    <div className="flex min-w-[210px] items-center gap-3">
      <NFLTeamLogo
  team={team.team}
  teams={logoTeams}
  size={44}
/>

      <div>
        <div className="font-black text-white">
          {teamName(team.team)}
        </div>

        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {team.team}
        </div>
      </div>
    </div>
  );
}

function StatCell({
  value,
  rank,
}: {
  value: number | null;
  rank: number | null;
}) {
  return (
    <div className="min-w-[105px] text-center">
      <div className="text-sm font-black text-white">
        {formatNumber(value)}
      </div>

      <div
        className={`mt-0.5 text-[10px] font-black ${
          rank !== null && rank <= 5
            ? "text-cyan-300"
            : rank !== null && rank >= 28
              ? "text-pink-300"
              : "text-slate-500"
        }`}
      >
        {rank !== null ? `#${rank} NFL` : "—"}
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
  align = "left",
  sticky = false,
}: {
  label: string;
  sortKey: string;
  activeSortKey: string;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  align?: "left" | "center";
  sticky?: boolean;
}) {
  const active = activeSortKey === sortKey;

  return (
    <th
      className={`${sticky ? "sticky left-0 z-20 bg-[#0b1524]" : ""} px-4 py-3 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap transition ${
          active
            ? "text-cyan-200"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <span>{label}</span>
        <span className={active ? "opacity-100" : "opacity-35"}>
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

function TeamRankingsTable({
  teams,
  view,
  sortKey,
  sortDirection,
  onSort,
  logoTeams,
}: {
  teams: TeamRecord[];
  view: StatsView;
  sortKey: string;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  logoTeams: NFLTeamMeta[];
}) {
  const stats =
    view === "offense"
      ? OFFENSE_STATS
      : view === "defense"
        ? DEFENSE_STATS
        : [];

  const minWidth =
    view === "overall"
      ? 1500
      : Math.max(1500, 390 + stats.length * 125);

  return (
    <section className="glass overflow-hidden rounded-3xl">
      <div className="border-b border-white/10 p-5">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">
          {view === "overall"
            ? "League Standings"
            : view === "offense"
              ? "Offensive Rankings"
              : "Defensive Rankings"}
        </div>

        <h2 className="mt-1 text-2xl font-black text-white">
          NFL Team Rankings
        </h2>

        {view !== "overall" ? (
          <p className="mt-2 text-sm text-slate-400">
            Season averages with NFL rank shown beneath each statistic.
          </p>
        ) : null}
      </div>

      <div className="table-scroll overflow-x-auto">
        <table
          className="w-full"
          style={{ minWidth }}
        >
          <thead className="bg-white/[0.04]">
            <tr className="border-b border-white/10 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
              {view === "overall" ? (
                <>
                  <SortableHeader
                    label="NFL"
                    sortKey="nfl_rank"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />

                  <SortableHeader
                    label="Team"
                    sortKey="team"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />

                  <SortableHeader
                    label="Conf"
                    sortKey="conference"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />

                  <SortableHeader
                    label="Division"
                    sortKey="division"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  />

                  <SortableHeader
                    label="Div Rank"
                    sortKey="division_rank"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Conf Rank"
                    sortKey="conference_rank"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Record"
                    sortKey="record"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Win %"
                    sortKey="win_pct"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="PF"
                    sortKey="points_for"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="PA"
                    sortKey="points_against"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Diff"
                    sortKey="point_differential"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Home"
                    sortKey="home_record"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Away"
                    sortKey="away_record"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Division"
                    sortKey="division_record"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Conference"
                    sortKey="conference_record"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Streak"
                    sortKey="streak"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />
                </>
              ) : (
                <>
                  <SortableHeader
                    label="Team"
                    sortKey="team"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    sticky
                  />

                  <SortableHeader
                    label="Conf"
                    sortKey="conference"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  <SortableHeader
                    label="Division"
                    sortKey="division"
                    activeSortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    align="center"
                  />

                  {stats.map((stat) => (
                    <SortableHeader
                      key={`${stat.side}-${stat.key}`}
                      label={stat.label}
                      sortKey={`${stat.side}.${stat.key}`}
                      activeSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={onSort}
                      align="center"
                    />
                  ))}
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {teams.map((team) => {
              const standings = team.standings;

              return (
                <tr
                  key={team.team}
                  className="border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.035]"
                >
                  {view === "overall" ? (
                    <>
                      <td className="px-4 py-3">
                        <RankValue value={standings.nfl_rank} />
                      </td>

                      <td className="px-4 py-3">
                        <TeamCell team={team} logoTeams={logoTeams} />
                      </td>

                      <td className="px-4 py-3 text-sm font-black text-white">
                        {team.conference}
                      </td>

                      <td className="px-4 py-3 text-sm font-bold text-slate-300">
                        {team.division}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-black text-white">
                        {ordinal(standings.division_rank)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-black text-white">
                        {rankText(standings.conference_rank)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-black text-white">
                        {standings.record}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {formatWinPct(standings.win_pct)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {formatInteger(standings.points_for)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {formatInteger(standings.points_against)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-black text-white">
                        {formatDifferential(standings.point_differential)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {standings.home_record}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {standings.away_record}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {standings.division_record}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {standings.conference_record}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-black text-white">
                        {standings.streak || "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="sticky left-0 z-10 bg-[#091321] px-4 py-3">
                        <TeamCell team={team} logoTeams={logoTeams} />
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-black text-white">
                        {team.conference}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-300">
                        {team.division}
                      </td>

                      {stats.map((stat) => (
                        <td
                          key={`${team.team}-${stat.side}-${stat.key}`}
                          className="px-4 py-3"
                        >
                          <StatCell
                            value={stat.value(team)}
                            rank={getRank(team, stat.side, stat.key)}
                          />
                        </td>
                      ))}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getSortValue(
  team: TeamRecord,
  sortKey: string,
): string | number | null {
  switch (sortKey) {
    case "team":
      return teamName(team.team);

    case "conference":
      return team.conference;

    case "division":
      return team.division;

    case "nfl_rank":
      return team.standings.nfl_rank;

    case "division_rank":
      return team.standings.division_rank;

    case "conference_rank":
      return team.standings.conference_rank;

    case "record":
    case "win_pct":
      return team.standings.win_pct;

    case "points_for":
      return team.standings.points_for;

    case "points_against":
      return team.standings.points_against;

    case "point_differential":
      return team.standings.point_differential;

    case "home_record":
      return team.standings.home_record;

    case "away_record":
      return team.standings.away_record;

    case "division_record":
      return team.standings.division_record;

    case "conference_record":
      return team.standings.conference_record;

    case "streak":
      return team.standings.streak;

    default:
      break;
  }

  if (sortKey.startsWith("offense.")) {
    const key = sortKey.replace("offense.", "");
    const stat = OFFENSE_STATS.find((item) => item.key === key);

    return stat ? stat.value(team) : null;
  }

  if (sortKey.startsWith("defense.")) {
    const key = sortKey.replace("defense.", "");
    const stat = DEFENSE_STATS.find((item) => item.key === key);

    return stat ? stat.value(team) : null;
  }

  return null;
}

function compareValues(
  a: string | number | null,
  b: string | number | null,
  direction: SortDirection,
) {
  const aMissing =
    a === null ||
    a === undefined ||
    (typeof a === "number" && !Number.isFinite(a));

  const bMissing =
    b === null ||
    b === undefined ||
    (typeof b === "number" && !Number.isFinite(b));

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

  if (typeof a === "number" && typeof b === "number") {
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

function defaultSortForView(
  view: StatsView,
): {
  key: string;
  direction: SortDirection;
} {
  if (view === "overall") {
    return {
      key: "nfl_rank",
      direction: "asc",
    };
  }

  if (view === "offense") {
    return {
      key: "offense.points_per_game",
      direction: "desc",
    };
  }

  return {
    key: "defense.points_allowed_per_game",
    direction: "asc",
  };
}

export default function NFLNextTeamsPage() {
  const [payload, setPayload] =
    useState<TeamRankingsPayload | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [logoTeams, setLogoTeams] =
    useState<NFLTeamMeta[]>([]);

  const [conference, setConference] =
    useState<ConferenceFilter>("ALL");

  const [statsView, setStatsView] =
    useState<StatsView>("overall");

  const [sortKey, setSortKey] =
    useState("nfl_rank");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  useEffect(() => {
    let cancelled = false;

    async function loadTeamLogos() {
      try {
        const response = await fetch("/data/nfl/teams.json", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("NFL team logo data unavailable");
        }

        const data = await response.json();

        const teams = Array.isArray(data)
          ? data
          : Array.isArray(data?.teams)
            ? data.teams
            : [];

        if (!cancelled) {
          setLogoTeams(teams);
        }
      } catch {
        if (!cancelled) {
          setLogoTeams([]);
        }
      }
    }

    loadTeamLogos();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setLoading(true);

      try {
        const response = await fetch(
          "/data/nfl/team_rankings.json",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "NFL team rankings unavailable",
          );
        }

        const data =
          (await response.json()) as TeamRankingsPayload;

        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleStatsViewChange(
    nextView: StatsView,
  ) {
    setStatsView(nextView);

    const nextSort =
      defaultSortForView(nextView);

    setSortKey(nextSort.key);
    setSortDirection(nextSort.direction);
  }

  function handleSort(nextKey: string) {
    if (nextKey === sortKey) {
      setSortDirection((current) =>
        current === "asc"
          ? "desc"
          : "asc",
      );

      return;
    }

    setSortKey(nextKey);

    if (
      nextKey === "nfl_rank" ||
      nextKey === "division_rank" ||
      nextKey === "conference_rank" ||
      nextKey === "points_against" ||
      nextKey.startsWith("defense.")
    ) {
      setSortDirection(
        nextKey === "defense.takeaways_per_game"
          ? "desc"
          : "asc",
      );

      return;
    }

    if (
      nextKey === "win_pct" ||
      nextKey === "record" ||
      nextKey === "points_for" ||
      nextKey === "point_differential" ||
      nextKey.startsWith("offense.")
    ) {
      setSortDirection("desc");
      return;
    }

    setSortDirection("asc");
  }

  const teams = useMemo(() => {
    const source =
      payload?.teams || [];

    const filtered =
      conference === "ALL"
        ? source
        : source.filter(
            (team) =>
              team.conference ===
              conference,
          );

    return [...filtered].sort(
      (a, b) => {
        const comparison =
          compareValues(
            getSortValue(a, sortKey),
            getSortValue(b, sortKey),
            sortDirection,
          );

        if (comparison !== 0) {
          return comparison;
        }

        return teamName(
          a.team,
        ).localeCompare(
          teamName(b.team),
        );
      },
    );
  }, [
    payload,
    conference,
    sortKey,
    sortDirection,
  ]);

  if (loading) {
    return (
      <section className="glass rounded-3xl p-8 text-center text-slate-400">
        Loading NFL team rankings...
      </section>
    );
  }

  if (
    !payload ||
    !payload.teams?.length
  ) {
    return (
      <section className="glass rounded-3xl p-8 text-center">
        <div className="text-lg font-black text-white">
          NFL Team Rankings Unavailable
        </div>

        <div className="mt-2 text-sm text-slate-400">
          Generate and publish
          /data/nfl/team_rankings.json
          from the NFL model pipeline.
        </div>
      </section>
    );
  }

  const season =
    payload.season || 2026;

  const completedGames =
    payload.completed_games || 0;

  return (
    <div className="space-y-5">
      <section className="glass rounded-3xl p-5">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
            Alpha Wagerz NFL
          </div>

          <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
            NFL Teams
          </h1>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
            <Trophy
              size={16}
              className="text-cyan-300"
            />

            {season} Season{" "}
            {statsView === "overall"
              ? "Overall Rankings"
              : statsView === "offense"
                ? "Offensive Rankings"
                : "Defensive Rankings"}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-[#091120]/80 p-2">
            <button
              type="button"
              onClick={() =>
                handleStatsViewChange(
                  "overall",
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-black transition ${
                statsView === "overall"
                  ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.12)]"
                  : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <BarChart3 size={15} />
              Overall
            </button>

            <button
              type="button"
              onClick={() =>
                handleStatsViewChange(
                  "offense",
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-black transition ${
                statsView === "offense"
                  ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.12)]"
                  : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <BarChart3 size={15} />
              Offense
            </button>

            <button
              type="button"
              onClick={() =>
                handleStatsViewChange(
                  "defense",
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-black transition ${
                statsView === "defense"
                  ? "border-pink-300/40 bg-pink-500/15 text-pink-100 shadow-[0_0_18px_rgba(244,114,182,0.12)]"
                  : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Shield size={15} />
              Defense
            </button>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.025] p-1">
            {(
              [
                "ALL",
                "AFC",
                "NFC",
              ] as const
            ).map((option) => (
              <FilterButton
                key={option}
                active={
                  conference === option
                }
                onClick={() =>
                  setConference(option)
                }
              >
                {option === "ALL"
                  ? "All NFL"
                  : option}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            {payload.teams.length} Teams
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
            {completedGames} Completed REG Games
          </div>

          {completedGames === 0 ? (
            <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-200">
              Regular Season Not Started
            </div>
          ) : null}
        </div>
      </section>

      <TeamRankingsTable
        teams={teams}
        view={statsView}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        logoTeams={logoTeams}
      />
    </div>
  );
}
