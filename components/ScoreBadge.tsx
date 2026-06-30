import { StatCell } from "./StatCell";

export function ScoreBadge({ value }: { value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <StatCell value={value} statKey="Likely" />
      <span className="text-xs text-slate-400">Likely</span>
    </div>
  );
}