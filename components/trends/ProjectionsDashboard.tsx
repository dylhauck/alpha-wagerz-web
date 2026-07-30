"use client";

import { useEffect, useMemo, useState } from "react";
import { GameProjectionCard } from "./GameProjectionCard";
import { GameSelector } from "@/components/games/GameSelector";

type Projection = Record<string, any>;

function timeToMinutes(value: unknown) {
  const time = String(value || "").trim();

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  return hour * 60 + minute;
}

export function ProjectionsDashboard({
  projections,
  slateLabel = "Today's Slate",
}: {
  projections: Projection[];
  slateLabel?: string;
}) {
  const sortedProjections = useMemo(() => {
    return [...projections].sort((a, b) => {
      return (
        timeToMinutes(a.game_time) -
        timeToMinutes(b.game_time)
      );
    });
  }, [projections]);

  const [selectedId, setSelectedId] = useState("");

  const slateKey = useMemo(() => {
    return sortedProjections
      .map((projection) => String(projection.game_id))
      .join("-");
  }, [sortedProjections]);

  useEffect(() => {
    if (!sortedProjections.length) {
      setSelectedId("");
      return;
    }

    setSelectedId(String(sortedProjections[0].game_id));
  }, [slateKey, sortedProjections]);

  const selectedProjection = useMemo(() => {
    return (
      sortedProjections.find(
        (projection) =>
          String(projection.game_id) === String(selectedId)
      ) || sortedProjections[0]
    );
  }, [sortedProjections, selectedId]);

  if (!sortedProjections.length) {
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
          {`${sortedProjections.length} ALPHA PROJECTIONS LOADED FOR ${slateLabel.toUpperCase()}`}
        </div>
      </div>

      <GameSelector
        games={sortedProjections}
        selectedGameId={selectedId}
        onSelect={setSelectedId}
      />

      <GameProjectionCard projection={selectedProjection} />
    </section>
  );
}