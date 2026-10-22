"use client";

import dynamic from "next/dynamic";
import FutureNBAData from "@/components/nba/FutureNBAData";

const OriginalNBAInjuriesPage = dynamic(
  () => import("@/app/nba/injuries/page"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function NBAFutureInjuriesPage() {
  return (
    <FutureNBAData>
      <OriginalNBAInjuriesPage />
    </FutureNBAData>
  );
}