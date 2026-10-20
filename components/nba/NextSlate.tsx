"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;
type Section = "matchups" | "projections" | "players" | "teams" | "injuries";
const ROOT = "/data/nba/next";
const NAV: { label: string; href: string; key: Section }[] = [
  { label: "Matchups", href: "/nba/next", key: "matchups" },
  { label: "Projections", href: "/nba/next/projections", key: "projections" },
  { label: "Players", href: "/nba/next/players", key: "players" },
  { label: "Teams", href: "/nba/next/teams", key: "teams" },
  { label: "Injuries", href: "/nba/next/injuries", key: "injuries" },
];
const label = (v: unknown) => v === undefined || v === null || v === "" ? "—" : String(v);
const team = (g: Row, side: "home" | "away") => label(g[`${side}_abbr`] || g[`${side}_team`]);
const key = (g: Row) => String(g.game_id || `${team(g, "away")}-${team(g, "home")}`);
const list = (payload: any, field = "games"): Row[] => Array.isArray(payload) ? payload : Array.isArray(payload?.[field]) ? payload[field] : [];
function same(a: Row, b: Row) {
  return a.game_id != null && b.game_id != null && String(a.game_id) === String(b.game_id) ||
    team(a, "away") === team(b, "away") && team(a, "home") === team(b, "home");
}
function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">{children}</section>;
}
function Metric({ title, value }: { title: string; value: unknown }) {
  return <div><div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{title}</div><div className="mt-1 text-lg font-bold text-cyan-100">{label(value)}</div></div>;
}
function Matchup({ game }: { game: Row }) {
  const time = game.game_datetime_utc || game.game_datetime;
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
    <div className="text-xl font-black text-white">{team(game, "away")} <span className="text-slate-500">@</span> {team(game, "home")}</div>
    <div className="text-xs font-bold text-slate-400">{time && !Number.isNaN(Date.parse(time)) ? new Date(time).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) : label(game.game_time)}</div>
  </div>;
}
export default function NextSlate({ section }: { section: Section }) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const files = ["slate", "teams", "player_matchups", "betting_projections", "team_projections", "live_team_markets", "player_prop_markets", "player_stats", "team_stats", "injuries"];
    Promise.all(files.map(async name => {
      try {
        const r = await fetch(`${ROOT}/${name}.json`, { cache: "no-store", signal: controller.signal });
        return [name, r.ok ? await r.json() : null] as const;
      } catch { return [name, null] as const; }
    })).then(entries => { if (!controller.signal.aborted) { setData(Object.fromEntries(entries)); setLoading(false); } });
    return () => controller.abort();
  }, []);
  const games = useMemo(() => list(data.slate), [data.slate]);
  const visible = useMemo(() => games.filter(g => `${team(g, "away")} ${team(g, "home")}`.toLowerCase().includes(search.toLowerCase())), [games, search]);
  const title = NAV.find(n => n.key === section)?.label || "Future Slate";
  const projections = list(data.betting_projections).length ? list(data.betting_projections) : list(data.team_projections);
  const markets = list(data.live_team_markets);
  const props = list(data.player_prop_markets, "props");
  const injuries = list(data.injuries, "injuries");
  const players = list(data.player_stats, "players");
  const teams = list(data.team_stats, "teams");
  const fmt = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v.toFixed(1) : label(v);
  return <main className="space-y-6 p-4 md:p-7">
    <header><div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">NBA Future Slate</div><h1 className="mt-2 text-3xl font-black text-white">{title}</h1><p className="mt-2 text-sm text-slate-400">{label(data.slate?.slate_date || data.betting_projections?.slate_date)} · {games.length} games</p></header>
    <nav className="flex flex-wrap gap-2">{NAV.map(n => <Link key={n.href} href={n.href} className={`rounded-xl border px-4 py-2 text-sm font-bold ${n.key === section ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100" : "border-white/10 text-slate-400 hover:text-white"}`}>{n.label}</Link>)}</nav>
    {loading ? <Card>Loading future slate…</Card> : !games.length ? <Card><p className="font-bold text-white">No future-slate games loaded.</p><p className="mt-2 text-sm text-slate-400">Generate {ROOT}/slate.json and the matching future data files. Current-slate data will not be substituted.</p></Card> : <>
      {(section === "matchups" || section === "projections" || section === "injuries") && <input aria-label="Search matchups" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter matchups…" className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none md:max-w-sm" />}
      {section === "matchups" && visible.map(g => {
        const match = list(data.player_matchups).find(p => same(p, g));
        const count = (match?.away_players?.length || 0) + (match?.home_players?.length || 0);
        return <Card key={key(g)}><Matchup game={g}/><div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Metric title="Away Record" value={g.away_record}/><Metric title="Home Record" value={g.home_record}/><Metric title="Arena" value={g.arena || g.venue}/><Metric title="Players Loaded" value={count}/></div></Card>;
      })}
      {section === "projections" && visible.map(g => {
        const p = projections.find(x => same(x,g)); const m = markets.find(x => same(x,g));
        const model = p?.model || p || {}; const full = m?.full_game || {};
        return <Card key={key(g)}><Matchup game={g}/><div className="grid grid-cols-2 gap-5 md:grid-cols-4"><Metric title="Projected Away" value={fmt(model.away_score)}/><Metric title="Projected Home" value={fmt(model.home_score)}/><Metric title="Projected Total" value={fmt(model.projected_total)}/><Metric title="Home Win %" value={fmt(model.home_win_probability)}/><Metric title="Market Total" value={fmt(full.total?.line)}/><Metric title="Home Spread" value={fmt(full.spread?.home_line)}/><Metric title="Away Team Total" value={fmt(full.team_totals?.away)}/><Metric title="Home Team Total" value={fmt(full.team_totals?.home)}/></div>{p?.periods && <div className="mt-5 border-t border-white/10 pt-4"><h3 className="mb-3 font-black">Period Projections</h3><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Object.entries(p.periods).map(([k,v]:[string,any])=><Metric key={k} title={k} value={fmt(v?.projected_total)}/>)}</div></div>}</Card>;
      })}
      {section === "players" && <><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player…" className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white md:max-w-sm"/>{(() => { const projected = projections.flatMap(g => [...(g.player_projections?.away || []), ...(g.player_projections?.home || [])]); const rows = projected.length ? projected : players; return rows.filter(p => `${p.player_name} ${p.team}`.toLowerCase().includes(search.toLowerCase())).slice(0,300).map((p,i)=> <Card key={`${p.player_id || p.player_name}-${i}`}><div className="mb-3 font-black text-white">{label(p.player_name)} <span className="text-sm text-slate-400">{label(p.team)}</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{["pts","reb","ast","fg3m","fantasy_points"].map(stat=><Metric key={stat} title={stat.toUpperCase()} value={fmt(p.projection?.[stat] ?? p.per_game?.[stat])}/>)}</div><div className="mt-3 text-xs text-slate-400">{props.filter(m=>m.player_name?.toLowerCase()===p.player_name?.toLowerCase()).length} sportsbook prop lines available</div></Card>); })()}</>}
      {section === "teams" && <><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team…" className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white md:max-w-sm"/>{teams.filter(t=>`${t.team} ${t.name} ${t.abbr}`.toLowerCase().includes(search.toLowerCase())).map((t,i)=><Card key={t.team_id || i}><div className="mb-3 text-lg font-black text-white">{label(t.team_name || t.name || t.abbr || t.team)}</div><div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Metric title="Wins" value={t.record?.wins ?? t.wins}/><Metric title="Losses" value={t.record?.losses ?? t.losses}/><Metric title="Points / Game" value={fmt(t.per_game?.pts)}/><Metric title="Rebounds / Game" value={fmt(t.per_game?.reb)}/></div></Card>)}</>}
      {section === "injuries" && <>{visible.map(g=>{const relevant=injuries.filter(p=>[team(g,"away"),team(g,"home")].includes(p.team));return <Card key={key(g)}><Matchup game={g}/>{relevant.length ? relevant.map((p,i)=><div key={i} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2 text-sm"><span className="font-bold">{label(p.player_name)} · {label(p.team)}</span><span className="text-amber-200">{label(p.status)}</span><span className="text-slate-400">{label(p.injury || p.detail)}</span></div>) : <p className="text-sm text-slate-400">No injury reports for this matchup.</p>}</Card>})}</>}
    </>}
  </main>;
}
