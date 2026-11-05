"use client";
import {useEffect,useMemo,useState} from "react";
import {Search,Trophy} from "lucide-react";
import StandingsTable, {type StandingsColumn} from "@/components/StandingsTable";

type TeamStats={team:string;games:number;wins:number;losses?:number;ot_losses?:number;points?:number;goals_for?:number;goals_against?:number;goals_for_per_game?:number;goals_against_per_game?:number;streak?:string;division_rank?:number;conference_rank?:number;league_rank?:number;home_wins?:number;home_losses?:number;home_ot_losses?:number;away_wins?:number;away_losses?:number;away_ot_losses?:number};
type Season="current"|"last";
type View="perGame"|"totals";
type SortKey="team"|"conference"|"division"|"games"|"wins"|"losses"|"otLosses"|"points"|"winPct"|"goalsFor"|"goalsAgainst"|"goalDiff"|"leagueRank"|"divisionRank"|"conferenceRank"|"record"|"home"|"away"|"streak";
const DIVISIONS:Record<string,[string,string]>={
 ANA:["WEST","Pacific"],BOS:["EAST","Atlantic"],BUF:["EAST","Atlantic"],CAR:["EAST","Metropolitan"],CBJ:["EAST","Metropolitan"],CGY:["WEST","Pacific"],CHI:["WEST","Central"],COL:["WEST","Central"],DAL:["WEST","Central"],DET:["EAST","Atlantic"],EDM:["WEST","Pacific"],FLA:["EAST","Atlantic"],LAK:["WEST","Pacific"],MIN:["WEST","Central"],MTL:["EAST","Atlantic"],NJD:["EAST","Metropolitan"],NSH:["WEST","Central"],NYI:["EAST","Metropolitan"],NYR:["EAST","Metropolitan"],OTT:["EAST","Atlantic"],PHI:["EAST","Metropolitan"],PIT:["EAST","Metropolitan"],SEA:["WEST","Pacific"],SJS:["WEST","Pacific"],STL:["WEST","Central"],TBL:["EAST","Atlantic"],TOR:["EAST","Atlantic"],UTA:["WEST","Central"],VAN:["WEST","Pacific"],VGK:["WEST","Pacific"],WPG:["WEST","Central"],WSH:["EAST","Metropolitan"]};
const NAMES:Record<string,string>={
 ANA:"Anaheim Ducks",BOS:"Boston Bruins",BUF:"Buffalo Sabres",CAR:"Carolina Hurricanes",CBJ:"Columbus Blue Jackets",CGY:"Calgary Flames",CHI:"Chicago Blackhawks",COL:"Colorado Avalanche",DAL:"Dallas Stars",DET:"Detroit Red Wings",EDM:"Edmonton Oilers",FLA:"Florida Panthers",LAK:"Los Angeles Kings",MIN:"Minnesota Wild",MTL:"Montréal Canadiens",NJD:"New Jersey Devils",NSH:"Nashville Predators",NYI:"New York Islanders",NYR:"New York Rangers",OTT:"Ottawa Senators",PHI:"Philadelphia Flyers",PIT:"Pittsburgh Penguins",SEA:"Seattle Kraken",SJS:"San Jose Sharks",STL:"St. Louis Blues",TBL:"Tampa Bay Lightning",TOR:"Toronto Maple Leafs",UTA:"Utah Mammoth",VAN:"Vancouver Canucks",VGK:"Vegas Golden Knights",WPG:"Winnipeg Jets",WSH:"Washington Capitals"};
