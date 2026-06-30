import { StatCell } from "@/components/StatCell";

type Props = {
  team: string;
  targets: Record<string, any>[];
};

export function GameTargetList({ team, targets }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {team}
      </div>

      <div className="space-y-2">
        {targets.length === 0 ? (
          <div className="text-sm text-slate-500">No hitters loaded</div>
        ) : (
          targets.map((hitter, index) => (
            <div
              key={`${team}-${hitter.Player}-${index}`}
              className="flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-black text-white">{hitter.Player}</div>
                <div className="text-[11px] text-slate-500">
                  Test {hitter["Test Score"] || "—"} · Brl {hitter["Brl/BIP%"] || "—"}%
                </div>
              </div>

              <StatCell value={hitter.Likely} statKey="Likely" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}