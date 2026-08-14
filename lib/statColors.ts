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
  | "Strikeout Score"
  | "HR Vulnerability"
  | "Barrel Profile"
  | "Fly Ball Profile"
  | "Pitcher xwOBA"
  | "Pitcher FB%"
  | "CSW%"
  | "Pitcher SwStr%"
  | "Ball%"
  | "Pitcher Brl/BIP%"
  | "Pitcher HH%"
  | "HR/9";

export type Direction =
  | "higher-good"
  | "lower-good"
  | "range-good";

type StatRule = {
  min: number;
  max: number;
  direction: Direction;
  goodRange?: [number, number];
};

const rules: Partial<Record<StatKey, StatRule>> = {
  Likely: {
    min: 25,
    max: 75,
    direction: "higher-good",
  },

  "Test Score": {
    min: 30,
    max: 70,
    direction: "higher-good",
  },

  Matchup: {
    min: 35,
    max: 55,
    direction: "higher-good",
  },

  Ceiling: {
    min: 25,
    max: 70,
    direction: "higher-good",
  },

  "Zone Fit": {
    min: 25,
    max: 65,
    direction: "higher-good",
  },

  "HR Form": {
    min: 20,
    max: 90,
    direction: "higher-good",
  },

  kHR: {
    min: 25,
    max: 60,
    direction: "higher-good",
  },

  ISO: {
    min: 0.05,
    max: 0.19,
    direction: "higher-good",
  },

  xwOBA: {
    min: 0.15,
    max: 0.43,
    direction: "higher-good",
  },

  xwOBAcon: {
    min: 0.15,
    max: 0.43,
    direction: "higher-good",
  },

  "PulledBrl%": {
    min: 1,
    max: 9,
    direction: "higher-good",
  },

  "Brl/BIP%": {
    min: 2,
    max: 14,
    direction: "higher-good",
  },

  "Sweet Spot%": {
    min: 26,
    max: 38,
    direction: "higher-good",
  },

  "FB%": {
    min: 14,
    max: 34,
    direction: "higher-good",
  },

  "HH%": {
    min: 15,
    max: 60,
    direction: "higher-good",
  },

  "SwStr%": {
    min: 1,
    max: 25,
    direction: "lower-good",
  },

  LA: {
    min: 0,
    max: 30,
    direction: "higher-good",
  },

  "Arsenal Score": {
    min: 20,
    max: 90,
    direction: "higher-good",
  },

  "Fastball Matchup": {
    min: 20,
    max: 90,
    direction: "higher-good",
  },

  "Breaking Ball Matchup": {
    min: 20,
    max: 90,
    direction: "higher-good",
  },

  "Offspeed Matchup": {
    min: 20,
    max: 90,
    direction: "higher-good",
  },

  "xHR Matchup": {
    min: 0,
    max: 8,
    direction: "higher-good",
  },

  Weather: {
    min: 35,
    max: 80,
    direction: "higher-good",
  },

  Park: {
    min: 35,
    max: 80,
    direction: "higher-good",
  },

  Bullpen: {
    min: 25,
    max: 85,
    direction: "higher-good",
  },

  Team: {
    min: 25,
    max: 85,
    direction: "higher-good",
  },

  "Pitch Score": {
    min: 20,
    max: 50,
    direction: "higher-good",
  },

  "Strikeout Score": {
    min: 20,
    max: 90,
    direction: "higher-good",
  },

  "HR Vulnerability": {
    min: 20,
    max: 45,
    direction: "lower-good",
  },

  "Fly Ball Profile": {
    min: 20,
    max: 70,
    direction: "lower-good",
  },

  "Barrel Profile": {
    min: 20,
    max: 90,
    direction: "lower-good",
  },

  "Pitcher xwOBA": {
    min: 0.24,
    max: 0.39,
    direction: "lower-good",
  },

  "Pitcher FB%": {
    min: 15,
    max: 45,
    direction: "lower-good",
  },

  "CSW%": {
    min: 22,
    max: 34,
    direction: "higher-good",
  },

  "Pitcher SwStr%": {
    min: 7,
    max: 16,
    direction: "higher-good",
  },

  "Ball%": {
    min: 28,
    max: 40,
    direction: "lower-good",
  },

  "Pitcher Brl/BIP%": {
    min: 2,
    max: 14,
    direction: "lower-good",
  },

  "Pitcher HH%": {
    min: 25,
    max: 50,
    direction: "lower-good",
  },

  "HR/9": {
    min: 0.3,
    max: 2,
    direction: "lower-good",
  },
};

