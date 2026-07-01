import { getHeatStyle, StatKey } from "@/lib/statColors";

type StatCellProps = {
  value: string | number | null | undefined;
  statKey: StatKey;
  suffix?: string;
  compact?: boolean;
};

function isMissing(value: string | number | null | undefined) {
  return value === "" || value === null || value === undefined || Number(value) === 0;
}

function formatValue(value: string | number | null | undefined) {
  if (isMissing(value)) return "—";

  const numeric = Number(value);

  if (Number.isNaN(numeric)) return value;

  if (Number.isInteger(numeric)) return numeric.toString();

  return numeric.toFixed(2).replace(/\.00$/, "");
}

export function StatCell({ value, statKey, suffix, compact = false }: StatCellProps) {
  const displayValue = formatValue(value);
  const style = isMissing(value)
    ? {
        background: "rgba(148, 163, 184, 0.12)",
        borderColor: "rgba(148, 163, 184, 0.20)",
        color: "#cbd5e1",
      }
    : getHeatStyle(value, statKey);

  return (
    <span
      className={`flex items-center justify-center border text-center text-xs font-black leading-none shadow-sm ${
        compact
          ? "h-8 w-full rounded-md px-1"
          : "min-w-[64px] rounded-lg px-2.5 py-1"
      }`}
      style={style}
    >
      {displayValue}
      {displayValue !== "—" && suffix ? suffix : ""}
    </span>
  );
}