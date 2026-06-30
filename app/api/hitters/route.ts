import { NextResponse } from "next/server";
import { getTopHitters } from "@/lib/data/modelData";

export async function GET() {
  return NextResponse.json({
    hitters: getTopHitters(100),
  });
}