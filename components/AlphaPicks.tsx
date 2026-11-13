"use client";

import { useEffect, useMemo, useState } from "react";

type Sport = "mlb" | "nfl" | "nba" | "nhl" | "wnba" | "mls" | "ufc";
type MarketType = "moneyline" | "spread" | "total" | "player_prop";
type PickTab = "moneyline" | "spread" | "total" | "player_prop" | "combos" | "first_basket" | "anytime_goal" | "first_goal" | "home_run" | "anytime_td" | "first_td";
type MainTab = "parlay" | "straight" | "lotto";
type Leg = { id: string; game: string; pick: string; odds: number; probability: number; source: string; marketType: MarketType };
type Ticket = { legs: Leg[]; odds: number; probability: number };
const num = (x: unknown): number | null => typeof x === "number" && Number.isFinite(x) ? x : null;
const normalizeProbability = (x: unknown): number | null => {
  const n = num(x);
  if (n === null) return null;
  const p = n > 1 ? n / 100 : n;
  return p > 0 && p < 1 ? p : null;
};
const americanToDecimal = (odds: number) => odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
const decimalToAmerican = (decimal: number) => decimal >= 2 ? Math.round((decimal - 1) * 100) : -Math.round(100 / (decimal - 1));
const fmtOdds = (n: number) => n > 0 ? "+" + Math.round(n).toLocaleString("en-US") : String(Math.round(n));
const percent = (n: number) => (n * 100).toFixed(1) + "%";
const probabilityFromOdds = (odds: number) => 1 / americanToDecimal(odds);
// Normal CDF approximation, used only when the model provides a positive SD.
const normalCdf = (x: number) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const c = 1 - d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? c : 1 - c;
};
const modeledCover = (mean: unknown, line: unknown, sd: unknown): number | null => {
  const m = num(mean), l = num(line), sigma = num(sd);
  return m === null || l === null || sigma === null || sigma <= 0 ? null : normalCdf((m + l) / sigma);
};
const modeledOver = (mean: unknown, line: unknown, sd: unknown): number | null => {
  const m = num(mean), l = num(line), sigma = num(sd);
  return m === null || l === null || sigma === null || sigma <= 0 ? null : normalCdf((m - l) / sigma);
};

// Exact independent-Poisson baseline for NHL full-game totals and puck lines.
// Baseline is explicitly uncalibrated and does not account for goalie/injury changes.
const poissonMass = (mean: number, max = 25): number[] => {
  const out = [Math.exp(-mean)];
  for (let i = 1; i <= max; i++) out.push(out[i - 1] * mean / i);
  return out;
};
const nhlProbabilities = (awayMean: number, homeMean: number, line: number, kind: "total" | "home_spread" | "away_spread") => {
  if (awayMean < 0 || homeMean < 0 || awayMean > 12 || homeMean > 12) return null;
  const a = poissonMass(awayMean), h = poissonMass(homeMean);
  let result = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < h.length; j++) {
    const wins = kind === "total" ? i + j > line : kind === "home_spread" ? j - i + line > 0 : i - j + line > 0;
    if (wins) result += a[i] * h[j];
  }
  return Math.min(1, Math.max(0, result));
};

const list = (payload: any): any[] => Array.isArray(payload) ? payload : Array.isArray(payload?.games) ? payload.games : [];
const key = (g: any) => String(g?.game_id ?? "");
const matchup = (g: any) => String(g?.away_team ?? g?.away ?? "?") + " @ " + String(g?.home_team ?? g?.home ?? "?");
const same = (a: any, b: any) => (Boolean(key(a)) && key(a) === key(b)) || matchup(a) === matchup(b);
const ticket = (legs: Leg[]): Ticket => {
  const decimal = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
  return { legs, odds: decimalToAmerican(decimal), probability: legs.reduce((acc, leg) => acc * leg.probability, 1) };
};

