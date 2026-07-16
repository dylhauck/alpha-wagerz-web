import Link from "next/link";
import { TeamLogo } from "@/components/TeamLogo";

function LogoGlow({ team }: { team: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-white/50 blur-xl" />

      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]">
        <TeamLogo team={team} size={28} />
      </div>
    </div>
  );
}

function sortValue(game: Record<string, any>) {
  return game.game_time_sort || "99:99";
}

export function GameTicker({
  games,
  selectedGameId,
  basePath = "/",
}: {
  games: Record<string, any>[];
  selectedGameId?: string | number;
  basePath?: string;
}) {
  const sortedGames = [...games].sort((a, b) =>
    sortValue(a).localeCompare(sortValue(b))
  );

  return (
    <div className="mb-4">
      <div className="table-scroll mt-2 pb-2">
        <div className="flex min-w-max gap-2">
          {sortedGames.map((game) => {
            const active = String(game.game_id) === String(selectedGameId);

            return (
              <Link
                key={game.game_id}
                href={`${basePath}?game=${game.game_id}`}
                className={`min-w-[150px] rounded-xl border bg-slate-950/80 px-3 py-2 transition ${
                  active
                    ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]"
                    : "border-white/10 bg-white/[0.035] hover:border-pink-300/40"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogoGlow team={game.away_team} />
                  <span className="text-xs font-black text-slate-400">@</span>
                  <LogoGlow team={game.home_team} />
                </div>

                <div className="mt-2 text-center text-sm font-black tracking-wide text-white">
                  {game.game_time || "--:--"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}