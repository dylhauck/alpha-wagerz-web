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
  return NextResponse.json({season,teams});
 }catch{return NextResponse.json({error:"MLB standings could not be loaded"},{status:502});}
}
