import { NextResponse } from "next/server";
import { getAllGames } from "@/lib/data/modelData";

export async function GET() {
  return NextResponse.json({
    games: getAllGames(),
  });
}