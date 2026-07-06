"use client";

import { useMemo, useState } from "react";
import { GameProjectionCard } from "./GameProjectionCard";
import { GameSelector } from "@/components/games/GameSelector";

type Projection = Record<string, any>;

export function ProjectionsDashboard({
  projections,
}: {
  projections: Projection[];
}) {
  const [selectedId, setSelectedId] = useState(
    String(projections[0]?.game_id || "")
  );

  const selectedProjection = useMemo(() => {
    return (
      projections.find(
        (projection) => String(projection.game_id) === String(selectedId)
      ) || projections[0]
    );
  }, [projections, selectedId]);

  if (!projections.length) {
    return (
      <section className="glass rounded-3xl p-6 text-center text-slate-400">
        No projections loaded.
      </section>
    );
  }

  return (
    <section className="glass rounded-3xl p-4">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {`${projections.length} ALPHA PROJECTIONS LOADED FOR TODAY'S SLATE`}
        </div>
      </div>

      <GameSelector
        games={projections}
        selectedGameId={selectedId}
        onSelect={setSelectedId}
      />

      <GameProjectionCard projection={selectedProjection} />
    </section>
  );
}