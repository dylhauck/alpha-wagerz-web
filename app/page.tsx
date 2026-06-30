import { Activity, Flame, ShieldAlert, Wind } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HitterTable } from "@/components/HitterTable";
import { TodaySlateGrid } from "@/components/games/TodaySlateGrid";
import { getAllGames, getAllPitchers, getTopHitters } from "@/lib/data/modelData";

export default function Home() {
  const hitters = getTopHitters(75);
  const games = getAllGames();
  const pitchers = getAllPitchers();

  const eliteHitters = hitters.filter((h) => Number(h.Likely || 0) >= 75).length;
  const weatherBoosts = games.filter((g) => Number(g.weather?.wind_speed || 0) >= 8).length;
  const pitcherRiskSpots = pitchers.filter((p) => Number(p["HR Vulnerability"] || 0) >= 60).length;

  const cards = [
    {
      label: "Elite HR Targets",
      value: eliteHitters,
      sub: "Likely score 75+",
      icon: Flame,
    },
    {
      label: "Weather Boosts",
      value: weatherBoosts,
      sub: "Wind / temp positive",
      icon: Wind,
    },
    {
      label: "Pitcher Risk Spots",
      value: pitcherRiskSpots,
      sub: "HR vulnerability elevated",
      icon: ShieldAlert,
    },
    {
      label: "Games Loaded",
      value: games.length,
      sub: "Today’s MLB slate",
      icon: Activity,
    },
  ];

  return (
    <AppShell>
      <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 text-xs font-black uppercase tracking-[0.32em] text-cyan-200/70">
            Alpha Wagerz Analytics
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            <span className="neon-text">Model Dashboard</span>
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Premium baseball matchup terminal powered by your live Alpha Wagerz v1 statistical engine.
          </p>
        </div>

        <div className="rounded-2xl border border-pink-300/20 bg-pink-500/10 px-5 py-3 text-sm font-black text-pink-100">
          FOLLOW THE ALPHA
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass rounded-3xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-400">{card.label}</div>
                  <div className="mt-2 text-4xl font-black text-white">{card.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-200/60">
                    {card.sub}
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <HitterTable hitters={hitters} />

      <TodaySlateGrid games={games} />
    </AppShell>
  );
}