import { AppShell } from "@/components/AppShell";
import { getAllGames } from "@/lib/data/modelData";
import { WeatherBadge } from "@/components/weather/WeatherBadge";

export default function WeatherPage() {
  const games = getAllGames();

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200/70">
          Weather Center
        </div>
        <h1 className="mt-2 text-5xl font-black neon-text">Weather Edge</h1>
        <p className="mt-3 text-slate-400">
          Wind, temperature, roof status and HR environment by park.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {games.map((game) => (
          <div key={game.game_id || game.game} className="glass rounded-3xl p-5">
            <div className="mb-4">
              <div className="text-lg font-black text-white">{game.game}</div>
              <div className="text-sm text-slate-400">{game.venue}</div>
            </div>

            <WeatherBadge weather={game.weather} />

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
              <div>Conditions: {game.weather?.conditions || "—"}</div>
              <div>Humidity: {game.weather?.humidity || "—"}%</div>
              <div>Roof: {game.weather?.roof || game.roof || "open"}</div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}