import { getHeatStyle, StatKey } from "@/lib/statColors";
import {
  ArrowDown,
  ArrowUp,
  Minus,
} from "lucide-react";

type TrendDirection = "up" | "down" | "flat";

type StatCellProps = {
  value: string | number | null | undefined;
  statKey: StatKey;
  suffix?: string;
  compact?: boolean;
  trend?: TrendDirection | string | null;
};

function isMissing(
  value: string | number | null | undefined,
) {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    Number(value) === 0
  );
}

function formatValue(
  value: string | number | null | undefined,
) {
  if (isMissing(value)) return "—";

  const numeric = Number(value);

  if (Number.isNaN(numeric)) return value;

  if (Number.isInteger(numeric)) {
    return numeric.toString();
  }

  return numeric.toFixed(2).replace(/\.00$/, "");
}

function TrendArrow({
  trend,
}: {
  trend?: TrendDirection | string | null;
}) {
  const normalized = String(trend || "")
    .trim()
    .toLowerCase();

  if (
    normalized !== "up" &&
    normalized !== "down" &&
    normalized !== "flat"
  ) {
    return null;
  }

  const Icon =
    normalized === "up"
      ? ArrowUp
      : normalized === "down"
        ? ArrowDown
        : Minus;

  const title =
    normalized === "up"
      ? "HR form trending up"
      : normalized === "down"
        ? "HR form trending down"
        : "HR form holding steady";

  return (
    <span
      title={title}
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-black/20 bg-black/75 shadow-sm"
    >
      <Icon
        size={10}
        strokeWidth={3}
        className="text-white"
      />
    </span>
  );
}

export function StatCell({
  value,
  statKey,
  suffix,
  compact = false,
  trend,
}: StatCellProps) {
  const displayValue = formatValue(value);

  const style = isMissing(value)
    ? {
        background: "rgba(148, 163, 184, 0.12)",
        borderColor: "rgba(148, 163, 184, 0.20)",
        color: "#cbd5e1",
      }
    : getHeatStyle(value, statKey);

  const showTrend =
    statKey === "HR Form" &&
    displayValue !== "—";

  const formattedValue = (
    <>
      {displayValue}
      {displayValue !== "—" && suffix
        ? suffix
        : ""}
    </>
  );

  return (
  <span
    className={`relative flex items-center justify-center border text-center text-xs font-black leading-none shadow-sm ${
      compact
        ? "h-8 w-full rounded-md px-1"
        : "min-w-[64px] rounded-lg px-2.5 py-1"
    }`}
    style={style}
  >
    <span className={showTrend ? "pr-5" : ""}>
      {formattedValue}
    </span>

    {showTrend ? (
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
        <TrendArrow trend={trend} />
      </span>
    ) : null}
  </span>
);
}