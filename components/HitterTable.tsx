"use client";

import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { StatCell } from "./StatCell";
import type { RelativeHeatRange, StatKey } from "@/lib/statColors";
import { PlayerNameButton } from "@/components/players/PlayerNameButton";
import { PlayerProfileModal } from "@/components/players/PlayerProfileModal";

export type HitterRow = Record<string, any>;
type SortDirection = "desc" | "asc";

const TABLE_MIN_WIDTH = 1780;

const columns = [
  ["Player", "Player"],
  ["Game", "game"],
  ["Likely", "Likely"],
  ["Alpha", "Test Score"],
  ["Matchup", "Matchup"],
  ["Ceiling", "Ceiling"],
  ["Zone Fit", "Zone Fit"],
  ["HR Form", "HR Form"],
  ["kHR", "kHR"],
  ["PIT", "Pitches"],
  ["BIP", "BIP"],
  ["ISO", "ISO"],
  ["xwOBA", "xwOBA"],
  ["xCON", "xwOBAcon"],
  ["SwStr%", "SwStr%"],
  ["PullBrl%", "PulledBrl%"],
  ["Brl/BIP%", "Brl/BIP%"],
  ["FB%", "FB%"],
  ["HH%", "HH%"],
  ["LA", "LA"],
] as const;

function sortValue(value: any) {
  if (value === "" || value === null || value === undefined) return -999999;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric;

  return String(value).toLowerCase();
}