function clamp(
  value: number,
  min = 0,
  max = 1,
) {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function scoreToPercent(
  value: number,
  rule: StatRule,
) {
  if (
    rule.direction === "range-good" &&
    rule.goodRange
  ) {
    const [low, high] = rule.goodRange;

    if (
      value >= low &&
      value <= high
    ) {
      return 1;
    }

    const distance =
      value < low
        ? Math.abs(value - low) /
          Math.max(1, low - rule.min)
        : Math.abs(value - high) /
          Math.max(1, rule.max - high);

    return clamp(1 - distance);
  }

  const raw =
    (value - rule.min) /
    (rule.max - rule.min);

  return rule.direction === "lower-good"
    ? clamp(1 - raw)
    : clamp(raw);
}

/*
 * Original Alpha Wagerz heat palette.
 *
 * This is used by BOTH:
 * - normal/global heat colors
 * - per-team relative heat colors
 *
 * That keeps the visual appearance identical.
 */
function colorForPercent(pct: number) {
  if (pct >= 0.9) {
    return ["#047857", "#22c55e"];
  }

  if (pct >= 0.78) {
    return ["#15803d", "#84cc16"];
  }

  if (pct >= 0.64) {
    return ["#4d7c0f", "#a3e635"];
  }

  if (pct >= 0.5) {
    return ["#854d0e", "#eab308"];
  }

  if (pct >= 0.36) {
    return ["#9a3412", "#f97316"];
  }

  if (pct >= 0.2) {
    return ["#991b1b", "#ef4444"];
  }

  return ["#7f1d1d", "#be123c"];
}

/*
 * Original/global heat coloring.
 */
export function getHeatStyle(
  value: unknown,
  statKey: StatKey,
) {
  const numeric = Number(value);

  if (
    value === "" ||
    value === null ||
    value === undefined ||
    Number.isNaN(numeric)
  ) {
    return {
      background:
        "rgba(148, 163, 184, 0.12)",
      borderColor:
        "rgba(148, 163, 184, 0.20)",
      color: "#cbd5e1",
    };
  }

  const rule =
    rules[statKey] ?? {
      min: 0,
      max: 100,
      direction:
        "higher-good" as const,
    };

  const pct =
    scoreToPercent(
      numeric,
      rule,
    );

  const [from, to] =
    colorForPercent(pct);

  return {
    background:
      `linear-gradient(135deg, ${from}, ${to})`,
    borderColor:
      "rgba(255,255,255,0.18)",
    color: "#ffffff",
  };
}

/*
 * Range calculated from the players
 * on ONE TEAM.
 */
export type RelativeHeatRange = {
  min: number;
  max: number;
};

/*
 * Allows StatCell to determine whether
 * high or low values are better.
 */
export function getStatDirection(
  statKey: StatKey,
): Direction {
  return (
    rules[statKey]?.direction ??
    "higher-good"
  );
}

/*
 * Per-team relative heat coloring.
 *
 * IMPORTANT:
 * This changes ONLY how the percentile
 * is calculated.
 *
 * It uses the SAME colorForPercent()
 * palette as the original heat system.
 */
export function getRelativeHeatStyle(
  value: unknown,
  minValue: number,
  maxValue: number,
  lowerIsBetter = false,
) {
  const numeric = Number(value);

  if (
    value === "" ||
    value === null ||
    value === undefined ||
    Number.isNaN(numeric)
  ) {
    return {
      background:
        "rgba(148, 163, 184, 0.12)",
      borderColor:
        "rgba(148, 163, 184, 0.20)",
      color: "#cbd5e1",
    };
  }

  if (
    !Number.isFinite(minValue) ||
    !Number.isFinite(maxValue)
  ) {
    return getHeatStyle(
      value,
      "Likely",
    );
  }

  /*
   * Start in the middle if every player
   * on the team has the same value.
   */
  let pct = 0.5;

  if (maxValue !== minValue) {
    pct =
      (numeric - minValue) /
      (maxValue - minValue);
  }

  pct = clamp(pct);

  /*
   * Example:
   *
   * SwStr%
   * 1.36 = team best
   * 9.00 = team worst
   *
   * Lower is therefore greener.
   */
  if (lowerIsBetter) {
    pct = 1 - pct;
  }

  /*
   * THIS is the important part:
   * use the exact original palette.
   */
  const [from, to] =
    colorForPercent(pct);

  return {
    background:
      `linear-gradient(135deg, ${from}, ${to})`,
    borderColor:
      "rgba(255,255,255,0.18)",
    color: "#ffffff",
  };
}