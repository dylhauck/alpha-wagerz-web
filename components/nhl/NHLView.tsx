"use client";

import { useEffect, useMemo, useState } from "react";

type Game = {
  game_id: number; date: string; start_time_utc?: string;
  away: string; home: string; away_name: string; home_name: string;
  away_logo?: string; home_logo?: string; venue?: string;
};
type GoalPlayer = {
  player_id: string; name: string; team: string; games: number;
  goals_per_game: number; shots_per_game: number; goal_probability: number;
  expected_goals: number;
};
type Goalie = { player_id: string; name: string; team: string; games: number; saves: number; shots_against: number; goals_against: number; save_percentage: number | null; goals_against_per_appearance: number };
type Team = { team: string; games: number; wins: number; goals_for_per_game: number; goals_against_per_game: number };
type Player = { player_id: string; name: string; team: string; position: string; games: number; goals: number; assists: number; points: number; shots: number; goals_per_game: number; shots_per_game: number };
type Projection = { game_id: number; away: string; home: string; away_goals: number | null; home_goals: number | null; sample_games: number };
type History = { game_id: number; games: Array<{ id: number; date: string; away: string; home: string; away_score: number; home_score: number }> };
type Mode = "summary" | "players" | "teams" | "projections" | "injuries" | "how-to";
const files = ["slate", "anytime_goals", "matchup_history", "players", "teams", "projections", "injuries"] as const;
type Data = Record<(typeof files)[number], any>;
function pctColor(value: number, low: number, high: number) {
  const t = high > low ? Math.max(0, Math.min(1, (value - low) / (high - low))) : 0.5;
  const colors = [[190,18,60],[234,88,12],[234,179,8],[132,204,22],[5,163,93]];
  const x = t * (colors.length - 1), i = Math.min(3, Math.floor(x)), f = x - i;
  return `rgb(${colors[i].map((v,j) => Math.round(v + (colors[i+1][j]-v)*f)).join(",")})`;
}
function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-3xl border border-cyan-300/20 bg-slate-900/65 p-5 shadow-xl sm:p-7">{children}</section>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-black text-white">{children}</h2>;
}
function Table({ heads, rows }: { heads: string[]; rows: React.ReactNode[][] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[600px] border-separate border-spacing-y-2 text-sm">
    <thead><tr>{heads.map(h=><th key={h} className="px-3 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead>
    <tbody>{rows.map((row,i)=><tr key={i} className="bg-white/[0.045]">{row.map((cell,j)=><td key={j} className="px-3 py-3 font-semibold text-slate-200">{cell}</td>)}</tr>)}</tbody>
  </table>{!rows.length&&<p className="py-8 text-center text-sm text-slate-400">No verified data available.</p>}</div>;
}
export default function NHLView({ mode, next = false }: { mode: Mode; next?: boolean }) {
  const [data,setData]=useState<Partial<Data>>({});
  const [selected,setSelected]=useState<number|null>(null);
  const [tab,setTab]=useState<"goals"|"history">("goals");
  const [projectionPeriod,setProjectionPeriod]=useState("Full Game");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let alive=true;
    setLoading(true);
    const base=`/data/nhl/${next?"next/":""}`;
    Promise.all(files.map(async name=>{
      try {
        const response=await fetch(`${base}${name}.json`,{cache:"no-store"});
        return [name,response.ok?await response.json():null] as const;
      } catch {return [name,null] as const;}
    })).then(results=>{
      if(!alive)return;
      const values=Object.fromEntries(results) as Partial<Data>;
      setData(values);
      const games=(values.slate?.games||[]) as Game[];
      setSelected(games[0]?.game_id??null);
      setLoading(false);
    });
    return ()=>{alive=false;};
  },[next]);
  const games=(data.slate?.games||[]) as Game[];
  const active=games.find(g=>g.game_id===selected)||games[0];
  const players=(data.players?.players||[]) as Player[];
  const goalies=(data.players?.goalies||[]) as Goalie[];
  const teams=(data.teams?.teams||[]) as Team[];
  const projections=(data.projections?.games||[]) as Projection[];
  const goals=(data.anytime_goals?.games||[]).find((g:{game_id:number})=>g.game_id===active?.game_id)?.players as GoalPlayer[]|undefined;
  const history=(data.matchup_history?.games||[]).find((g:History)=>g.game_id===active?.game_id)?.games as History["games"]|undefined;
  const range=useMemo(()=>({min:Math.min(...(goals||[]).map(p=>p.goal_probability)),max:Math.max(...(goals||[]).map(p=>p.goal_probability))}),[goals]);
  const date=next?"Next Slate":"Current Slate";
  return <main className="space-y-5 pb-16 text-white">
    {loading?<Panel><p className="text-center text-slate-400">Loading NHL data…</p></Panel>:mode==="summary"?<>
      <div className="mb-4 flex justify-center"><div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{games.length} NHL Games Loaded For {date}</div></div>
      <section className="glass rounded-3xl p-4">
        <div className="mb-4"><div className="table-scroll mt-2 pb-2">
          <div className="flex min-w-max gap-2">
            {games.map(g=><button key={g.game_id} type="button" onClick={()=>{setSelected(g.game_id);setTab("goals");}}
              className={`min-w-[150px] shrink-0 rounded-xl border bg-slate-950/80 px-3 py-2 transition ${active?.game_id===g.game_id?"border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]":"border-white/10 bg-white/[0.035] hover:border-pink-300/40"}`}>
              <div className="flex items-center justify-center gap-2">
                {([["away",g.away,g.away_logo],["home",g.home,g.home_logo]] as const).map(([side,abbr,logo],index)=>
                  <div key={side} className="contents">
                    {index===1&&<span className="text-xs font-black text-slate-400">@</span>}
                    <div className="relative flex h-11 w-11 items-center justify-center">
                      <div className="absolute inset-0 rounded-xl bg-white/50 blur-xl"/>
                      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]">
                        <img src={logo||`https://assets.nhle.com/logos/nhl/svg/${abbr}_light.svg`} alt={`${abbr} logo`} width={30} height={30} className="h-[30px] w-[30px] object-contain"
                          onError={e=>{const img=e.currentTarget; if(img.dataset.fallback!=="1"){img.dataset.fallback="1";img.src=`https://a.espncdn.com/i/teamlogos/nhl/500/${abbr.toLowerCase()}.png`;}else{img.style.display="none";}}}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-center text-sm font-black tracking-wide text-white">
                {g.start_time_utc?new Date(g.start_time_utc).toLocaleTimeString("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"}):"TBD"} CT
              </div>
            </button>)}
          </div>
        </div></div>
        {active&&<div className="rounded-3xl border border-cyan-300/15 bg-white/[0.035] p-5 text-center">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">NHL Slate Summary</div>
          <h2 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">{active.away} @ {active.home}</h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-400">
            <span className="flex items-center gap-2"><span aria-hidden="true">▦</span>{active.date || data.slate?.date || "Date TBD"}</span>
            <span className="flex items-center gap-2"><span aria-hidden="true">◷</span>{active.start_time_utc ? new Date(active.start_time_utc).toLocaleString("en-US",{timeZone:"America/Chicago",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "Time TBD"} CT</span>
            <span className="flex items-center gap-2"><span aria-hidden="true">⌖</span>{active.venue || "Venue TBD"}</span>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
            {([["away",active.away,active.away_name,active.away_logo],["home",active.home,active.home_name,active.home_logo]] as const).map(([side,abbr,name,logo],index)=>
              <div key={side} className="contents">
                {index===1&&<div className="hidden items-center justify-center xl:flex"><div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-xl font-black text-white">@</div></div>}
                <div className={`flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 ${side==="home"?"justify-end text-right":""}`}>
                  {side==="away"&&<img src={logo||`https://assets.nhle.com/logos/nhl/svg/${abbr}_light.svg`} alt={`${name||abbr} logo`} width={78} height={78} className="h-[78px] w-[78px] object-contain"/>}
                  <div className={side==="home"?"text-right":"text-left"}><div className="text-xl font-black text-white sm:text-2xl">{name||abbr}</div><div className="mt-1 text-sm font-bold text-slate-400">{(()=>{const team=teams.find(t=>t.team===abbr);return team && Number.isFinite(team.wins) && Number.isFinite(team.games) ? `${team.wins}-${Math.max(0,team.games-team.wins)}` : "—";})()}</div></div>
                  {side==="home"&&<img src={logo||`https://assets.nhle.com/logos/nhl/svg/${abbr}_light.svg`} alt={`${name||abbr} logo`} width={78} height={78} className="h-[78px] w-[78px] object-contain"/>}
                </div>
              </div>
            )}
          </div>
        </div>}
        {!games.length&&<p className="py-8 text-center text-slate-400">No games scheduled or NHL slate data has not been generated.</p>}
      </section>
      {active&&<Panel><div className="mb-5 flex justify-center"><div className="flex rounded-xl border border-white/10 bg-slate-950/70 p-1">
        {[["goals","Anytime Goal Graph"],["history","Matchup History"]].map(([key,label])=><button key={key} onClick={()=>setTab(key as "goals"|"history")}
          className={`rounded-lg px-5 py-3 text-xs font-black uppercase tracking-wider ${tab===key?"border border-cyan-300/50 bg-cyan-300/15 text-cyan-100":"text-slate-500"}`}>{label}</button>)}
      </div></div>
        <Title>{tab==="goals"?`${active.away} @ ${active.home} — Anytime Goal Rankings`:`${active.away} @ ${active.home} — Matchup History`}</Title>
        {tab==="goals"?<><p className="mb-4 text-xs text-amber-200/80">Historical goal-and-shot estimates, not validated betting probabilities. Starting goalies, power-play roles, injuries and confirmed lines are not yet incorporated.</p>
          <Table heads={["Rank","Player","Team","Anytime Goal %","Goals/G","Shots/G","Sample"]} rows={(goals||[]).map((p,i)=>[
            i+1,p.name,p.team,<span key={p.player_id} className="inline-block min-w-[84px] rounded-lg px-3 py-2 text-center font-black text-white" style={{backgroundColor:pctColor(p.goal_probability,range.min,range.max)}}>{p.goal_probability.toFixed(1)}%</span>,
            p.goals_per_game.toFixed(2),p.shots_per_game.toFixed(2),`${p.games} GP`
          ])}/></>:<Table heads={["Date","Matchup","Final Score"]} rows={(history||[]).map(g=>[g.date,`${g.away} @ ${g.home}`,`${g.away_score} – ${g.home_score}`])}/>}
      </Panel>}
    </>:mode==="players"?<><Panel><Title>NHL Skater Statistics</Title><p className="mb-3 text-xs text-slate-400">Completed games in the current historical sample. GP is observed appearances, not full-season totals.</p><Table heads={["Player","Team","Pos","GP","Goals","Assists","Points","Shots","Goals/G","Shots/G"]} rows={players.map(p=>[p.name,p.team,p.position,p.games,p.goals,p.assists,p.points,p.shots,p.goals_per_game.toFixed(2),p.shots_per_game.toFixed(2)])}/></Panel><Panel><Title>NHL Goaltenders</Title><p className="mb-3 text-xs text-amber-200/80">Historical appearances only; these are not confirmed starters for the upcoming slate.</p><Table heads={["Goalie","Team","GP","Saves","Shots Against","Goals Against","Save %","GA/Appearance"]} rows={goalies.map(g=>[g.name,g.team,g.games,g.saves,g.shots_against,g.goals_against,g.save_percentage==null?"—":(g.save_percentage*100).toFixed(1)+"%",g.goals_against_per_appearance.toFixed(2)])}/></Panel></>
    :mode==="teams"?<Panel><Title>NHL Team Statistics</Title><Table heads={["Team","GP","Wins","Goals For/G","Goals Against/G"]} rows={teams.map(t=>[t.team,t.games,t.wins,t.goals_for_per_game.toFixed(2),t.goals_against_per_game.toFixed(2)])}/></Panel>
    :mode==="projections"?<Panel><Title>NHL Game Projections</Title><div className="mb-5 flex flex-wrap justify-center gap-3">{["Full Game","1st Period","2nd Period","3rd Period"].map(period=><button key={period} type="button" onClick={()=>setProjectionPeriod(period)} className={`rounded-xl border px-5 py-3 text-sm font-black transition ${projectionPeriod===period?"border-cyan-300/70 bg-cyan-300/15 text-cyan-100":"border-white/10 bg-slate-950/60 text-slate-300 hover:border-cyan-300/30"}`}>{period}</button>)}</div>{projectionPeriod==="Full Game"?<><p className="mb-4 text-xs text-amber-200/80">Recent goals-for/against baseline, not sportsbook odds or a validated betting model.</p><Table heads={["Game","Away Goals","Home Goals","Projected Total","Sample"]} rows={projections.map(p=>[`${p.away} @ ${p.home}`,p.away_goals?.toFixed(2)??"—",p.home_goals?.toFixed(2)??"—",p.away_goals!=null&&p.home_goals!=null?(p.away_goals+p.home_goals).toFixed(2):"—",`${p.sample_games} GP`])}/></>:<p className="py-8 text-center text-sm text-amber-200/80">Verified {projectionPeriod.toLowerCase()} projections are not available in the NHL model data yet. Full-game estimates are not divided into periods.</p>}</Panel>
    :mode==="injuries"?<Panel><Title>NHL Injury Report</Title><p className="text-sm text-amber-200">{data.injuries?.message||"Verified NHL injury data unavailable. No injury statuses have been assumed."}</p></Panel>
    :<Panel><Title>How to Read NHL Projections</Title><p className="space-y-3 text-sm leading-7 text-slate-300">Anytime goal percentage is currently a Poisson estimate blending observed recent goals per game and shots-based scoring opportunity, adjusted by the opponent's recent goals allowed. The heatmap is relative to players in the selected matchup. These are preliminary estimates, not verified market probabilities. Matchup history uses completed NHL games; unavailable data is shown as unavailable, never as zero. Confirm starting goaltenders, player availability, and line assignments before betting.</p></Panel>}
  </main>;
}
