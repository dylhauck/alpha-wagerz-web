import { AppShell } from "@/components/AppShell";
import { TodaySlateGrid } from "@/components/games/TodaySlateGrid";
import { getAllGames } from "@/lib/data/modelData";

export default function GamesPage() {
  const games = getAllGames();

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200/70">
          Today’s MLB Slate
        </div>
        <h1 className="mt-2 text-5xl font-black neon-text">Game Cards</h1>
        <p className="mt-3 text-slate-400">
          Every game with top 2 HR targets per team, weather, venue and model context.
        </p>
      </div>

      <TodaySlateGrid games={games} />
    </AppShell>
  );
}