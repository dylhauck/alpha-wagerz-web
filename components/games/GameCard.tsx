import { MapPin } from "lucide-react";
import { getGameTopTargets } from "@/lib/data/gameTargets";
import { GameTargetList } from "./GameTargetList";
import { WeatherBadge } from "@/components/weather/WeatherBadge";

type Props = {
  game: Record<string, any>;
};

export function GameCard({ game }: Props) {
  const targets = getGameTopTargets(game);

  return (
    <article className="glass rounded-3xl p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="text-lg font-black text-white">{game.game}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <MapPin size={13} />
            {game.venue || "Venue TBD"}
          </div>
        </div>

        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
          {game.status || "Scheduled"}
        </div>
      </div>

      <WeatherBadge weather={game.weather} />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <GameTargetList team={game.away_team} targets={targets.away} />
        <GameTargetList team={game.home_team} targets={targets.home} />
      </div>
    </article>
  );
}