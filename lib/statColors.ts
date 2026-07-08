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
  | "Team"
  | "Pitch Score"
|   "Strikeout Score"
|   "HR Vulnerability"
|   "Barrel Profile"
|   "Fly Ball Profile";

type Direction = "higher-good" | "lower-good" | "range-good";

type StatRule = {
  min: number;
  max: number;
  direction: Direction;
  goodRange?: [number, number];
};

const rules: Partial<Record<StatKey, StatRule>> = {
  Likely: { min: 25, max: 80, direction: "higher-good" },
  "Test Score": { min: 25, max: 80, direction: "higher-good" },
  Matchup: { min: 25, max: 80, direction: "higher-good" },
  Ceiling: { min: 25, max: 85, direction: "higher-good" },
  "Zone Fit": { min: 25, max: 80, direction: "higher-good" },
  "HR Form": { min: 25, max: 85, direction: "higher-good" },
  kHR: { min: 25, max: 80, direction: "higher-good" },

  ISO: { min: 0.080, max: 0.260, direction: "higher-good" },
  xwOBA: { min: 0.270, max: 0.400, direction: "higher-good" },
  xwOBAcon: { min: 0.280, max: 0.430, direction: "higher-good" },

  "PulledBrl%": { min: 1.0, max: 9.0, direction: "higher-good" },
  "Brl/BIP%": { min: 2.0, max: 14.0, direction: "higher-good" },
  "Sweet Spot%": { min: 26, max: 38, direction: "higher-good" },

  // 30% should be yellow/green, not red
  "FB%": { min: 14, max: 34, direction: "higher-good" },

  // 50%+ should be strong green
  "HH%": { min: 28, max: 55, direction: "higher-good" },

  // Lower is better for hitter whiff rate
  "SwStr%": { min: 4, max: 16, direction: "lower-good" },

  // Best launch-angle band is roughly 12–22
  LA: { min: 0, max: 55, direction: "higher-good"},

  "Arsenal Score": { min: 20, max: 90, direction: "higher-good" },
  "Fastball Matchup": { min: 20, max: 90, direction: "higher-good" },
  "Breaking Ball Matchup": { min: 20, max: 90, direction: "higher-good" },
  "Offspeed Matchup": { min: 20, max: 90, direction: "higher-good" },
  "xHR Matchup": { min: 0, max: 8, direction: "higher-good" },

  Weather: { min: 35, max: 80, direction: "higher-good" },
  Park: { min: 35, max: 80, direction: "higher-good" },
  Bullpen: { min: 25, max: 85, direction: "higher-good" },
  Team: { min: 25, max: 85, direction: "higher-good" },

  "Pitch Score": { min: 20, max: 90, direction: "higher-good" },
  "Strikeout Score": { min: 20, max: 90, direction: "higher-good" },
  "HR Vulnerability": { min: 20, max: 90, direction: "lower-good" },
  "Barrel Profile": { min: 0, max: 35, direction: "lower-good" },
  "Fly Ball Profile": { min: 25, max: 80, direction: "lower-good" },
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

function colorForPercent(pct: number) {
  if (pct >= 0.9) return ["#047857", "#22c55e"];
  if (pct >= 0.78) return ["#15803d", "#84cc16"];
  if (pct >= 0.64) return ["#4d7c0f", "#a3e635"];
  if (pct >= 0.5) return ["#854d0e", "#eab308"];
  if (pct >= 0.36) return ["#9a3412", "#f97316"];
  if (pct >= 0.2) return ["#991b1b", "#ef4444"];
  return ["#7f1d1d", "#be123c"];
}

export function getHeatStyle(value: unknown, statKey: StatKey) {
  const numeric = Number(value);

  if (value === "" || value === null || value === undefined || Number.isNaN(numeric)) {
    return {
      background: "rgba(148, 163, 184, 0.12)",
      borderColor: "rgba(148, 163, 184, 0.20)",
      color: "#cbd5e1",
    };
  }

  const rule = rules[statKey] ?? { min: 0, max: 100, direction: "higher-good" as const };
  const pct = scoreToPercent(numeric, rule);
  const [from, to] = colorForPercent(pct);

  return {
    background: `linear-gradient(135deg, ${from}, ${to})`,
    borderColor: "rgba(255,255,255,0.18)",
    color: "#ffffff",
  };
}