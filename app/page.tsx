import { AppShell } from "@/components/AppShell";
import { GameTicker } from "@/components/games/GameTicker";
import { SelectedGameDashboard } from "@/components/games/SelectedGameDashboard";
import { getAllGames } from "@/lib/data/modelData";
import Image from "next/image";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ game?: string }>;
}) {
  const params = await searchParams;
  const games = getAllGames();

  const selectedGame =
    games.find((game) => String(game.game_id) === String(params?.game)) || games[0];

  return (
    <AppShell>
      <GameTicker games={games} selectedGameId={selectedGame?.game_id} />

      {selectedGame ? (
        <SelectedGameDashboard game={selectedGame} />
      ) : (
        <div className="glass rounded-3xl p-8 text-slate-300">
          No games loaded. Run the Alpha Wagerz model and publish all_games.json.
        </div>
      )}
    </AppShell>
  );
}