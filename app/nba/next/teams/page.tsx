"use client";

import dynamic from "next/dynamic";
import FutureNBAData from "@/components/nba/FutureNBAData";

const OriginalNBATeamsPage = dynamic(
  () => import("@/app/nba/teams/page"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function NBAFutureTeamsPage() {
  return (
    <FutureNBAData>
      <OriginalNBATeamsPage />
    </FutureNBAData>
  );
}