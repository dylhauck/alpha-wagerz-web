import {NextResponse} from "next/server";
export const revalidate=3600;
type Raw=Record<string,any>;
export async function GET(request:Request){
 const url=new URL(request.url);
 const season=Number(url.searchParams.get("season"));
 const current=new Date().getUTCFullYear();
 if(!Number.isInteger(season)||season<2020||season>current)return NextResponse.json({error:"Invalid season"},{status:400});
 try{
  const res=await fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason`,{next:{revalidate:3600}});
  if(!res.ok)throw Error("MLB standings unavailable");
  const json=await res.json();
  const splitRecord=(r:Raw,kind:"division"|"league")=>{
   const splits:Array<Raw>=r.records?.splitRecords??[];
   const entry=splits.find(x=>{
    const type=String(x.type??"").toLowerCase().replace(/[.\s_-]/g,"");
    return kind==="division"?["vsdiv","vsdivision","division"].includes(type):["vsleague","league"].includes(type);
   });
   return entry?.wins!=null&&entry?.losses!=null?`${entry.wins}-${entry.losses}`:null;
  };
  const teams=(json.records||[]).flatMap((division:Raw)=>(division.teamRecords||[]).map((r:Raw)=>({
   id:r.team?.id,name:r.team?.name,divisionId:division.division?.id,
   wins:r.wins,losses:r.losses,gamesPlayed:r.gamesPlayed,
   runsScored:r.runsScored,runsAllowed:r.runsAllowed,
   pct:r.winningPercentage,streak:r.streak?.streakCode??"—",divisionRank:r.divisionRank??null,leagueRank:r.leagueRank??null,sportRank:r.sportRank??null,home:r.records?.splitRecords?.find((x:Raw)=>x.type==="home")?.wins!=null?`${r.records.splitRecords.find((x:Raw)=>x.type==="home").wins}-${r.records.splitRecords.find((x:Raw)=>x.type==="home").losses}`:null,away:r.records?.splitRecords?.find((x:Raw)=>x.type==="away")?.wins!=null?`${r.records.splitRecords.find((x:Raw)=>x.type==="away").wins}-${r.records.splitRecords.find((x:Raw)=>x.type==="away").losses}`:null,divisionRecord:splitRecord(r,"division"),leagueRecord:splitRecord(r,"league")
  }))).filter((t:Raw)=>t.id&&t.name);
  // MLB standings responses do not consistently include a division split.
  // Calculate it from completed regular-season games when absent.
  if(teams.some((t:Raw)=>!t.divisionRecord)){
   try{
    const scheduleRes=await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=${season}&gameType=R`,{next:{revalidate:3600}});
    if(scheduleRes.ok){
     const schedule=await scheduleRes.json();
     const divisionByTeam=new Map<number,number>(teams.map((t:Raw)=>[Number(t.id),Number(t.divisionId)]));
     const splits=new Map<number,{wins:number;losses:number}>();
     for(const day of schedule.dates??[])for(const game of day.games??[]){
      if(game.status?.abstractGameState!=="Final")continue;
      const home=game.teams?.home,away=game.teams?.away;
      const h=Number(home?.team?.id),v=Number(away?.team?.id);
      if(!divisionByTeam.has(h)||divisionByTeam.get(h)!==divisionByTeam.get(v))continue;
      const hs=Number(home?.score),vs=Number(away?.score);
      if(!Number.isFinite(hs)||!Number.isFinite(vs)||hs===vs)continue;
      for(const [id,won] of [[h,hs>vs],[v,vs>hs]] as [number,boolean][]){
       const row=splits.get(id)??{wins:0,losses:0};
       if(won)row.wins++;else row.losses++;
       splits.set(id,row);
      }
     }
     for(const t of teams){
      if(t.divisionRecord)continue;
      const split=splits.get(Number(t.id));
      if(split)t.divisionRecord=`${split.wins}-${split.losses}`;
     }
    }
   }catch{/* Preserve standings even if schedule splits are unavailable. */}
  }
  return NextResponse.json({season,teams});
 }catch{return NextResponse.json({error:"MLB standings could not be loaded"},{status:502});}
}
