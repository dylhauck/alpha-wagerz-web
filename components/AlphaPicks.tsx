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
  const sections: { title: string; subtitle: string; tickets: Ticket[]; category: "parlay" | "straight" | "lotto"; threshold: string }[] = [
    { title: "Most Confident Parlays", subtitle: "Highest modeled combined probability among qualifying tickets", tickets: parlays, category: "parlay", threshold: "+500 minimum · 3–20 legs" },
    { title: "Most Confident Straight Bets", subtitle: "Top individual model probabilities at eligible sportsbook prices", tickets: straights, category: "straight", threshold: "-150 or better · 1 leg" },
    { title: "Lotto Parlays", subtitle: "Long-shot combinations ranked by modeled probability", tickets: lottos, category: "lotto", threshold: "+10,000 minimum · 3–20 legs" },
  ];
  return <main className="mx-auto max-w-7xl space-y-9 px-3 pb-20 sm:px-5">
    <header className="relative overflow-hidden rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.09] via-[#0b1425] to-fuchsia-400/[0.08] px-6 py-9 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:py-12">
      <div className="pointer-events-none absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">FollowTheAlpha 🐺</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Alpha <span className="text-cyan-300">Picks</span></h1>
      <p className="mt-3 text-sm font-medium text-slate-300">{sport.toUpperCase()} <span className="mx-2 text-slate-600">•</span> {next ? "Next Slate" : "Current Slate"} <span className="mx-2 text-slate-600">•</span> Model-Ranked Selections</p>
      <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2">
        {["5 Parlays", "5 Straight Bets", "5 Lottos"].map(label => <span key={label} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-slate-200">{label}</span>)}
      </div>
    </header>
    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] px-5 py-4 text-xs leading-6 text-slate-300 sm:text-sm">
      <span className="mr-2 font-black text-amber-200">Model notes</span> Picks use real sportsbook prices and model probabilities. Combined probabilities assume independent games. NHL estimates are uncalibrated. Lotto parlays are high risk. No outcomes are guaranteed or fabricated.
    </div>
    {loading ? <p className="rounded-2xl border border-white/10 p-8 text-center text-slate-400">Loading sportsbook and projection data…</p> : <>
      {status && <p className="rounded-xl border border-white/10 p-4 text-center text-slate-300">{status}</p>}
      {sections.map((section, sectionIndex) => <section key={section.title} className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-start gap-4">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-sm font-black text-cyan-200">0{sectionIndex + 1}</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{section.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{section.subtitle}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300">{section.threshold}</span>
        </div>
        {section.tickets.length ? <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">{section.tickets.map((t, i) => <PickCard key={section.title + i} ticket={t} index={i} category={section.category} />)}</div> :
          <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm text-slate-400">Not enough verified selections to generate this category. No picks were fabricated.</p>}
      </section>)}
    </>}
  </main>;
}
