"use client";

import dynamic from "next/dynamic";
import FutureNBAData from "@/components/nba/FutureNBAData";

const OriginalNBAPage = dynamic(
  () => import("@/app/nba/page"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function NBAFuturePage() {
  return (
    <FutureNBAData>
      <OriginalNBAPage />
    </FutureNBAData>
  );
}