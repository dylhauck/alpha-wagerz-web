export type StatKey =
  | "Likely"
  | "Test Score"
  | "Matchup"
  | "Ceiling"
  | "Zone Fit"
  | "HR Form"
  | "kHR"
  | "ISO"
  | "xwOBA"
  | "xwOBAcon"
  | "Brl/BIP%"
  | "PulledBrl%"
  | "Sweet Spot%"
  | "FB%"
  | "HH%"
  | "LA"
  | "SwStr%"
  | "Arsenal Score"
  | "Fastball Matchup"
  | "Breaking Ball Matchup"
  | "Offspeed Matchup"
  | "xHR Matchup"
  | "Weather"
  | "Park"
  | "Bullpen"
  | "Team";

type Direction = "higher-good" | "lower-good" | "range-good";

type StatRule = {
  min: number;
  max: number;
  direction: Direction;
  goodRange?: [number, number];
};

const rules: Partial<Record<StatKey, StatRule>> = {
  Likely: { min: 40, max: 85, direction: "higher-good" },
  "Test Score": { min: 40, max: 90, direction: "higher-good" },
  Matchup: { min: 35, max: 85, direction: "higher-good" },
  Ceiling: { min: 30, max: 95, direction: "higher-good" },
  "Zone Fit": { min: 30, max: 90, direction: "higher-good" },
  "HR Form": { min: 25, max: 90, direction: "higher-good" },
  kHR: { min: 25, max: 90, direction: "higher-good" },

  ISO: { min: 0.05, max: 0.35, direction: "higher-good" },
  xwOBA: { min: 0.25, max: 0.48, direction: "higher-good" },
  xwOBAcon: { min: 0.32, max: 0.62, direction: "higher-good" },
  "Brl/BIP%": { min: 2, max: 18, direction: "higher-good" },
  "PulledBrl%": { min: 1, max: 16, direction: "higher-good" },
  "Sweet Spot%": { min: 20, max: 45, direction: "higher-good" },
  "FB%": { min: 20, max: 55, direction: "higher-good" },
  "HH%": { min: 25, max: 60, direction: "higher-good" },
  LA: { min: 0, max: 40, direction: "range-good", goodRange: [12, 28] },
  "SwStr%": { min: 4, max: 22, direction: "lower-good" },

  "Arsenal Score": { min: 35, max: 90, direction: "higher-good" },
  "Fastball Matchup": { min: 35, max: 90, direction: "higher-good" },
  "Breaking Ball Matchup": { min: 35, max: 90, direction: "higher-good" },
  "Offspeed Matchup": { min: 35, max: 90, direction: "higher-good" },
  "xHR Matchup": { min: 0, max: 8, direction: "higher-good" },

  Weather: { min: 35, max: 80, direction: "higher-good" },
  Park: { min: 35, max: 80, direction: "higher-good" },
  Bullpen: { min: 30, max: 85, direction: "higher-good" },
  Team: { min: 30, max: 85, direction: "higher-good" },
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function scoreToPercent(value: number, rule: StatRule) {
  if (rule.direction === "range-good" && rule.goodRange) {
    const [low, high] = rule.goodRange;
    if (value >= low && value <= high) return 1;

    const distance =
      value < low
        ? Math.abs(value - low) / Math.max(1, low - rule.min)
        : Math.abs(value - high) / Math.max(1, rule.max - high);

    return clamp(1 - distance);
  }

  const raw = (value - rule.min) / (rule.max - rule.min);
  return rule.direction === "lower-good" ? clamp(1 - raw) : clamp(raw);
}

export function getHeatStyle(value: unknown, statKey: StatKey) {
  const numeric = Number(value);

  if (value === "" || value === null || value === undefined || Number.isNaN(numeric)) {
    return {
      background: "rgba(148, 163, 184, 0.10)",
      borderColor: "rgba(148, 163, 184, 0.18)",
      color: "#cbd5e1",
    };
  }

  const rule = rules[statKey] ?? { min: 0, max: 100, direction: "higher-good" as const };
  const pct = scoreToPercent(numeric, rule);

  if (pct >= 0.86) {
    return {
      background: "linear-gradient(135deg, rgba(15, 118, 66, 0.95), rgba(34, 197, 94, 0.78))",
      borderColor: "rgba(74, 222, 128, 0.65)",
      color: "#ecfdf5",
    };
  }

  if (pct >= 0.70) {
    return {
      background: "linear-gradient(135deg, rgba(22, 101, 52, 0.82), rgba(132, 204, 22, 0.56))",
      borderColor: "rgba(163, 230, 53, 0.55)",
      color: "#f7fee7",
    };
  }

  if (pct >= 0.52) {
    return {
      background: "linear-gradient(135deg, rgba(113, 63, 18, 0.78), rgba(234, 179, 8, 0.54))",
      borderColor: "rgba(250, 204, 21, 0.52)",
      color: "#fff7cc",
    };
  }

  if (pct >= 0.34) {
    return {
      background: "linear-gradient(135deg, rgba(124, 45, 18, 0.82), rgba(249, 115, 22, 0.58))",
      borderColor: "rgba(251, 146, 60, 0.55)",
      color: "#fff7ed",
    };
  }

  return {
    background: "linear-gradient(135deg, rgba(127, 29, 29, 0.88), rgba(244, 63, 94, 0.58))",
    borderColor: "rgba(251, 113, 133, 0.62)",
    color: "#fff1f2",
  };
}