const record=(w?:number,l?:number,ot?:number)=>w==null||l==null?"—":`${w}-${l}${ot?", "+ot+" OTL":""}`;
const cols:[SortKey,string][]=[["team","Team"],["conference","Conference"],["division","Division"],["games","GP"],["wins","W"],["losses","L"],["otLosses","OTL"],["points","PTS"],["winPct","Win %"],["goalsFor","GF"],["goalsAgainst","GA"],["goalDiff","Goal Diff"]];
const n=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:null;
export default function NHLTeamsPage(){
 const [season,setSeason]=useState<Season>("current");
 const [view,setView]=useState<View>("perGame");
 const [conference,setConference]=useState("ALL");
 const [division,setDivision]=useState("ALL");
 const [search,setSearch]=useState("");
 const [sort,setSort]=useState<{key:SortKey;desc:boolean}>({key:"winPct",desc:true});
 const [datasets,setDatasets]=useState<Record<Season,TeamStats[]|null>>({current:null,last:null});
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let mounted=true;Promise.all((([["current","teams.json"],["last","teams_last_season.json"]] as const).map(async ([key,file])=>{try{const res=await fetch("/data/nhl/"+file,{cache:"no-store"});if(!res.ok)return [key,null] as const;const payload=await res.json();const rows=Array.isArray(payload)?payload:payload.teams;return [key,Array.isArray(rows)?rows as TeamStats[]:null] as const;}catch{return [key,null] as const;}}))).then(results=>{if(mounted){setDatasets(Object.fromEntries(results) as Record<Season,TeamStats[]|null>);setLoading(false);}});return()=>{mounted=false};},[]);
 const rows=useMemo(()=>{
  const data=datasets[season]||[];
  const metric=(t:TeamStats,key:SortKey):string|number|null=>{
   const gp=n(t.games),w=n(t.wins),gf=n(t.goals_for_per_game)??(gp?n(t.goals_for)!/gp:null),ga=n(t.goals_against_per_game)??(gp?n(t.goals_against)!/gp:null);
   switch(key){
    case "team":return NAMES[t.team]||t.team;
    case "leagueRank":return n(t.league_rank);
    case "divisionRank":return n(t.division_rank);
    case "conferenceRank":return n(t.conference_rank);
    case "record":return w!==null&&gp!==null?w/gp:null;
    case "home":return n(t.home_wins);
    case "away":return n(t.away_wins);
    case "streak":return t.streak||"";
    case "conference":return DIVISIONS[t.team]?.[0]||"";
    case "division":return DIVISIONS[t.team]?.[1]||"";
    case "games":return gp;
    case "wins":return w;
    case "losses":return n(t.losses);
    case "otLosses":return n(t.ot_losses);
    case "points":return n(t.points);
    case "winPct":return gp&&w!==null?w/gp:null;
    case "goalsFor":return gf===null?null:view==="totals"&&gp!==null?gf*gp:gf;
    case "goalsAgainst":return ga===null?null:view==="totals"&&gp!==null?ga*gp:ga;
    case "goalDiff":return gf===null||ga===null?null:(gf-ga)*(view==="totals"?(gp||0):1);
   }
  };
  return data.filter(t=>{
   const [conf,div]=DIVISIONS[t.team]||["",""];
   return (conference==="ALL"||conf===conference)&&(division==="ALL"||div===division)&&((NAMES[t.team]||t.team)+" "+t.team+" "+div).toLowerCase().includes(search.toLowerCase());
  }).sort((a,b)=>{const av=metric(a,sort.key),bv=metric(b,sort.key);if(av===null)return bv===null?0:1;if(bv===null)return -1;const cmp=typeof av==="number"&&typeof bv==="number"?av-bv:String(av).localeCompare(String(bv));return sort.desc?-cmp:cmp;});
 },[datasets,season,conference,division,search,sort,view]);
 const display=(t:TeamStats,key:SortKey)=>{
  const gp=n(t.games),w=n(t.wins),gf=n(t.goals_for_per_game)??(gp?n(t.goals_for)!/gp:null),ga=n(t.goals_against_per_game)??(gp?n(t.goals_against)!/gp:null);
  switch(key){
   case "team":return NAMES[t.team]||t.team;
   case "conference":return DIVISIONS[t.team]?.[0]==="EAST"?"East":"West";
   case "division":return DIVISIONS[t.team]?.[1]||"—";
   case "games":return gp??"—";
   case "wins":return w??"—";
   case "losses":return n(t.losses)??"—";
   case "otLosses":return n(t.ot_losses)??"—";
   case "points":return n(t.points)??"—";
   case "winPct":return gp&&w!==null?(100*w/gp).toFixed(1)+"%":"—";
   case "goalsFor":return gf===null?"—":view==="totals"&&gp!==null?String(t.goals_for??Math.round(gf*gp)):gf.toFixed(2);
   case "goalsAgainst":return ga===null?"—":view==="totals"&&gp!==null?String(t.goals_against??Math.round(ga*gp)):ga.toFixed(2);
   case "goalDiff":return gf===null||ga===null?"—":view==="totals"?String((t.goals_for??Math.round(gf*(gp||0)))-(t.goals_against??Math.round(ga*(gp||0)))):(gf-ga).toFixed(2);
  }
 };
 const overallColumns:StandingsColumn<TeamStats>[]=[
 {key:"leagueRank",label:"NHL",value:t=>t.league_rank??null,render:t=><span className="font-black text-cyan-200">{t.league_rank?"#"+t.league_rank:"—"}</span>},
 {key:"team",label:"Team",value:t=>NAMES[t.team]||t.team,render:t=><div className="flex min-w-[230px] items-center gap-3"><img src={`https://assets.nhle.com/logos/nhl/svg/${t.team}_light.svg`} width={36} height={36} alt="" className="h-9 w-9 shrink-0 object-contain"/><div><div className="text-[15px] font-black text-white">{NAMES[t.team]||t.team}</div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{t.team}</div></div></div>},
 {key:"conference",label:"Conf",value:t=>DIVISIONS[t.team]?.[0]||"—"},
 {key:"division",label:"Division",value:t=>DIVISIONS[t.team]?.[1]||"—"},
 {key:"divisionRank",label:"Div Rank",value:t=>t.division_rank??null,render:t=>t.division_rank?`${t.division_rank}${t.division_rank===1?"st":t.division_rank===2?"nd":t.division_rank===3?"rd":"th"}`:"—",align:"center"},
 {key:"conferenceRank",label:"Conf Rank",value:t=>t.conference_rank??null,render:t=>t.conference_rank?"#"+t.conference_rank:"—",align:"center"},
 {key:"record",label:"Record",value:t=>t.games?t.wins/t.games:null,render:t=>record(t.wins,t.losses,t.ot_losses),align:"center"},
 {key:"winPct",label:"Win %",value:t=>t.games?t.wins/t.games:null,render:t=>t.games?(t.wins/t.games).toFixed(3).replace(/^0/,""):"—",align:"center"},
 {key:"goalsFor",label:"GF",value:t=>t.goals_for??null,render:t=>t.goals_for??"—",align:"center"},
 {key:"goalsAgainst",label:"GA",value:t=>t.goals_against??null,render:t=>t.goals_against??"—",align:"center"},
 {key:"goalDiff",label:"Diff",value:t=>t.goals_for!=null&&t.goals_against!=null?t.goals_for-t.goals_against:null,render:t=>t.goals_for!=null&&t.goals_against!=null?((t.goals_for-t.goals_against)>0?"+":"")+(t.goals_for-t.goals_against):"—",align:"center"},
 {key:"home",label:"Home",value:t=>t.home_wins??null,render:t=>record(t.home_wins,t.home_losses,t.home_ot_losses),align:"center"},
 {key:"away",label:"Away",value:t=>t.away_wins??null,render:t=>record(t.away_wins,t.away_losses,t.away_ot_losses),align:"center"},
 {key:"streak",label:"Streak",value:t=>t.streak||"",align:"center"}
 ];
 const button=(active:boolean,group:"season"|"mode"|"conference"|"division")=>{
  const base="rounded-xl border px-4 py-2 text-xs font-black uppercase transition";
  const selected={
   season:"border-pink-400/60 bg-pink-500/20 text-pink-100",
   mode:"border-cyan-300/60 bg-cyan-300/15 text-cyan-100",
   conference:"border-white/50 bg-white/15 text-white",
   division:"border-purple-400/60 bg-purple-500/20 text-purple-100"
  };
  return `${base} ${active?selected[group]:"border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/25"}`;
 };
 return <main className="space-y-5 pb-16 text-white"><section className="glass rounded-3xl p-6 text-center"><h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">NHL Teams</h1><div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-400"><Trophy size={16} className="text-cyan-300" /> <span>{season === "last" ? "2025–26 Season" : "2026–27 Season"} {view === "totals" ? "Totals" : "Per-Game Averages"}</span></div>
 <div className="mt-6 flex flex-wrap justify-center gap-2"><button className={button(season==="current","season")} onClick={()=>setSeason("current")}>Current Season</button><button className={button(season==="last","season")} onClick={()=>setSeason("last")}>Last Season</button></div>
 <div className="mt-3 flex justify-center gap-2"><button className={button(view==="perGame","mode")} onClick={()=>setView("perGame")}>Per Game</button><button className={button(view==="totals","mode")} onClick={()=>setView("totals")}>Totals</button></div>
 <div className="mt-3 flex flex-wrap justify-center gap-2">{["ALL","EAST","WEST"].map(c=><button key={c} className={button(conference===c,"conference")} onClick={()=>{setConference(c);setDivision("ALL");}}>{c}</button>)}</div>
 <div className="mt-3 flex flex-wrap justify-center gap-2">{["ALL","Atlantic","Metropolitan","Central","Pacific"].map(d=><button key={d} className={button(division===d,"division")} onClick={()=>{setDivision(d);if(d!=="ALL")setConference(["Atlantic","Metropolitan"].includes(d)?"EAST":"WEST");}}>{d==="ALL"?"All Divisions":d}</button>)}</div>
<label className="relative mx-auto mt-5 block w-full max-w-[360px]"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team..." aria-label="Search NHL teams" className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"/></label>
<div className="mt-4 flex flex-wrap justify-center gap-3"><div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">{(datasets[season]||[]).length} Teams</div><div className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-300">{(datasets[season]||[]).length === 32 ? Math.round((datasets[season]||[]).reduce((sum,team)=>sum+(Number(team.games)||0),0)/2).toLocaleString() : "—"} Completed REG Games</div></div>
</section>
 <section className="glass rounded-3xl p-5">{loading?<p className="py-8 text-center text-slate-400">Loading NHL teams…</p>:!datasets[season]?<p className="py-8 text-center text-amber-200">{season==="last"?"Last-season NHL team statistics have not been generated yet.":"Current NHL team statistics are unavailable."}</p>:<><StandingsTable rows={rows} columns={overallColumns} sortKey={sort.key} descending={sort.desc} onSort={key=>setSort(prev=>({key:key as SortKey,desc:prev.key===key?!prev.desc:!["team","conference","division"].includes(key)}))}/><p className="mt-4 text-xs text-slate-500">NHL standings include regulation losses, overtime losses and points. Per-game goal averages are calculated from season totals.</p></>}</section></main>;
}
