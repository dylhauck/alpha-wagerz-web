"use client";

import { useMemo, useState } from "react";
import { StatCell } from "@/components/StatCell";
import { TeamLogo } from "@/components/TeamLogo";
import { PlayerNameButton } from "@/components/players/PlayerNameButton";
import { PlayerProfileModal } from "@/components/players/PlayerProfileModal";

const columns = [
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
  ["BRL/BIP%", "Brl/BIP%"],
  ["FB%", "FB%"],
  ["HH%", "HH%"],
  ["LA", "LA"],
  ["Likely", "Likely"],
] as const;

type SortDirection = "desc" | "asc";

const gridStyle = {
  gridTemplateColumns: "minmax(190px, 1.9fr) repeat(18, minmax(0, 1fr))",
} as const;

function formatPlain(value: unknown) {
  if (value === "" || value === null || value === undefined) return "—";

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  if (Number.isInteger(numeric)) return numeric.toString();

  return numeric.toFixed(2).replace(/\.00$/, "");
}

function numericValue(value: unknown) {
  if (value === "" || value === null || value === undefined) return -999999;

  const numeric = Number(value);
  return Number.isNaN(numeric) ? -999999 : numeric;
}

function HeaderCell({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active?: boolean;
  direction?: SortDirection;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-full items-center justify-center rounded-md border px-1 text-center text-[9px] font-black uppercase leading-none tracking-[0.03em] transition ${
        active
          ? "border-cyan-300/50 bg-cyan-300/15 text-white"
          : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-pink-300/40 hover:text-white"
      }`}
    >
      {label}
      {active ? (
        <span className="ml-1 text-[8px] text-cyan-200">
          {direction === "desc" ? "▼" : "▲"}
        </span>
      ) : null}
    </button>
  );
}

function PlayerCell({
  hitter,
  rank,
  onPlayerClick,
}: {
  hitter: Record<string, any>;
  rank: number;
  onPlayerClick: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100">
        {rank}
      </div>

      <div className="min-w-0">
        <PlayerNameButton
          name={hitter.Player || "—"}
          onClick={onPlayerClick}
          className="block w-full text-sm"
        />
        <div className="text-[11px] font-bold text-slate-500">
          {hitter.Bats ? `Bats ${hitter.Bats}` : "Bats —"}
        </div>
      </div>
    </div>
  );
}

function PlainCell({ value }: { value: unknown }) {
  return (
    <div className="flex h-8 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1 text-xs font-black text-slate-200">
      {formatPlain(value)}
    </div>
  );
}

function RowValue({
  value,
  statKey,
}: {
  value: unknown;
  statKey: any;
}) {
  const suffix = String(statKey).includes("%") ? "%" : undefined;

  if (statKey === "Pitches" || statKey === "BIP") {
    return <PlainCell value={value} />;
  }

  return (
    <div className="flex h-8 w-full items-center justify-center">
      <StatCell value={value as any} statKey={statKey} suffix={suffix} compact />
    </div>
  );
}

export function GameHitterTable({
  title,
  team,
  hitters,
}: {
  title: string;
  team: string;
  hitters: Record<string, any>[];
}) {
  const [sortKey, setSortKey] = useState<string>("Likely");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPlayer, setSelectedPlayer] = useState<Record<string, any> | null>(null);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(key);
    setSortDirection("desc");
  }

  const sorted = useMemo(() => {
    return [...hitters].sort((a, b) => {
      const aValue = numericValue(a[sortKey]);
      const bValue = numericValue(b[sortKey]);

      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });
  }, [hitters, sortKey, sortDirection]);

  const topTarget = [...hitters].sort(
    (a, b) => Number(b.Likely || 0) - Number(a.Likely || 0)
  )[0];

  function openPlayer(hitter: Record<string, any>) {
    setSelectedPlayer({
      playerId:
        hitter.player_id ||
        hitter.playerId ||
        hitter.mlb_id ||
        hitter.mlbId,
      playerName: hitter.Player || "",
      teamName: team || hitter.team || hitter.Team || "",
      teamId:
        hitter.team_id ||
        hitter.teamId ||
        hitter.mlb_team_id,
      playerType: "hitter",
    });
  }

  return (
    <>
      <section className="glass rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TeamLogo team={team} size={46} />
          <div>
            <h2 className="text-xl font-black text-white">{title}</h2>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              {sorted.length} hitters loaded
            </div>
          </div>
        </div>

        <div className="hidden rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 sm:block">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            Top Target
          </div>
          {topTarget ? (
            <PlayerNameButton
              name={topTarget.Player || "—"}
              onClick={() => openPlayer(topTarget)}
              className="block text-sm"
            />
          ) : (
            <div className="text-sm font-black text-white">—</div>
          )}
        </div>
      </div>

      <div className="grid gap-1">
        <div className="grid gap-1" style={gridStyle}>
          <HeaderCell
            label="Player"
            active={sortKey === "Likely"}
            direction={sortDirection}
            onClick={() => handleSort("Likely")}
          />

          {columns.map(([label, key]) => (
            <HeaderCell
              key={key}
              label={label}
              active={sortKey === key}
              direction={sortDirection}
              onClick={() => handleSort(key)}
            />
          ))}
        </div>

        {sorted.map((hitter, index) => (
          <div
            key={`${team}-${hitter.Player}-${index}`}
            className="grid items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03]"
            style={gridStyle}
          >
            <PlayerCell
              hitter={hitter}
              rank={index + 1}
              onPlayerClick={() => openPlayer(hitter)}
            />

            {columns.map(([, key]) => (
              <RowValue key={key} value={hitter[key]} statKey={key} />
            ))}
          </div>
        ))}
      </div>
      </section>

      <PlayerProfileModal
        player={selectedPlayer as any}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}