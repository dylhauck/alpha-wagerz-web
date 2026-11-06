"use client";

import { useEffect, useMemo, useState } from "react";

type Sport = "mlb" | "nfl" | "nba" | "nhl" | "wnba" | "mls" | "ufc";
type Leg = { id: string; game: string; pick: string; odds: number; probability: number; source: string };
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
const list = (payload: any): any[] => Array.isArray(payload) ? payload : Array.isArray(payload?.games) ? payload.games : [];
const key = (g: any) => String(g?.game_id ?? "");
const matchup = (g: any) => String(g?.away_team ?? g?.away ?? "?") + " @ " + String(g?.home_team ?? g?.home ?? "?");
const same = (a: any, b: any) => (Boolean(key(a)) && key(a) === key(b)) || matchup(a) === matchup(b);
const ticket = (legs: Leg[]): Ticket => {
  const decimal = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1);
  return { legs, odds: decimalToAmerican(decimal), probability: legs.reduce((acc, leg) => acc * leg.probability, 1) };
};

function buildCandidates(sport: Sport, projections: any[], markets: any[]): Leg[] {
  const out: Leg[] = [];
  const add = (game: any, pick: string, odds: unknown, probability: unknown, source: string) => {
    const price = num(odds);
    const p = normalizeProbability(probability);
    if (price === null || price === 0 || p === null || price < -100000 || price > 100000) return;
    // Only genuine sportsbook prices and independently modeled probabilities qualify.
    out.push({ id: key(game) + ":" + pick, game: matchup(game), pick, odds: price, probability: p, source });
  };
  for (const game of projections) {
    const market = markets.find(m => same(m, game));
    if (!market) continue;
    const away = String(game.away_team ?? game.away ?? market.away_team ?? "");
    const home = String(game.home_team ?? game.home ?? market.home_team ?? "");
    if (!away || !home) continue;
    if (sport === "nba") {
      const model = game.model ?? {};
      const ml = market.full_game?.moneyline;
      add(game, away + " ML", ml?.away, model.away_win_probability, "NBA model + live sportsbook");
      add(game, home + " ML", ml?.home, model.home_win_probability, "NBA model + live sportsbook");
    } else if (sport === "nhl") {
      const p = game.probabilities ?? {};
      const ml = market.full_game?.moneyline;
      // NHL baseline win probabilities are not calibrated; clearly label them.
      add(game, away + " ML", ml?.away, p.away_win_probability, "NHL uncalibrated baseline + live sportsbook");
      add(game, home + " ML", ml?.home, p.home_win_probability, "NHL uncalibrated baseline + live sportsbook");
    } else if (sport === "nfl") {
      const ml = market.moneyline;
      const p = game.win_probability ?? {};
      add(game, away + " ML", ml?.away, p.away ?? game.away_win_probability, "NFL model + sportsbook");
      add(game, home + " ML", ml?.home, p.home ?? game.home_win_probability, "NFL model + sportsbook");
    }
  }
  // A ticket cannot include both opposing outcomes from the same game.
  return out.sort((a, b) => b.probability - a.probability);
}

function makeParlays(legs: Leg[], minOdds: number): Ticket[] {
  const MIN_LEGS = 3;
  const MAX_LEGS = 20;
  // Keep one outcome per matchup, and consider as many as 20 distinct games.
  // Beam search avoids the exponential cost of enumerating all combinations.
  const byGame = new Map<string, Leg[]>();
  for (const leg of legs) {
    const group = byGame.get(leg.game) || [];
    group.push(leg);
    byGame.set(leg.game, group);
  }
  const games = [...byGame.values()]
    .map(group => group.sort((a, b) => b.probability - a.probability).slice(0, 2))
    .sort((a, b) => b[0].probability - a[0].probability)
    .slice(0, MAX_LEGS);
  if (games.length < MIN_LEGS) return [];

  type State = { legs: Leg[]; decimal: number; probability: number };
  const beams: State[][] = Array.from({ length: MAX_LEGS + 1 }, () => []);
  beams[0] = [{ legs: [], decimal: 1, probability: 1 }];
  const results: Ticket[] = [];
  const seen = new Set<string>();
  const BEAM_WIDTH = 300;

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
            if (odds >= minOdds) {
              const signature = next.legs.map(x => x.id).sort().join("|");
              if (!seen.has(signature)) {
                seen.add(signature);
                results.push({ legs: next.legs, odds, probability: next.probability });
              }
            }
          }
        }
      }
      beams[count + 1] = [...beams[count + 1], ...expanded]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, BEAM_WIDTH);
    }
  }
  return results.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

