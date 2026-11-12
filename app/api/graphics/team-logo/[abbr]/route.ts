import { NextRequest, NextResponse } from "next/server";

const espn: Record<string, string> = {
  ATL:"atl",BOS:"bos",BKN:"bkn",CHA:"cha",CHI:"chi",CLE:"cle",DAL:"dal",DEN:"den",DET:"det",GSW:"gs",
  HOU:"hou",IND:"ind",LAC:"lac",LAL:"lal",MEM:"mem",MIA:"mia",MIL:"mil",MIN:"min",NOP:"no",NYK:"ny",
  OKC:"okc",ORL:"orl",PHI:"phi",PHX:"phx",POR:"por",SAC:"sac",SAS:"sa",TOR:"tor",UTA:"utah",WAS:"wsh"
};

export async function GET(_request: NextRequest, context: { params: Promise<{ abbr: string }> }) {
  const { abbr } = await context.params;
  const id = espn[abbr.toUpperCase()];
  if (!id) return new NextResponse("Unknown team", { status: 404 });
  try {
    const response = await fetch(`https://a.espncdn.com/i/teamlogos/nba/500/${id}.png`, {
      next: { revalidate: 86400 }
    });
    if (!response.ok) return new NextResponse("Logo unavailable", { status: 502 });
    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" }
    });
  } catch {
    return new NextResponse("Logo unavailable", { status: 502 });
  }
}
