"use client";

import { useMemo, useRef, useState } from "react";
import { StatCell } from "@/components/StatCell";

type SortDirection = "desc" | "asc";

const TABLE_MIN_WIDTH = 1500;

const columns = [
  ["Pitcher", "Pitcher"],
  ["Game", "game"],
  ["Team", "Team"],
  ["Opponent", "Opponent"],
  ["Alpha", "Pitch Score"],
  ["K Score", "Strikeout Score"],
  ["HR Vuln", "HR Vulnerability"],
  ["FB%", "Fly Ball Profile"],
  ["Brl%", "Barrel Profile"],
  ["xwOBA", "xwOBA"],
  ["CSW%", "CSW%"],
  ["SwStr%", "SwStr%"],
  ["Ball%", "Ball%"],
  ["Brl/BIP", "Brl/BIP%"],
  ["HH%", "HH%"],
  ["HR/9", "HR/9"],
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
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-center whitespace-nowrap px-2 text-center text-[11px] font-black uppercase tracking-[0.12em] transition ${
        active ? "text-white" : "text-slate-500 hover:text-cyan-200"
      }`}
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

function formatNumber(value: any) {
  if (value === "" || value === null || value === undefined) return "—";

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;

  return numeric.toFixed(2).replace(/\.00$/, "");
}

function PlainCell({ value, suffix = "" }: { value: any; suffix?: string }) {
  const display = formatNumber(value);

  return (
    <div className="flex h-8 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1 text-xs font-black text-slate-200">
      {display}
      {display !== "—" ? suffix : ""}
    </div>
  );
}

function StatWrap({
  value,
  statKey,
  suffix,
}: {
  value: any;
  statKey: any;
  suffix?: string;
}) {
  return (
    <div className="flex h-8 w-full items-center justify-center">
      <StatCell value={value} statKey={statKey} suffix={suffix} compact />
    </div>
  );
}

export function PitcherTable({ pitchers }: { pitchers: Record<string, any>[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const [sortKey, setSortKey] = useState<string>("Pitch Score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(key);
    setSortDirection("desc");
  }

  function syncScrollLeft(value: number) {
    if (scrollRef.current) scrollRef.current.scrollLeft = value;
    if (topScrollRef.current) topScrollRef.current.scrollLeft = value;
  }

  const sortedPitchers = useMemo(() => {
    return [...pitchers].sort((a, b) => {
      const aValue = sortValue(a[sortKey]);
      const bValue = sortValue(b[sortKey]);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
      }

      return sortDirection === "desc"
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });
  }, [pitchers, sortKey, sortDirection]);

  return (
    <section className="glass rounded-3xl p-4">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {`${pitchers.length} TOTAL PITCHERS LOADED FOR TODAY'S SLATE`}
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
            <col className="w-[230px]" />
            <col className="w-[260px]" />
            <col className="w-[90px]" />
            <col className="w-[110px]" />
            {columns.slice(4).map(([label]) => (
              <col key={label} className="w-[78px]" />
            ))}
          </colgroup>

          <thead>
            <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {columns.map(([label, key], index) => (
                <th
                  key={`${label}-${index}`}
                  className={`bg-[#0b1020] ${
                    index === 0 ? "sticky left-0 z-20" : ""
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
            {sortedPitchers.map((p, index) => (
              <tr
                key={`${p.game_id}-${p.Pitcher}-${index}`}
                className="rounded-2xl bg-white/[0.035] text-sm"
              >
                <td className="sticky left-0 z-10 rounded-l-2xl bg-[#11182c] px-3 py-3">
                  <div className="truncate font-black text-white">
                    {p.Pitcher || "TBD"}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {p["Pitcher Notes"] || ""}
                  </div>
                </td>

                <td className="px-3 py-3 text-sm text-slate-300">{p.game}</td>
                <td className="px-3 py-3 text-sm text-slate-300">{p.Team}</td>
                <td className="px-3 py-3 text-sm text-slate-300">{p.Opponent}</td>

                <td className="px-1 py-3">
                  <StatWrap value={p["Pitch Score"]} statKey="Likely" />
                </td>
                <td className="px-1 py-3">
                  <StatWrap value={p["Strikeout Score"]} statKey="Likely" />
                </td>
                <td className="px-1 py-3">
                <StatWrap value={p["HR Vulnerability"]} statKey="HR Vulnerability" />
                </td>
                <td className="px-1 py-3">
                <StatWrap value={p["Fly Ball Profile"]} statKey="Fly Ball Profile" />
                </td>
                <td className="px-1 py-3">
                <StatWrap value={p["Barrel Profile"]} statKey="Barrel Profile" />
                </td>
                <td className="px-1 py-3">
                <StatWrap value={p.xwOBA} statKey="Pitcher xwOBA" />
                </td>
                <td className="px-1 py-3"><StatWrap value={p["CSW%"]} statKey="CSW%" suffix="%" /></td>
                <td className="px-1 py-3"><StatWrap value={p["SwStr%"]} statKey="Pitcher SwStr%" suffix="%" /></td>
                <td className="px-1 py-3"><StatWrap value={p["Ball%"]} statKey="Ball%" suffix="%" /></td>
                <td className="px-1 py-3"><StatWrap value={p["Brl/BIP%"]} statKey="Pitcher Brl/BIP%" suffix="%" /></td>
                <td className="px-1 py-3"><StatWrap value={p["HH%"]} statKey="Pitcher HH%" suffix="%" /></td>
                <td className="rounded-r-2xl px-1 py-3"><StatWrap value={p["HR/9"]} statKey="HR/9" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}