function PickCard({ ticket: t, index }: { ticket: Ticket; index: number }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-xs font-black uppercase tracking-wider text-cyan-200">#{index + 1}</span>
      <span className="rounded-lg border border-pink-300/30 bg-pink-300/10 px-3 py-1 text-sm font-black text-pink-200">{fmtOdds(t.odds)}</span>
    </div>
    <div className="space-y-3">{t.legs.map(leg => <div key={leg.id} className="border-t border-white/10 pt-2">
      <p className="text-xs font-bold text-slate-400">{leg.game}</p>
      <p className="font-black text-white">{leg.pick} <span className="text-cyan-200">{fmtOdds(leg.odds)}</span></p>
      <p className="text-xs text-slate-400">Model estimate: {percent(leg.probability)}</p>
    </div>)}</div>
    <p className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">Combined modeled probability (independence assumption): {percent(t.probability)}</p>
  </article>;
}

export default function AlphaPicks({ sport, next = false }: { sport: Sport; next?: boolean }) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
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
    Promise.all(paths[sport].map(async path => {
      if (next) path = path.replace(`/data/${sport}/`, `/data/${sport}/next/`);
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error("Missing " + path);
      return res.json();
    })).then(([p, m]) => {
      if (!active) return;
      const candidates = buildCandidates(sport, list(p), list(m));
      setLegs(candidates);
      setStatus(candidates.length ? "" : "No verified sportsbook odds and model-probability pairs are available for this slate.");
    }).catch(() => {
      if (active) { setLegs([]); setStatus("Current slate projection or sportsbook data is unavailable."); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sport, next]);
  const straights = useMemo(() => legs.filter(leg => leg.odds >= -150).slice(0, 5).map(leg => ticket([leg])), [legs]);
  const parlays = useMemo(() => makeParlays(legs, 500), [legs]);
  const lottos = useMemo(() => makeParlays(legs, 10000), [legs]);
  const sections = [
    { title: "Top 5 Parlays", subtitle: "Highest modeled combined probability with combined odds of +500 or higher", tickets: parlays },
    { title: "Top 5 Straight Bets", subtitle: "Highest individual model probabilities with sportsbook odds of -150 or better", tickets: straights },
    { title: "5 Lotto Parlays", subtitle: "Verified combined American odds of +10,000 or higher", tickets: lottos },
  ];
  return <main className="mx-auto max-w-7xl space-y-7 px-2 pb-16">
    <header className="text-center"><p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">FollowTheAlpha 🐺</p>
      <h1 className="mt-2 text-4xl font-black text-white">Alpha Picks</h1>
      <p className="mt-3 text-sm text-slate-400">{sport.toUpperCase()} • {next ? "Next slate" : "Current slate"} • Model-ranked picks, not guarantees</p>
    </header>
    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
      Picks require both a real sportsbook price and a model probability. Parlays assume independent games; actual outcomes are uncertain. NHL estimates are uncalibrated. Lotto parlays are highly unlikely to hit. No invented lines or filler selections.
    </div>
    {loading ? <p className="text-center text-slate-400">Loading sportsbook and projection data…</p> : <>
      {status && <p className="rounded-xl border border-white/10 p-4 text-center text-slate-300">{status}</p>}
      {sections.map(section => <section key={section.title}>
        <div className="mb-4"><h2 className="text-2xl font-black text-white">{section.title}</h2><p className="text-sm text-slate-400">{section.subtitle}</p></div>
        {section.tickets.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{section.tickets.map((t, i) => <PickCard key={section.title + i} ticket={t} index={i} />)}</div> :
          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-5 text-sm text-slate-400">Not enough verified, distinct-game selections to generate this category. No picks were fabricated.</p>}
      </section>)}
    </>}
  </main>;
}
