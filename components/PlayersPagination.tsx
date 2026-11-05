"use client";
type Props={page:number;totalPages:number;totalPlayers:number;onPageChange:(page:number)=>void;sport:string};
export default function PlayersPagination({page,totalPages,totalPlayers,onPageChange,sport}:Props){
 const first=totalPlayers===0?0:(page-1)*25+1;
 const last=Math.min(page*25,totalPlayers);
 const pages:(number|string)[]=totalPages<=7?Array.from({length:totalPages},(_,i)=>i+1):page<=4?[1,2,3,4,5,"…",totalPages]:page>=totalPages-3?[1,"…",...Array.from({length:5},(_,i)=>totalPages-4+i)]:[1,"…",page-1,page,page+1,"…",totalPages];
 return <nav aria-label={`${sport} players pagination`} className="flex flex-col items-center justify-between gap-4 border-t border-white/10 px-6 py-5 lg:flex-row">
 <div className="text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500 lg:text-left">Showing <span className="text-slate-300">{first}–{last}</span> of <span className="text-slate-300">{totalPlayers.toLocaleString()}</span> players</div>
 <div className="flex flex-wrap items-center justify-center gap-2"><button type="button" disabled={page===1} onClick={()=>onPageChange(Math.max(1,page-1))} className="rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">Previous</button>
 {pages.map((p,i)=>typeof p==="string"?<span key={`dots-${i}`} className="px-1 text-sm font-black text-slate-500">…</span>:<button key={p} type="button" aria-current={page===p?"page":undefined} onClick={()=>onPageChange(p)} className={`min-w-9 rounded-lg border px-3 py-2 text-xs font-black transition ${page===p?"border-cyan-300/60 bg-cyan-300/15 text-cyan-100":"border-white/10 bg-slate-950/50 text-slate-300 hover:border-cyan-300/40 hover:text-white"}`}>{p}</button>)}
 <button type="button" disabled={page===totalPages} onClick={()=>onPageChange(Math.min(totalPages,page+1))} className="rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">Next</button></div>
 <div className="text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500">Page <span className="text-slate-300">{page}</span> of <span className="text-slate-300">{totalPages}</span></div></nav>
}