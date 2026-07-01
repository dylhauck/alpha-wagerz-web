import { StatCell } from "@/components/StatCell";
import { TeamLogo } from "@/components/TeamLogo";

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

function HeaderCell({ label }: { label: string }) {
  return (
    <div className="flex h-8 w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.045] px-1 text-center text-[9px] font-black uppercase leading-none tracking-[0.03em] text-slate-300">
      {label}
    </div>
  );
}

function PlayerCell({
  hitter,
  rank,
}: {
  hitter: Record<string, any>;
  rank: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100">
        {rank}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-black text-white">{hitter.Player}</div>
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
  const sorted = [...hitters].sort(
    (a, b) => Number(b.Likely || 0) - Number(a.Likely || 0)
  );

  const topTarget = sorted[0];

  return (
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
          <div className="text-sm font-black text-white">{topTarget?.Player || "—"}</div>
        </div>
      </div>

      <div className="grid gap-1">
        <div className="grid gap-1" style={gridStyle}>
          <HeaderCell label="Player" />
          {columns.map(([label]) => (
            <HeaderCell key={label} label={label} />
          ))}
        </div>

        {sorted.map((hitter, index) => (
          <div
            key={`${team}-${hitter.Player}-${index}`}
            className="grid items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03]"
style={gridStyle}
          >
            <PlayerCell hitter={hitter} rank={index + 1} />

            {columns.map(([, key]) => (
              <RowValue key={key} value={hitter[key]} statKey={key} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}