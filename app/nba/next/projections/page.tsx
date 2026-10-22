"use client";

import dynamic from "next/dynamic";
import FutureNBAData from "@/components/nba/FutureNBAData";

const OriginalNBAProjectionsPage = dynamic(
  () => import("@/app/nba/projections/page"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function NBAFutureProjectionsPage() {
  return (
    <FutureNBAData>
      <OriginalNBAProjectionsPage />
    </FutureNBAData>
  );
}