import { NextResponse } from "next/server";
export const revalidate = 3600;
export async function GET(request: Request) {
 const season = new URL(request.url).searchParams.get("season");
 if (season !== "current" && season !== "last") return NextResponse.json({error:"Invalid season"},{status:400});
 const now = new Date();
 const startYear = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear()-1;
 const date = season === "last" ? `${startYear}-06-30` : now.toISOString().slice(0,10);
 try {
  const response = await fetch(`https://api-web.nhle.com/v1/standings/${date}`, {next:{revalidate:3600}});
  if (!response.ok) throw new Error("NHL standings unavailable");
  const data = await response.json();
  const label = (v:unknown):string => typeof v === "string" ? v : v && typeof v === "object" && "default" in v ? String((v as {default:unknown}).default) : "";
  const teams = (data.standings || []).map((t:Record<string,unknown>)=>({
   team:label(t.teamAbbrev).toUpperCase(),games:Number(t.gamesPlayed),wins:Number(t.wins),
   losses:Number(t.losses),ot_losses:Number(t.otLosses),points:Number(t.points),
   goals_for:Number(t.goalFor),goals_against:Number(t.goalAgainst)
  })).filter((t:{team:string;games:number})=>t.team&&Number.isFinite(t.games));
  if (!teams.length) throw new Error("No standings");
  return NextResponse.json({teams});
 } catch {return NextResponse.json({error:"NHL standings unavailable"},{status:502});}
}