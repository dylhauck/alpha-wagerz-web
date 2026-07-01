import Link from "next/link";
import { TeamLogo } from "@/components/TeamLogo";

function LogoGlow({ team }: { team: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-xl bg-white/35 blur-xl" />

      {/* Glass puck */}
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/35 bg-white/30 shadow-[0_0_20px_rgba(255,255,255,0.25),inset_0_1px_2px_rgba(255,255,255,0.45)] backdrop-blur-md">
        <TeamLogo team={team} size={28} />
      </div>
    </div>
  );
}

export function GameTicker({
  games,
  selectedGameId,
}: {
  games: Record<string, any>[];
  selectedGameId?: string;
}) {
  return (
    <div className="mb-4">
      <div className="table-scroll">
        <div className="flex min-w-max gap-2">
          {games.map((game) => {
            const active = String(game.game_id) === String(selectedGameId);

            return (
              <Link
                key={game.game_id}
                href={`/?game=${game.game_id}`}
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

                <div className="mt-2 text-center text-xs font-bold text-white">
                  {game.game_time || game.start_time || "Scheduled"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}