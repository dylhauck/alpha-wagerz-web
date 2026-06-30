import { getHeatStyle, StatKey } from "@/lib/statColors";

type StatCellProps = {
  value: string | number | null | undefined;
  statKey: StatKey;
  suffix?: string;
};

function formatValue(value: string | number | null | undefined) {
  if (value === "" || value === null || value === undefined) return "—";

  const numeric = Number(value);

  if (Number.isNaN(numeric)) return value;

  if (Number.isInteger(numeric)) return numeric.toString();

  return numeric.toFixed(2).replace(/\.00$/, "");
}

export function StatCell({ value, statKey, suffix }: StatCellProps) {
  const style = getHeatStyle(value, statKey);
  const displayValue = formatValue(value);

  return (
    <span
      className="inline-flex min-w-[64px] items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-black shadow-sm"
      style={style}
    >
      {displayValue}
      {displayValue !== "—" && suffix ? suffix : ""}
    </span>
  );
}