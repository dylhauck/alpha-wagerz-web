"use client";

import dynamic from "next/dynamic";
import FutureNBAData from "@/components/nba/FutureNBAData";

const OriginalNBAPlayersPage = dynamic(
  () => import("@/app/nba/players/page"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function NBAFuturePlayersPage() {
  return (
    <FutureNBAData>
      <OriginalNBAPlayersPage />
    </FutureNBAData>
  );
}