function HeaderButton({
  label,
  active,
  direction,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-center whitespace-nowrap px-2 text-center text-[11px] font-black uppercase tracking-[0.12em] transition ${
        active ? "text-white" : "text-slate-500 hover:text-cyan-200"
      } ${className}`}
    >
      {label}
      {active ? (
        <span className="ml-1 text-[10px] text-cyan-200">
          {direction === "desc" ? "▼" : "▲"}
        </span>
      ) : null}
    </button>
  );
}

function PlainCell({ value }: { value: any }) {
  return (
    <div className="flex h-8 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1 text-xs font-black text-slate-200">
      {value || "—"}
    </div>
  );
}

function StatWrap({
  value,
  statKey,
  suffix,
  trend,
  relativeRange,
}: {
  value: any;
  statKey: StatKey;
  suffix?: string;
  trend?: string | null;
  relativeRange?: RelativeHeatRange | null;
}) {
  return (
    <div className="flex h-8 w-full items-center justify-center">
      <StatCell
        value={value}
        statKey={statKey}
        suffix={suffix}
        compact
        trend={trend}
        relativeRange={relativeRange}
      />
    </div>
  );
}


const relativeStatKeys: StatKey[] = [
  "Likely",
  "Test Score",
  "Matchup",
  "Ceiling",
  "Zone Fit",
  "HR Form",
  "kHR",
  "ISO",
  "xwOBA",
  "xwOBAcon",
  "SwStr%",
  "PulledBrl%",
  "Brl/BIP%",
  "FB%",
  "HH%",
  "LA",
];

function teamKey(hitter: HitterRow) {
  return String(
    hitter.team ||
    hitter.Team ||
    hitter.team_name ||
    hitter.teamName ||
    "Unknown",
  );
}

function buildTeamRanges(hitters: HitterRow[]) {
  const grouped = new Map<string, HitterRow[]>();

  for (const hitter of hitters) {
    const key = teamKey(hitter);
    const rows = grouped.get(key) ?? [];
    rows.push(hitter);
    grouped.set(key, rows);
  }

  const ranges = new Map<string, Partial<Record<StatKey, RelativeHeatRange>>>();

  for (const [team, rows] of grouped.entries()) {
    const teamRanges: Partial<Record<StatKey, RelativeHeatRange>> = {};

    for (const statKey of relativeStatKeys) {
      const values = rows
        .map((row) => Number(row[statKey]))
        .filter((value) => Number.isFinite(value) && value !== 0);

      if (!values.length) continue;

      teamRanges[statKey] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    ranges.set(team, teamRanges);
  }

  return ranges;
}

  export function HitterTable({
    hitters,
    slateLabel = "Today's Slate",
  }: {
    hitters: HitterRow[];
    slateLabel?: string;
  }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const [sortKey, setSortKey] = useState<string>("Likely");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPlayer, setSelectedPlayer] = useState<Record<string, any> | null>(null);
  const [search, setSearch] = useState("");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(key);
    setSortDirection("desc");
  }

  const filteredHitters = useMemo(() => {
  const term = search.trim().toLowerCase();

  if (!term) return hitters;

  return hitters.filter((hitter) =>
    String(hitter.Player || "")
      .toLowerCase()
      .includes(term)
  );
}, [hitters, search]);

const sortedHitters = useMemo(() => {
  return [...filteredHitters].sort((a, b) => {
    const aValue = sortValue(a[sortKey]);
    const bValue = sortValue(b[sortKey]);

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "desc"
        ? bValue - aValue
        : aValue - bValue;
    }

    return sortDirection === "desc"
      ? String(bValue).localeCompare(String(aValue))
      : String(aValue).localeCompare(String(bValue));
  });
}, [filteredHitters, sortKey, sortDirection]);

const teamRanges = useMemo(() => {
  return buildTeamRanges(hitters);
}, [hitters]);

function rangeFor(hitter: HitterRow, statKey: StatKey) {
  return teamRanges.get(teamKey(hitter))?.[statKey] ?? null;
}

  function syncScrollLeft(value: number) {
    if (scrollRef.current) scrollRef.current.scrollLeft = value;
    if (topScrollRef.current) topScrollRef.current.scrollLeft = value;
  }

  return (
    <>
      <section className="glass rounded-3xl p-4">
      <div className="mb-4 flex flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {`${hitters.length} TOTAL HITTERS LOADED FOR ${slateLabel.toUpperCase()}`}
        </div>
      </div>
      <div className="mt-4 flex justify-center">
  <div className="relative w-full max-w-md">
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
    />

    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search player..."
      className="w-full rounded-xl border border-cyan-300/20 bg-[#0d1527] py-3 pl-10 pr-10 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/60"
    />

    {search && (
      <button
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
      >
        <X size={16} />
      </button>
    )}
  </div>
</div>

      <div
        ref={topScrollRef}
        className="table-scroll mb-2 overflow-x-auto pb-2"
        onScroll={(e) => syncScrollLeft(e.currentTarget.scrollLeft)}
      >
        <div style={{ width: TABLE_MIN_WIDTH }} className="h-1" />
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto"
        onScroll={(e) => syncScrollLeft(e.currentTarget.scrollLeft)}
      >
        <table
          className="w-full border-separate border-spacing-y-2 text-left"
          style={{ minWidth: TABLE_MIN_WIDTH }}
        >
          <colgroup>
            <col className="w-[64px]" />
            <col className="w-[230px]" />
            <col className="w-[260px]" />
            {columns.slice(2).map(([label]) => (
              <col key={label} className="w-[78px]" />
            ))}
          </colgroup>

          <thead>
            <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="sticky left-0 z-20 bg-[#0b1020]">
                <div className="flex h-10 items-center justify-center px-2">
                  Rank
                </div>
              </th>

              {columns.map(([label, key], index) => (
                <th
                  key={`${label}-${index}`}
                  className={`bg-[#0b1020] ${
                    index === 0 ? "sticky left-[64px] z-20" : ""
                  }`}
                >
                  <HeaderButton
                    label={label}
                    active={sortKey === key}
                    direction={sortDirection}
                    onClick={() => handleSort(key)}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedHitters.map((hitter, index) => (
              <tr
                key={`${hitter.game_id}-${hitter.Player}-${index}`}
                className="rounded-2xl bg-white/[0.035] text-sm"
              >
                <td className="sticky left-0 z-10 rounded-l-2xl bg-[#11182c] px-3 py-3 text-center font-black text-cyan-200">
                  #{index + 1}
                </td>

                <td className="sticky left-[64px] z-10 bg-[#11182c] px-3 py-3">
                  <PlayerNameButton
                    name={hitter.Player || "—"}
                    onClick={() =>
                      setSelectedPlayer({
                        playerId:
                          hitter.player_id ||
                          hitter.playerId ||
                          hitter.mlb_id ||
                          hitter.mlbId,
                        playerName: hitter.Player || "",
                        teamName: hitter.team || hitter.Team || "",
                        teamId:
                          hitter.team_id ||
                          hitter.teamId ||
                          hitter.mlb_team_id,
                        playerType: "hitter",
                      })
                    }
                    className="block w-full"
                  />
                  <div className="truncate text-xs text-slate-500">{hitter.team}</div>
                </td>

                <td className="px-3 py-3 text-sm text-slate-300">{hitter.game}</td>

                <td className="px-1 py-3"><StatWrap value={hitter.Likely} statKey="Likely" relativeRange={rangeFor(hitter, "Likely")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["Test Score"]} statKey="Test Score" relativeRange={rangeFor(hitter, "Test Score")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter.Matchup} statKey="Matchup" relativeRange={rangeFor(hitter, "Matchup")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter.Ceiling} statKey="Ceiling" relativeRange={rangeFor(hitter, "Ceiling")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["Zone Fit"]} statKey="Zone Fit" relativeRange={rangeFor(hitter, "Zone Fit")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["HR Form"]} statKey="HR Form" trend={hitter["HR Form Trend"]} relativeRange={rangeFor(hitter, "HR Form")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter.kHR} statKey="kHR" relativeRange={rangeFor(hitter, "kHR")} /></td>

                <td className="px-1 py-3"><PlainCell value={hitter.Pitches} /></td>
                <td className="px-1 py-3"><PlainCell value={hitter.BIP} /></td>

                <td className="px-1 py-3"><StatWrap value={hitter.ISO} statKey="ISO" relativeRange={rangeFor(hitter, "ISO")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter.xwOBA} statKey="xwOBA" relativeRange={rangeFor(hitter, "xwOBA")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter.xwOBAcon} statKey="xwOBAcon" relativeRange={rangeFor(hitter, "xwOBAcon")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["SwStr%"]} statKey="SwStr%" suffix="%" relativeRange={rangeFor(hitter, "SwStr%")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["PulledBrl%"]} statKey="PulledBrl%" suffix="%" relativeRange={rangeFor(hitter, "PulledBrl%")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["Brl/BIP%"]} statKey="Brl/BIP%" suffix="%" relativeRange={rangeFor(hitter, "Brl/BIP%")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["FB%"]} statKey="FB%" suffix="%" relativeRange={rangeFor(hitter, "FB%")} /></td>
                <td className="px-1 py-3"><StatWrap value={hitter["HH%"]} statKey="HH%" suffix="%" relativeRange={rangeFor(hitter, "HH%")} /></td>
                <td className="rounded-r-2xl px-1 py-3"><StatWrap value={hitter.LA} statKey="LA" relativeRange={rangeFor(hitter, "LA")} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

      <PlayerProfileModal
        player={selectedPlayer as any}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}