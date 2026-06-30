import { GameCard } from "./GameCard";

type Props = {
  games: Record<string, any>[];
};

export function TodaySlateGrid({ games }: Props) {
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Today’s Slate</h2>
          <p className="text-sm text-slate-400">
            Every game with top 2 HR targets per team.
          </p>
        </div>

        <div className="rounded-full border border-pink-300/20 bg-pink-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-pink-100">
          {games.length} games
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.game_id || game.game} game={game} />
        ))}
      </div>
    </section>
  );
}