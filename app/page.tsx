import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { GameTicker } from "@/components/games/GameTicker";
import { SelectedGameDashboard } from "@/components/games/SelectedGameDashboard";
import { getAllGames } from "@/lib/data/modelData";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ game?: string }>;
}) {
  const params = await searchParams;
  const games = getAllGames();

  const selectedGame =
    games.find((game) => String(game.game_id) === String(params?.game)) || games[0];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppShell>
      <div className="mb-3 pt-8 flex flex-col items-center">
  <div className="flex h-[92px] w-full items-center justify-center overflow-hidden">
    <Image
      src="/follow-alpha.png"
      alt="Follow The Alpha"
      width={640}
      height={180}
      priority
      className="h-auto w-[560px] max-w-full object-contain"
    />
  </div>

  <div className="-mt-2 text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
    {today}
  </div>

  <div className="mt-3 w-full">
    <GameTicker games={games} selectedGameId={selectedGame?.game_id} />
  </div>
</div>

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