"use client";
import {useEffect,useMemo,useState} from "react";
import {Search} from "lucide-react";
type Team={id:number;name:string;divisionId:number;wins:number;losses:number;gamesPlayed:number;runsScored?:number;runsAllowed?:number;pct?:string;streak?:string};
const divisions:Record<number,{league:"AL"|"NL";name:string}>={200:{league:"AL",name:"West"},201:{league:"AL",name:"East"},202:{league:"AL",name:"Central"},203:{league:"NL",name:"West"},204:{league:"NL",name:"East"},205:{league:"NL",name:"Central"}};
type Sort="name"|"league"|"division"|"gamesPlayed"|"wins"|"losses"|"pct"|"runsScored"|"runsAllowed"|"diff";
const columns:[Sort,string][]=[["name","Team"],["league","League"],["division","Division"],["gamesPlayed","GP"],["wins","W"],["losses","L"],["pct","Win %"],["runsScored","RS"],["runsAllowed","RA"],["diff","Run Diff"]];
const button=(active:boolean,kind:"season"|"mode"|"league"|"division")=>`rounded-xl border px-4 py-2 text-xs font-black uppercase transition ${active?({season:"border-red-400/60 bg-red-500/20 text-red-100",mode:"border-cyan-300/60 bg-cyan-300/15 text-cyan-100",league:"border-white/50 bg-white/15 text-white",division:"border-purple-400/60 bg-purple-500/20 text-purple-100"}[kind]):"border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/30"}`;
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
   case "name":return t.name;case "league":return d?.league||"";case "division":return d?.name||"";
   case "gamesPlayed":return t.gamesPlayed;case "wins":return t.wins;case "losses":return t.losses;
   case "pct":return gp?t.wins/gp:null;
   case "runsScored":return t.runsScored==null?null:mode==="totals"?t.runsScored:gp?t.runsScored/gp:null;
   case "runsAllowed":return t.runsAllowed==null?null:mode==="totals"?t.runsAllowed:gp?t.runsAllowed/gp:null;
   case "diff":return t.runsScored==null||t.runsAllowed==null?null:mode==="totals"?t.runsScored-t.runsAllowed:gp?(t.runsScored-t.runsAllowed)/gp:null;
  }
 };
 const rows=useMemo(()=>teams.filter(t=>{const d=divisions[t.divisionId];return (league==="ALL"||d?.league===league)&&(division==="ALL"||d?.name===division)&&t.name.toLowerCase().includes(search.toLowerCase())}).sort((a,b)=>{const x=metric(a,sort.key),y=metric(b,sort.key);if(x==null)return y==null?0:1;if(y==null)return -1;const c=typeof x==="number"&&typeof y==="number"?x-y:String(x).localeCompare(String(y));return sort.desc?-c:c}),[teams,league,division,search,sort,mode]);
 const display=(t:Team,k:Sort)=>{const v=metric(t,k);if(v==null)return "—";if(typeof v==="string")return v;if(k==="pct")return (v*100).toFixed(1)+"%";if(["runsScored","runsAllowed","diff"].includes(k))return v.toFixed(mode==="totals"?0:2);return v.toLocaleString()};
 return <main className="space-y-5 pb-16 text-white"><section className="glass rounded-3xl p-6 text-center"><h1 className="mb-6 text-3xl font-black neon-text sm:text-5xl">MLB Teams</h1>
 <div className="flex flex-wrap justify-center gap-2">{(["current","last"] as const).map(s=><button key={s} className={button(season===s,"season")} onClick={()=>setSeason(s)}>{s==="current"?"Current Season":"Last Season"}</button>)}</div>
 <div className="mt-3 flex justify-center gap-2">{(["perGame","totals"] as const).map(m=><button key={m} className={button(mode===m,"mode")} onClick={()=>setMode(m)}>{m==="perGame"?"Per Game":"Totals"}</button>)}</div>
 <div className="mt-3 flex justify-center gap-2">{["ALL","AL","NL"].map(l=><button key={l} className={button(league===l,"league")} onClick={()=>{setLeague(l);setDivision("ALL")}}>{l}</button>)}</div>
 <div className="mt-3 flex flex-wrap justify-center gap-2">{["ALL","East","Central","West"].map(d=><button key={d} className={button(division===d,"division")} onClick={()=>setDivision(d)}>{d==="ALL"?"All Divisions":d}</button>)}</div>
 <label className="relative mx-auto mt-5 block w-full max-w-[360px]"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team..." aria-label="Search MLB teams" className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"/></label>
 </section><section className="glass rounded-3xl p-5">{loading?<p className="py-8 text-center text-slate-400">Loading MLB team standings…</p>:error?<p className="py-8 text-center text-amber-200">{error}</p>:<div className="overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead><tr className="border-b border-white/10">{columns.map(([key,label])=><th key={key} className="px-3 py-4 text-left"><button className="whitespace-nowrap font-black uppercase text-slate-300 hover:text-cyan-200" onClick={()=>setSort(s=>({key,desc:s.key===key?!s.desc:!["name","league","division"].includes(key)}))}>{label}{sort.key===key?(sort.desc?" ▼":" ▲"):" ↕"}</button></th>)}</tr></thead><tbody>{rows.map(t=><tr key={t.id} className="border-b border-white/5 hover:bg-white/5">{columns.map(([key])=><td key={key} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-200">{key==="name"?<div className="flex items-center gap-3"><img src={`https://www.mlbstatic.com/team-logos/${t.id}.svg`} width={32} height={32} alt="" className="h-8 w-8 object-contain"/>{t.name}</div>:display(t,key)}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="py-8 text-center text-slate-400">No teams match your filters.</p>}</div>}</section></main>
}
