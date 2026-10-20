"use client";

import OriginalNBAPage from "@/app/nba/injuries/page";
import FutureNBAData from "@/components/nba/FutureNBAData";

export default function NBAFuturePage() {
  return (
    <FutureNBAData>
      <OriginalNBAPage />
    </FutureNBAData>
  );
}
