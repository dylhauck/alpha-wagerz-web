"use client";

type Candidate = { label: string; probability: number | null | undefined; sampleSize?: number | null };
type Props = { candidates: Candidate[]; minimumSample?: number; note?: string };

function normalized(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const probability = value > 1 ? value / 100 : value;
  return probability >= 0 && probability <= 1 ? probability : null;
}

/** Select by modeled outcome probability, never by payout or market edge. */
export function MostConfidentBet({ candidates, minimumSample = 0, note }: Props) {
  const ranked = candidates
    .map(candidate => ({ ...candidate, p: normalized(candidate.probability) }))
    .filter((candidate): candidate is typeof candidate & { p: number } =>
      candidate.p !== null &&
      Boolean(candidate.label?.trim()) &&
      (candidate.sampleSize == null || candidate.sampleSize >= minimumSample)
    )
    .sort((a, b) => b.p - a.p);
  const best = ranked[0];
  return (
    <span
      className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-pink-300/30 bg-pink-300/10 px-3 py-1 text-center text-[11px] font-black uppercase tracking-wide text-pink-200"
      title={note || "Highest available modeled outcome probability. Not based on sportsbook payout or value. Model estimates are not guaranteed or necessarily calibrated."}
    >
      Most Confident Bet: {best ? `${best.label} — ${(best.p * 100).toFixed(1)}%` : "Insufficient Data"}
    </span>
  );
}

/** Approximate normal-model outcome probability; requires a real modeled standard deviation. */
export function normalOutcomeProbability(mean: number | null | undefined, threshold: number | null | undefined, sd: number | null | undefined): number | null {
  if (mean == null || threshold == null || sd == null || ![mean, threshold, sd].every(Number.isFinite) || sd <= 0) return null;
  const x = (mean - threshold) / (sd * Math.SQRT2);
  // Abramowitz-Stegun approximation of erf.
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z));
  return Math.max(0, Math.min(1, (1 + erf) / 2));
}
