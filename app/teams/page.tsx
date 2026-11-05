"use client";
import {useEffect,useMemo,useState} from "react";
import {Search} from "lucide-react";
import Image from "next/image";
import {AppShell} from "@/components/AppShell";
import StandingsTable, {type StandingsColumn} from "@/components/StandingsTable";
type Team={id:number;name:string;divisionId:number;wins:number;losses:number;gamesPlayed:number;runsScored?:number;runsAllowed?:number;pct?:string;streak?:string;divisionRank?:string;leagueRank?:string;sportRank?:string;home?:string;away?:string;divisionRecord?:string;leagueRecord?:string};
const divisions:Record<number,{league:"AL"|"NL";name:string}>={200:{league:"AL",name:"West"},201:{league:"AL",name:"East"},202:{league:"AL",name:"Central"},203:{league:"NL",name:"West"},204:{league:"NL",name:"East"},205:{league:"NL",name:"Central"}};
type Sort="name"|"league"|"division"|"gamesPlayed"|"wins"|"losses"|"pct"|"runsScored"|"runsAllowed"|"diff"|"sportRank"|"divisionRank"|"leagueRank"|"record"|"home"|"away"|"divisionRecord"|"leagueRecord"|"streak";
const columns:[Sort,string][]=[["name","Team"],["league","League"],["division","Division"],["gamesPlayed","GP"],["wins","W"],["losses","L"],["pct","Win %"],["runsScored","RS"],["runsAllowed","RA"],["diff","Run Diff"]];
const button=(active:boolean,kind:"season"|"mode"|"league"|"division")=>`rounded-xl border px-4 py-2 text-xs font-black uppercase transition ${active?({season:"border-pink-400/60 bg-pink-500/20 text-pink-100",mode:"border-cyan-300/60 bg-cyan-300/15 text-cyan-100",league:"border-white/50 bg-white/15 text-white",division:"border-purple-400/60 bg-purple-500/20 text-purple-100"}[kind]):"border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/30"}`;
export default function MLBTeamsPage(){
 const year=new Date().getFullYear();
 const [season,setSeason]=useState<"current"|"last">("current");
 const [mode,setMode]=useState<"perGame"|"totals">("perGame");
 const [league,setLeague]=useState("ALL"),[division,setDivision]=useState("ALL"),[search,setSearch]=useState("");
 const [sort,setSort]=useState<{key:Sort;desc:boolean}>({key:"pct",desc:true});
 const [teams,setTeams]=useState<Team[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError("");fetch(`/api/mlb/teams?season=${season==="current"?year:year-1}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error("Standings unavailable");return r.json()}).then(j=>setTeams(j.teams||[])).catch(e=>{if(e.name!=="AbortError"){setTeams([]);setError("MLB standings are temporarily unavailable.");}}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[season,year]);
 const metric=(t:Team,k:Sort):number|string|null=>{
  const d=divisions[t.divisionId];const gp=t.gamesPlayed||0;
  switch(k){
   case "name":return t.name;case "sportRank":return t.sportRank?Number(t.sportRank):null;case "divisionRank":return t.divisionRank?Number(t.divisionRank):null;case "leagueRank":return t.leagueRank?Number(t.leagueRank):null;case "record":return t.gamesPlayed?t.wins/t.gamesPlayed:null;case "home":return t.home||"";case "away":return t.away||"";case "divisionRecord":return t.divisionRecord||"";case "leagueRecord":return t.leagueRecord||"";case "streak":return t.streak||"";case "league":return d?.league||"";case "division":return d?.name||"";
   case "gamesPlayed":return t.gamesPlayed;case "wins":return t.wins;case "losses":return t.losses;
   case "pct":return gp?t.wins/gp:null;
   case "runsScored":return t.runsScored==null?null:mode==="totals"?t.runsScored:gp?t.runsScored/gp:null;
   case "runsAllowed":return t.runsAllowed==null?null:mode==="totals"?t.runsAllowed:gp?t.runsAllowed/gp:null;
   case "diff":return t.runsScored==null||t.runsAllowed==null?null:mode==="totals"?t.runsScored-t.runsAllowed:gp?(t.runsScored-t.runsAllowed)/gp:null;
  }
 };
 const rows=useMemo(()=>teams.filter(t=>{const d=divisions[t.divisionId];return (league==="ALL"||d?.league===league)&&(division==="ALL"||d?.name===division)&&t.name.toLowerCase().includes(search.toLowerCase())}).sort((a,b)=>{const x=metric(a,sort.key),y=metric(b,sort.key);if(x==null)return y==null?0:1;if(y==null)return -1;const c=typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y));return sort.desc?-c:c}),[teams,league,division,search,sort,mode]);
 const display=(t:Team,k:Sort)=>{const v=metric(t,k);if(v==null)return "—";if(typeof v==="string")return v;if(k==="pct")return (v*100).toFixed(1)+"%";if(["runsScored","runsAllowed","diff"].includes(k))return v.toFixed(mode==="totals"?0:2);return v.toLocaleString()};
 const overallColumns:StandingsColumn<Team>[]=[
 {key:"sportRank",label:"MLB",value:t=>t.sportRank?Number(t.sportRank):null,render:t=><span className="font-black text-cyan-200">{t.sportRank?"#"+t.sportRank:"—"}</span>},
 {key:"name",label:"Team",value:t=>t.name,render:t=><div className="flex min-w-[220px] items-center gap-3"><img src={`https://www.mlbstatic.com/team-logos/${t.id}.svg`} width={36} height={36} alt="" className="h-9 w-9 shrink-0 object-contain"/><div><div className="text-[15px] font-black text-white">{t.name}</div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{divisions[t.divisionId]?.league||"MLB"}</div></div></div>},
 {key:"league",label:"Conf",value:t=>divisions[t.divisionId]?.league||"—"},
 {key:"division",label:"Division",value:t=>divisions[t.divisionId]?.name||"—"},
 {key:"divisionRank",label:"Div Rank",value:t=>t.divisionRank?Number(t.divisionRank):null,render:t=>t.divisionRank?`${t.divisionRank}${t.divisionRank==="1"?"st":t.divisionRank==="2"?"nd":t.divisionRank==="3"?"rd":"th"}`:"—",align:"center"},
 {key:"leagueRank",label:"Conf Rank",value:t=>t.leagueRank?Number(t.leagueRank):null,render:t=>t.leagueRank?"#"+t.leagueRank:"—",align:"center"},
 {key:"record",label:"Record",value:t=>t.gamesPlayed?t.wins/t.gamesPlayed:null,render:t=>`${t.wins}-${t.losses}`,align:"center"},
 {key:"pct",label:"Win %",value:t=>t.gamesPlayed?t.wins/t.gamesPlayed:null,render:t=>t.gamesPlayed?(t.wins/t.gamesPlayed).toFixed(3).replace(/^0/,""):"—",align:"center"},
 {key:"runsScored",label:"RS",value:t=>metric(t,"runsScored"),render:t=>display(t,"runsScored"),align:"center"},
 {key:"runsAllowed",label:"RA",value:t=>metric(t,"runsAllowed"),render:t=>display(t,"runsAllowed"),align:"center"},
 {key:"diff",label:"Diff",value:t=>metric(t,"diff"),render:t=>{const v=metric(t,"diff");return typeof v==="number"?(v>0?"+":"")+v.toFixed(mode==="totals"?0:2):"—"},align:"center"},
 {key:"home",label:"Home",value:t=>t.home||"",align:"center"},
 {key:"away",label:"Away",value:t=>t.away||"",align:"center"},
 {key:"divisionRecord",label:"Division",value:t=>t.divisionRecord||"",align:"center"},
 {key:"leagueRecord",label:"Conference",value:t=>t.leagueRecord||"",align:"center"},
 {key:"streak",label:"Streak",value:t=>t.streak||"—",align:"center"}
 ];
 return <AppShell><div className="mb-3 flex flex-col items-center pt-8"><div className="flex h-[92px] w-full items-center justify-center overflow-hidden"><Image src="/follow-alpha.png" alt="Follow The Alpha" width={640} height={180} priority className="h-auto w-[560px] max-w-full object-contain"/></div><div className="-mt-2 text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div></div><main className="space-y-5 pb-16 text-white"><section className="glass rounded-3xl p-6 text-center"><h1 className="mb-6 text-3xl font-black neon-text sm:text-5xl">MLB Teams</h1>
 <div className="flex flex-wrap justify-center gap-2">{(["current","last"] as const).map(s=><button key={s} className={button(season===s,"season")} onClick={()=>setSeason(s)}>{s==="current"?"Current Season":"Last Season"}</button>)}</div>
 <div className="mt-3 flex justify-center gap-2">{(["perGame","totals"] as const).map(m=><button key={m} className={button(mode===m,"mode")} onClick={()=>setMode(m)}>{m==="perGame"?"Per Game":"Totals"}</button>)}</div>
 <div className="mt-3 flex justify-center gap-2">{["ALL","AL","NL"].map(l=><button key={l} className={button(league===l,"league")} onClick={()=>{setLeague(l);setDivision("ALL")}}>{l}</button>)}</div>
 <div className="mt-3 flex flex-wrap justify-center gap-2">{["ALL","East","Central","West"].map(d=><button key={d} className={button(division===d,"division")} onClick={()=>setDivision(d)}>{d==="ALL"?"All Divisions":d}</button>)}</div>
 <label className="relative mx-auto mt-5 block w-full max-w-[360px]"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team..." aria-label="Search MLB teams" className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"/></label>
 </section><section className="glass rounded-3xl p-5">{loading?<p className="py-8 text-center text-slate-400">Loading MLB team standings…</p>:error?<p className="py-8 text-center text-amber-200">{error}</p>:<StandingsTable rows={rows} columns={overallColumns} sortKey={sort.key} descending={sort.desc} onSort={key=>setSort(prev=>({key:key as Sort,desc:prev.key===key?!prev.desc:!["name","league","division"].includes(key)}))}/>}</section></main></AppShell>
}