type InjuryRow = { player_name?: string; player?: string; name?: string; team?: string; status?: string };
const injuryKey = (value: unknown) => String(value ?? "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]/g, "");
const injuryStatus = (row: InjuryRow) => String(row.status ?? "").toUpperCase().replace(/[^A-Z]/g, "");
const isUnavailable = (status: string) => /^(OUT|IR|INJUREDRESERVE|PUP|NFI|SUSPENDED|DOUBTFUL)$/.test(status);
const isUncertain = (status: string) => /^(QUESTIONABLE|GAMETIMEDECISION|GTD|DAYTODAY)$/.test(status);
function buildCandidates(sport: Sport, projections: any[], markets: any[], propMarkets: any[] = [], injuryRows: InjuryRow[] = [], nflPlayers: any[] = []): Leg[] {
  const out: Leg[] = [];
  const injuries = new Map(injuryRows.filter(row => row.team && (row.player_name || row.player || row.name)).map(row => [injuryKey(row.team) + ":" + injuryKey(row.player_name ?? row.player ?? row.name), injuryStatus(row)]));
  const add = (game: any, pick: string, odds: unknown, probability: unknown, source: string, marketType: MarketType = "moneyline") => {
    const price = num(odds);
    const p = normalizeProbability(probability);
    if (price === null || price === 0 || p === null || price < -100000 || price > 100000) return;
    // Only genuine sportsbook prices and independently modeled probabilities qualify.
    if (out.some(existing => existing.id === key(game) + ":" + pick)) return;
    out.push({ id: key(game) + ":" + pick, game: matchup(game), pick, odds: price, probability: p, source, marketType });
  };
  for (const game of projections) {
    const market = markets.find(m => same(m, game));
    if (!market) continue;
    const away = String(game.away_team ?? game.away ?? market.away_team ?? "");
    const home = String(game.home_team ?? game.home ?? market.home_team ?? "");
    if (!away || !home) continue;
    if (sport === "nba") {
      const model = game.model ?? {};
      const full = market.full_game ?? {};
      const ml = full.moneyline;
      add(game, away + " ML", ml?.away, model.away_win_probability, "NBA model + live sportsbook");
      add(game, home + " ML", ml?.home, model.home_win_probability, "NBA model + live sportsbook");
      const spread = full.spread ?? {};
      const homeMargin = num(model.home_margin) ?? (num(model.home_score) !== null && num(model.away_score) !== null ? model.home_score - model.away_score : null);
      add(game, home + " " + spread.home_line + " spread", spread.home_odds, modeledCover(homeMargin, spread.home_line, model.margin_sd), "NBA model margin distribution", "spread");
      add(game, away + " " + spread.away_line + " spread", spread.away_odds, modeledCover(homeMargin === null ? null : -homeMargin, spread.away_line, model.margin_sd), "NBA model margin distribution", "spread");
      const total = full.total ?? {};
      const over = modeledOver(model.projected_total, total.line, model.total_sd);
      add(game, "Over " + total.line, total.over_odds, over, "NBA model total distribution", "total");
      add(game, "Under " + total.line, total.under_odds, over === null ? null : 1 - over, "NBA model total distribution", "total");
      // NBA game projections provide means but no standard deviations.
      // Use an explicit approximate game-level variance, never sportsbook-implied odds.
      if (num(model.margin_sd) === null && homeMargin !== null) {
        const estimatedMarginSd = 12;
        add(game, home + " " + spread.home_line + " spread", spread.home_odds, modeledCover(homeMargin, spread.home_line, estimatedMarginSd), "NBA projection + approximate 12-point margin SD", "spread");
        add(game, away + " " + spread.away_line + " spread", spread.away_odds, modeledCover(-homeMargin, spread.away_line, estimatedMarginSd), "NBA projection + approximate 12-point margin SD", "spread");
      }
      if (num(model.total_sd) === null && num(model.projected_total) !== null) {
        const approximateOver = modeledOver(model.projected_total, total.line, 17);
        add(game, "Over " + total.line, total.over_odds, approximateOver, "NBA projection + approximate 17-point total SD", "total");
        add(game, "Under " + total.line, total.under_odds, approximateOver === null ? null : 1 - approximateOver, "NBA projection + approximate 17-point total SD", "total");
      }
    } else if (sport === "nhl") {
      const p = game.probabilities ?? {};
      const full = market.full_game ?? {};
      const ml = full.moneyline;
      add(game, away + " ML", ml?.away, p.away_win_probability, "NHL uncalibrated baseline + live sportsbook");
      add(game, home + " ML", ml?.home, p.home_win_probability, "NHL uncalibrated baseline + live sportsbook");
      const spread = full.spread ?? {};
      const awayMean = num(game.away_goals), homeMean = num(game.home_goals);
      if (awayMean !== null && homeMean !== null) {
        const total = full.total ?? {};
        const line = num(total.line);
        if (line !== null && line % 1 !== 0) {
          const over = nhlProbabilities(awayMean, homeMean, line, "total");
          add(game, "Over " + line, total.over_odds, over, "NHL independent-Poisson baseline (uncalibrated)", "total");
          add(game, "Under " + line, total.under_odds, over === null ? null : 1 - over, "NHL independent-Poisson baseline (uncalibrated)", "total");
        }
        for (const side of ["away", "home"] as const) {
          const spreadLine = num(spread[side + "_line"]);
          if (spreadLine === null || spreadLine % 1 === 0) continue;
          const probability = nhlProbabilities(awayMean, homeMean, spreadLine, side === "home" ? "home_spread" : "away_spread");
          add(game, (side === "home" ? home : away) + " " + spreadLine + " puck line", spread[side + "_odds"], probability, "NHL independent-Poisson baseline (uncalibrated)", "spread");
        }
      }
    } else if (sport === "nfl") {
      const ml = market.moneyline ?? {};
      const p = game.win_probability ?? {};
      add(game, away + " ML", ml.away, p.away ?? game.away_win_probability, "NFL model + sportsbook");
      add(game, home + " ML", ml.home, p.home ?? game.home_win_probability, "NFL model + sportsbook");
      const spread = market.spread ?? {};
      const homeMargin = num(game.expected_margin) ?? num(game.projected_margin) ??
        (num(game.projected_score?.home) !== null && num(game.projected_score?.away) !== null ? game.projected_score.home - game.projected_score.away : null);
      add(game, home + " " + spread.home + " spread", spread.home_price, modeledCover(homeMargin, spread.home, game.margin_sd), "NFL model margin distribution", "spread");
      add(game, away + " " + spread.away + " spread", spread.away_price, modeledCover(homeMargin === null ? null : -homeMargin, spread.away, game.margin_sd), "NFL model margin distribution", "spread");
      const total = num(market.game_total);
      const over = modeledOver(game.projected_total, total, game.total_sd);
      add(game, "Over " + total, market.game_total_prices?.over, over, "NFL model total distribution", "total");
      add(game, "Under " + total, market.game_total_prices?.under, over === null ? null : 1 - over, "NFL model total distribution", "total");
      // NFL outputs contain projected margins/totals but no distribution SD.
      if (num(game.margin_sd) === null && homeMargin !== null) {
        add(game, home + " " + spread.home + " spread", spread.home_price, modeledCover(homeMargin, spread.home, 13.5), "NFL projection + approximate 13.5-point margin SD", "spread");
        add(game, away + " " + spread.away + " spread", spread.away_price, modeledCover(-homeMargin, spread.away, 13.5), "NFL projection + approximate 13.5-point margin SD", "spread");
      }
      if (num(game.total_sd) === null) {
        const approximateOver = modeledOver(game.projected_total, total, 14);
        add(game, "Over " + total, market.game_total_prices?.over, approximateOver, "NFL projection + approximate 14-point total SD", "total");
        add(game, "Under " + total, market.game_total_prices?.under, approximateOver === null ? null : 1 - approximateOver, "NFL projection + approximate 14-point total SD", "total");
      }
    }
  }
  // Player props require both a real sportsbook price and a model distribution
  // (explicit over/under probability or modeled mean plus modeled SD).
  if (sport === "nba") {
    // Provider sometimes supplies an alternate 0.5 made-three line with a
    // one-sided or mismatched price even when a normal 2.5+ line exists.
    // Require a two-sided quote, and never prefer that suspect alternate.
    for (const prop of propMarkets) {
      const quotedOver = num(prop.over_odds);
      const quotedUnder = num(prop.under_odds);
      if (quotedOver === null || quotedUnder === null ||
          Math.abs(quotedOver) < 100 || Math.abs(quotedUnder) < 100) continue;
      // Quarantine ambiguous 0.5 3PM prices regardless of whether a
      // second market for that player happens to be present in this slate.
      if (String(prop.prop_type) === "fg3m" && num(prop.line) === 0.5) continue;
      const game = projections.find(g => key(g) === String(prop.game_id));
      if (!game) continue;
      const players = [...(game.player_projections?.away ?? []), ...(game.player_projections?.home ?? [])];
      const player = players.find((p: any) => String(p.player_name).toLowerCase() === String(prop.player_name).toLowerCase());
      if (!player) continue;
      const status = injuries.get(injuryKey(player.team) + ":" + injuryKey(player.player_name));
      // Exclude injured or uncertain players rather than making up minutes or
      // an unvalidated numerical injury adjustment.
      if (status && (isUnavailable(status) || isUncertain(status))) continue;
      const metric = String(prop.prop_type ?? "");
      const projection = player.projection ?? {};
      const line = num(prop.line);
      const mean = num(projection[metric]);
      // Do not treat a zero-minute or inactive player's baseline as a
      // confident under. A valid active-minute projection is required.
      const projectedMinutes = num(projection.min);
      if (projectedMinutes === null || projectedMinutes < 12 || mean === null || mean <= 0) continue;
      const sd = num(projection[metric + "_sd"]) ?? num(player.distribution?.[metric]?.sd) ?? (mean !== null && mean > 0 && ["pts", "reb", "ast", "fg3m", "pra", "pr", "pa", "ra", "stl", "blk"].includes(metric) ? Math.max(metric === "fg3m" ? 1.1 : 1.5, Math.sqrt(mean) * (metric === "pts" || metric === "pra" ? 1.65 : 1.3)) : null);
      const explicitOver = normalizeProbability(player.probabilities?.[metric]?.over);
      const over = explicitOver ?? modeledOver(mean, line, sd);
      if (line === null || over === null) continue;
      // Near-certainty from an approximate variance is a warning sign,
      // not evidence of a 99–100% hit rate. Suppress these estimates.
      if (over < 0.05 || over > 0.95) continue;
      add(game, prop.player_name + " Over " + line + " " + metric.toUpperCase(), prop.over_odds, over, "NBA projection + approximate player variance + sportsbook", "player_prop");
      add(game, prop.player_name + " Under " + line + " " + metric.toUpperCase(), prop.under_odds, 1 - over, "NBA player model distribution + sportsbook", "player_prop");
    }
  }
  if (sport === "nfl") {
    // NFL player-prop projections live in a separate file, not inside game projections.
    // Match verified sportsbook prices to independent player means; never infer odds.
    const statPaths: Record<string, string[]> = {
      passing_yards: ["passing", "yards"], passing_touchdowns: ["passing", "touchdowns"],
      passing_attempts: ["passing", "attempts"], passing_completions: ["passing", "completions"],
      interceptions: ["passing", "interceptions"], rushing_yards: ["rushing", "yards"],
      rushing_attempts: ["rushing", "carries"], receiving_yards: ["receiving", "yards"],
      receptions: ["receiving", "receptions"], longest_reception: ["receiving", "longest"],
    };
    const projectionRows = nflPlayers;
    for (const prop of propMarkets) {
      const metric = String(prop.prop_type ?? "");
      const path = statPaths[metric];
      if (!path) continue;
      const game = projections.find(g => key(g) === String(prop.game_id));
      if (!game) continue;
      const player = projectionRows.find((p: any) =>
        key(p) === key(game) &&
        injuryKey(p.player_name ?? p.player ?? p.name) === injuryKey(prop.player_name));
      if (!player) continue;
      const status = injuries.get(injuryKey(player.team) + ":" + injuryKey(prop.player_name));
      if (status && (isUnavailable(status) || isUncertain(status))) continue;
      const mean = num(player.projection?.[path[0]]?.[path[1]]);
      const line = num(prop.line);
      if (mean === null || mean <= 0 || line === null) continue;
      // Approximate dispersion is explicitly labeled, not sportsbook-derived.
      const sd = num(player.distribution?.[metric]?.sd) ??
        Math.max(metric.includes("yards") ? 7 : 1.25, Math.sqrt(mean) * 1.7);
      const over = modeledOver(mean, line, sd);
      if (over === null || over <= 0.05 || over >= 0.95) continue;
      if (num(prop.over_odds) !== null && num(prop.under_odds) !== null) {
        add(game, prop.player_name + " Over " + line + " " + metric.replace(/_/g, " ").toUpperCase(),
          prop.over_odds, over, "NFL player projection + approximate variance + sportsbook", "player_prop");
        add(game, prop.player_name + " Under " + line + " " + metric.replace(/_/g, " ").toUpperCase(),
          prop.under_odds, 1 - over, "NFL player projection + approximate variance + sportsbook", "player_prop");
      }
    }
  }
  // A ticket cannot include both opposing outcomes from the same game.
  return out.sort((a, b) => b.probability - a.probability);
}

function makeParlays(legs: Leg[], minOdds: number, mixed = false, minLegs = 3, maxLegs = 20): Ticket[] {
  const MIN_LEGS = minLegs;
  const MAX_LEGS = maxLegs;
  // Keep one outcome per matchup, and consider as many as 20 distinct games.
  // Beam search avoids the exponential cost of enumerating all combinations.
  // Rank all independently modeled selections by their relative confidence.
  // A fixed 60% leg threshold incorrectly removes the strongest available
  // selections on balanced slates. Keep the sportsbook + model validation
  // performed by buildCandidates; do not invent legs to meet ticket targets.
  const qualifyingLegs = legs;
  const byGame = new Map<string, Leg[]>();
  for (const leg of qualifyingLegs) {
    const group = byGame.get(leg.game) || [];
    group.push(leg);
    byGame.set(leg.game, group);
  }
  const games = [...byGame.values()]
    .map(group => {
      const ranked = [...group].sort((a, b) => b.probability - a.probability);
      if (!mixed) return ranked.slice(0, 2);
      // Preserve representatives of every available market type. The
      // previous top-two-only selection could discard all but player props,
      // making a mixed-market parlay mathematically impossible.
      const byType = new Map<MarketType, Leg[]>();
      for (const leg of ranked) {
        const options = byType.get(leg.marketType) ?? [];
        if (options.length < 2) options.push(leg);
        byType.set(leg.marketType, options);
      }
      return [...byType.values()].flat();
    })
    .sort((a, b) => b[0].probability - a[0].probability)
    .slice(0, MAX_LEGS);
  if (games.length < MIN_LEGS) return [];

  type State = { legs: Leg[]; decimal: number; probability: number };
  const beams: State[][] = Array.from({ length: MAX_LEGS + 1 }, () => []);
  beams[0] = [{ legs: [], decimal: 1, probability: 1 }];
  const results: Ticket[] = [];
  const seen = new Set<string>();
  const BEAM_WIDTH = mixed ? 700 : 300;

  for (const group of games) {
    for (let count = MAX_LEGS - 1; count >= 0; count--) {
      if (!beams[count].length) continue;
      const expanded: State[] = [];
      for (const state of beams[count]) {
        for (const leg of group) {
          const next: State = {
            legs: [...state.legs, leg],
            decimal: state.decimal * americanToDecimal(leg.odds),
            probability: state.probability * leg.probability,
          };
          expanded.push(next);
          if (next.legs.length >= MIN_LEGS && next.legs.length <= MAX_LEGS) {
            const odds = decimalToAmerican(next.decimal);
            if (odds >= minOdds && (!mixed || new Set(next.legs.map(l => l.marketType)).size >= 2)) {
              const signature = next.legs.map(x => x.id).sort().join("|");
              if (!seen.has(signature)) {
                seen.add(signature);
                results.push({ legs: next.legs, odds, probability: next.probability });
              }
            }
          }
        }
      }
      const candidates = [...beams[count + 1], ...expanded];
      if (mixed) {
        // Retain diverse market-type combinations in the beam, rather
        // than pruning every mixed state behind high-probability props.
        const buckets = new Map<string, State[]>();
        for (const state of candidates) {
          const signature = [...new Set(state.legs.map(l => l.marketType))].sort().join("|");
          const bucket = buckets.get(signature) ?? [];
          bucket.push(state);
          buckets.set(signature, bucket);
        }
        const perBucket = Math.max(8, Math.floor(BEAM_WIDTH / Math.max(1, buckets.size)));
        beams[count + 1] = [...buckets.values()]
          .flatMap(bucket => bucket.sort((a, b) => b.probability - a.probability).slice(0, perBucket))
          .sort((a, b) => b.probability - a.probability)
          .slice(0, BEAM_WIDTH);
      } else {
        // Confidence-only pruning keeps short-priced favorites and can
        // eliminate every path to the lotto odds threshold. Retain both
        // confident and higher-priced valid combinations at each leg count.
        const byConfidence = [...candidates].sort((a, b) => b.probability - a.probability);
        const byPrice = [...candidates].sort((a, b) => b.decimal - a.decimal || b.probability - a.probability);
        const byBalance = [...candidates].sort((a, b) =>
          b.probability * Math.sqrt(b.decimal) - a.probability * Math.sqrt(a.decimal));
        const retained = new Map<string, State>();
        for (const ranking of [byConfidence, byPrice, byBalance]) {
          for (const state of ranking.slice(0, BEAM_WIDTH)) {
            const signature = state.legs.map(leg => leg.id).sort().join("|");
            if (!retained.has(signature)) retained.set(signature, state);
          }
        }
        beams[count + 1] = [...retained.values()]
          .sort((a, b) => b.probability * Math.sqrt(b.decimal) - a.probability * Math.sqrt(a.decimal))
          .slice(0, BEAM_WIDTH);
      }
    }
  }
  // Rank by confidence, but avoid publishing six near-identical tickets.
  // A different prop for the same player still counts as the same player.
  // No forced leg counts or over/under quotas.
  const ranked = results.sort((a, b) => b.probability - a.probability);
  if (!ranked.length) return [];
  const playerKey = (leg: Leg) => {
    const name = leg.pick.split(/\\s+(?:Over|Under)\\s+/i)[0]
      .replace(/\\s*·\\s*(?:First Basket|First Goal|Anytime Goal).*$/i, "")
      .trim().toLowerCase();
    return leg.marketType === "player_prop" ? name : leg.id.toLowerCase();
  };
  const keys = (t: Ticket) => new Set(t.legs.map(playerKey));
  const similarity = (a: Ticket, b: Ticket) => {
    const ka = keys(a), kb = keys(b);
    const common = [...ka].filter(k => kb.has(k)).length;
    return common / Math.min(ka.size, kb.size);
  };
  const selected: Ticket[] = [];
  const choose = (maxOverlap: number, confidenceFloor: number) => {
    for (const t of ranked) {
      if (selected.length === 6) break;
      if (t.probability < ranked[0].probability * confidenceFloor) continue;
      if (selected.some(existing => similarity(existing, t) > maxOverlap)) continue;
      selected.push(t);
    }
  };
  choose(0.5, 0.8);
  choose(0.67, 0.7);
  // Always fill the six selection slots when six distinct qualifying
  // tickets exist. Diversity is a preference, not a hard cap.
  for (const t of ranked) {
    if (selected.length === 6) break;
    if (!selected.includes(t)) selected.push(t);
  }
  return selected.sort((a, b) => b.probability - a.probability);
}

function PickCard({ ticket: t, index, category }: { ticket: Ticket; index: number; category: "parlay" | "straight" | "lotto" }) {
  const accent = category === "lotto" ? "text-fuchsia-200 border-fuchsia-400/25 bg-fuchsia-400/10" : category === "straight" ? "text-emerald-200 border-emerald-400/25 bg-emerald-400/10" : "text-cyan-200 border-cyan-400/25 bg-cyan-400/10";
  return <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#121d30] via-[#0c1525] to-[#0a1020] shadow-[0_12px_35px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:shadow-[0_18px_45px_rgba(0,0,0,0.3)]">
    <div className="h-[2px] bg-gradient-to-r from-cyan-400/80 via-fuchsia-400/60 to-transparent" />
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Alpha Selection {String(index + 1).padStart(2, "0")}</p>
        <p className="mt-1 text-lg font-black text-white">{t.legs.length === 1 ? "Straight Bet" : t.legs.length + "-Leg " + (category === "lotto" ? "Lotto" : "Parlay")}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Odds</p>
        <span className="mt-1 inline-block rounded-lg border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-lg font-black tabular-nums text-fuchsia-200">{fmtOdds(t.odds)}</span>
      </div>
    </div>
    <div className="flex-1 px-5 py-2">
      {t.legs.map((leg, i) => <div key={leg.id} className={"flex items-start gap-3 py-3 " + (i ? "border-t border-white/[0.07]" : "")}>
        <span className={"mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black " + accent}>{String(i + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{leg.game}</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[15px] font-extrabold leading-snug text-white">{leg.pick}</p>
            <span className="text-sm font-black tabular-nums text-cyan-200">{fmtOdds(leg.odds)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Model estimate <span className="font-bold tabular-nums text-slate-200">{percent(leg.probability)}</span></p>
        </div>
      </div>)}
    </div>
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.025] px-5 py-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.legs.length === 1 ? "Modeled Probability" : "Combined Model Estimate"}</p>
        <p className="mt-1 text-xl font-black tabular-nums text-white">{percent(t.probability)}</p>
      </div>
      <span className={"rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider " + accent}>{category === "lotto" ? "High Risk" : category === "straight" ? "Straight" : "Parlay"}</span>
    </div>
  </article>;
}

export default function AlphaPicks({ sport, next = false }: { sport: Sport; next?: boolean }) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [basketGames, setBasketGames] = useState<any[]>([]);
  const [basketPrices, setBasketPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [mainTab, setMainTab] = useState<MainTab>("parlay");
  const [parlayTab, setParlayTab] = useState<PickTab>("moneyline");
  const [straightTab, setStraightTab] = useState<PickTab>("moneyline");
  const [lottoTab, setLottoTab] = useState<PickTab>("moneyline");
  useEffect(() => {
    let active = true;
    const paths: Record<Sport, [string, string]> = {
      nba: ["/data/nba/betting_projections.json", "/data/nba/live_team_markets.json"],
      nhl: ["/data/nhl/projections.json", "/data/nhl/live_team_markets.json"],
      nfl: ["/data/nfl/game_projections.json", "/data/nfl/market.json"],
      mlb: ["/data/mlb/game_projections.json", "/data/mlb/market_lines.json"],
      wnba: ["/data/wnba/game_projections.json", "/data/wnba/market.json"],
      mls: ["/data/mls/game_projections.json", "/data/mls/market.json"],
      ufc: ["/data/ufc/game_projections.json", "/data/ufc/market.json"],
    };
    setLoading(true);
    Promise.all([...paths[sport], ...(sport === "nba" ? ["/data/nba/player_prop_markets.json", "/data/nba/first_basket.json", "/data/nba/first_basket_markets.json"] : sport === "nfl" ? ["/data/nfl/player_props.json", "/data/nfl/player_projections.json"] : []), "/data/" + sport + "/injuries.json"].map(async path => {
      if (next) path = path.replace(`/data/${sport}/`, `/data/${sport}/next/`);
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) { if (path.includes("player_prop") || path.includes("first_basket") || path.includes("injuries")) return {}; throw new Error("Missing " + path); }
      return res.json();
    })).then((payloads) => {
      const [p, m] = payloads;
      const props = sport === "nba" || sport === "nfl" ? payloads[2] : {};
      const baskets = sport === "nba" ? payloads[3] : {};
      const basketOdds = sport === "nba" ? payloads[4] : {};
      const injuryData = payloads[payloads.length - 1];
      const injuryRows: InjuryRow[] = Array.isArray(injuryData?.injuries) ? injuryData.injuries : [];
      if (!active) return;
      const candidates = buildCandidates(sport, list(p), list(m), Array.isArray(props?.props) ? props.props : [], injuryRows, sport === "nfl" && Array.isArray(payloads[3]?.players) ? payloads[3].players : []);
      setLegs(candidates);
      const injuryLookup = new Map(injuryRows.filter(row => row.team).map(row => [injuryKey(row.team) + ":" + injuryKey(row.player_name ?? row.player ?? row.name), injuryStatus(row)]));
      setBasketGames(Array.isArray(baskets?.games) ? baskets.games.map((game: any) => ({
        ...game, players: (game.players ?? []).filter((player: any) => {
          const status = injuryLookup.get(injuryKey(player.team) + ":" + injuryKey(player.player_name));
          return !status || (!isUnavailable(status) && !isUncertain(status));
        }),
      })) : []);
      setBasketPrices(Array.isArray(basketOdds?.props) ? basketOdds.props : []);
      setStatus(candidates.length ? "" : "No verified sportsbook odds and model-probability pairs are available for this slate.");
    }).catch(() => {
      if (active) { setLegs([]); setBasketGames([]); setBasketPrices([]); setStatus("Current slate projection or sportsbook data is unavailable."); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sport, next]);
  const categoryTab = mainTab === "parlay" ? parlayTab : mainTab === "straight" ? straightTab : lottoTab;
  const eligibleLegs = useMemo(() => categoryTab === "combos" ? legs : legs.filter(leg => leg.marketType === categoryTab), [legs, categoryTab]);
  const straights = useMemo(() => {
    const ranked = eligibleLegs.filter(leg => leg.odds >= -150)
      .sort((a, b) => b.probability - a.probability);
    if (categoryTab !== "combos") return ranked.slice(0, 6).map(leg => ticket([leg]));
    // Combos can draw from every market. Favor variety only when candidates
    // are genuinely close in model confidence; never force a weak ML/spread.
    const selected: Leg[] = [];
    const playerCounts = new Map<string, number>();
    const playerName = (leg: Leg) => leg.pick.split(/\\s+(?:Over|Under)\\s+/i)[0].trim().toLowerCase();
    const choose = (options: Leg[]) => {
      for (const leg of options) {
        if (selected.length >= 6) break;
        if (selected.includes(leg)) continue;
        if (leg.marketType === "player_prop" && (playerCounts.get(playerName(leg)) ?? 0) >= 2) continue;
        selected.push(leg);
        if (leg.marketType === "player_prop") {
          const name = playerName(leg);
          playerCounts.set(name, (playerCounts.get(name) ?? 0) + 1);
        }
      }
    };
    if (categoryTab === "combos") {
      // Combos must represent different market families, not repeat the
      // Player Props leaderboard. Reserve one qualifying selection from
      // each available family, then fill by model confidence.
      const families: MarketType[] = ["moneyline", "spread", "total", "player_prop"];
      for (const family of families) {
        const best = ranked.find(leg => leg.marketType === family);
        if (best) choose([best]);
      }
    }
    choose(ranked);
    return selected.slice(0, 6).map(leg => ticket([leg]));
  }, [eligibleLegs, categoryTab]);
  const parlays = useMemo(() => makeParlays(eligibleLegs, 500, categoryTab === "combos"), [eligibleLegs, categoryTab]);
  const lottos = useMemo(() => makeParlays(eligibleLegs, 7500, categoryTab === "combos"), [eligibleLegs, categoryTab]);
  // First-basket combinations use 2–4 distinct games. The source has
  // modeled probabilities but NO sportsbook first-basket odds.
  // Show projections only, never invent parlay prices or claim eligibility.
  const basketLegs = useMemo(() => {
    const normalizeName = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const results: Leg[] = [];
    for (const game of basketGames) {
      if (game.status === "unavailable" || !Array.isArray(game.players)) continue;
      const matchupName = String(game.away_team) + " @ " + String(game.home_team);
      for (const player of game.players) {
        const probability = normalizeProbability(player.probability);
        if (probability === null) continue;
        const prices = basketPrices.filter(row =>
          String(row.game_id) === String(game.game_id) &&
          normalizeName(row.player_name) === normalizeName(player.player_name) &&
          (!row.market_type || row.market_type === "first_made_field_goal") &&
          num(row.odds) !== null && Math.abs(num(row.odds)!) >= 100
        );
        // Choose the best actual quoted price across supported books.
        const price = prices.sort((a, b) => (num(b.odds) ?? -Infinity) - (num(a.odds) ?? -Infinity))[0];
        const odds = num(price?.odds);
        if (odds === null || odds === 0 || Math.abs(odds) < 100) continue;
        results.push({ id: String(game.game_id) + ":" + String(player.player_id), game: matchupName,
          pick: String(player.player_name) + " · First Basket", odds, probability,
          source: String(price.sportsbook) + " first-basket odds + Alpha Wagerz model", marketType: "player_prop" });
      }
    }
    return results.sort((a, b) => b.probability - a.probability);
  }, [basketGames, basketPrices]);
  const basketTickets = useMemo(() => mainTab === "straight"
    ? basketLegs.filter(leg => leg.odds >= -150).slice(0, 6).map(leg => ticket([leg]))
    : makeParlays(basketLegs, mainTab === "lotto" ? 7500 : 500, false, 2, 4),
    [basketLegs, mainTab]);
  const section = mainTab === "parlay"
    ? { title: "Most Confident Parlays", subtitle: "Six highest-confidence qualifying tickets per market", tickets: parlays, category: "parlay" as const, threshold: "+500 minimum · 3–20 legs" }
    : mainTab === "straight"
    ? { title: "Most Confident Straight Bets", subtitle: "Six highest-confidence qualifying straight bets per market", tickets: straights, category: "straight" as const, threshold: "-150 or better · 1 leg" }
    : { title: "Lotto Parlays", subtitle: "Six highest-confidence qualifying long shots per market", tickets: lottos, category: "lotto" as const, threshold: "+7,500 minimum · 3–20 legs" };
  const pickTabs: { id: PickTab; label: string }[] = [
    { id: "moneyline", label: "Moneylines" },
    { id: "spread", label: "Spreads" },
    { id: "total", label: "Over / Unders" },
    { id: "player_prop", label: "Player Props" },
    { id: "combos", label: "Combos" },
    ...(sport === "nhl" ? [{ id: "anytime_goal" as const, label: "Anytime Goal Scorers" }, { id: "first_goal" as const, label: "First Goal Scorers" }] : []),
    ...(sport === "mlb" ? [{ id: "home_run" as const, label: "Home Runs" }] : []),
    ...(sport === "nfl" ? [{ id: "anytime_td" as const, label: "Anytime TD Scorers" }, { id: "first_td" as const, label: "First TD Scorers" }] : []),
  ];
  return <main className="mx-auto max-w-7xl space-y-9 px-3 pb-20 sm:px-5">
    <header className="pt-1 text-center">
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
        <span className="bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent">{sport.toUpperCase()}</span>{" "}
        <span className="bg-gradient-to-r from-white via-pink-100 to-pink-400 bg-clip-text text-transparent">Alpha Picks</span>
      </h1>
      <p className="mt-3 text-sm font-semibold text-slate-400">🏆 {next ? "Next Slate" : "Current Slate"} · Model-Ranked Selections</p>
      <div role="tablist" aria-label="Alpha Picks categories" className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {([{ id: "parlay", label: "Parlays" }, { id: "straight", label: "Straight Bets" }, { id: "lotto", label: "Lottos" }] as const).map(tab => <button key={tab.id} type="button" role="tab" aria-selected={mainTab === tab.id} onClick={() => setMainTab(tab.id)} className={"rounded-xl border px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide transition sm:text-sm " + (mainTab === tab.id ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-[#0b1020] text-slate-400 hover:border-white/25 hover:text-white")}>{tab.label}</button>)}
      </div>
    </header>
    {loading ? <p className="rounded-2xl border border-white/10 p-8 text-center text-slate-400">Loading sportsbook and projection data…</p> : <>
      {status && <p className="rounded-xl border border-white/10 p-4 text-center text-slate-300">{status}</p>}
      <div role="tablist" aria-label={mainTab + " market categories"} className="flex flex-wrap justify-center gap-2">
        {pickTabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={categoryTab === tab.id} onClick={() => {
          if (mainTab === "parlay") setParlayTab(tab.id);
          else if (mainTab === "straight") setStraightTab(tab.id);
          else setLottoTab(tab.id);
        }} className={"rounded-xl border px-4 py-2 text-xs font-bold transition sm:text-sm " + (categoryTab === tab.id ? "border-fuchsia-300/50 bg-fuchsia-300/15 text-fuchsia-100" : "border-white/10 bg-slate-900/50 text-slate-400 hover:text-white")}>{tab.label}</button>)}
      </div>
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{section.title} · {pickTabs.find(tab => tab.id === categoryTab)?.label ?? "Moneyline"}</h2>
            <p className="mt-1 text-sm text-slate-400">{section.subtitle}</p>
          </div>

        </div>
        {categoryTab === "first_basket" && sport === "nba" ? (basketTickets.length
          ? <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">{basketTickets.map((t, i) => <PickCard key={"basket" + mainTab + i} ticket={t} index={i} category={section.category} />)}</div>
          : <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-slate-400">No first-basket selections meet this category’s price and model criteria on the current slate.</p>) : ["anytime_goal", "first_goal", "home_run", "anytime_td", "first_td"].includes(categoryTab) ? <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-slate-400">This scorer market requires matching player-level model probabilities and verified sportsbook odds. No eligible priced selections are currently available. The category will remain empty rather than display invented odds.</p> : section.tickets.length ? <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">{section.tickets.map((t, i) => <PickCard key={mainTab + categoryTab + i} ticket={t} index={i} category={section.category} />)}</div> :
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm text-slate-400">No qualifying {pickTabs.find(tab => tab.id === categoryTab)?.label.toLowerCase()} {mainTab === "parlay" ? "parlay" : mainTab === "straight" ? "straight" : "lotto"} picks are available from verified sportsbook prices and model probabilities for this slate. No picks were fabricated.</p>}
      </section>
    </>}
  </main>;
}
