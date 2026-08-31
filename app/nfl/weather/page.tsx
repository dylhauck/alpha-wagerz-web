"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type WeatherGame = {
  game_id?: string;
  away_team?: string;
  home_team?: string;
  venue?: string;
  roof?: string;
  available?: boolean;
  temperature?: number;
  apparent_temperature?: number;
  relative_humidity?: number;
  precipitation_probability?: number;
  precipitation?: number;
  wind_speed?: number;
  wind_gusts?: number;
  weather_description?: string;
  conditions?: string;
  classification?: string;
  severity_score?: number;
  context?: {
    passing_factor?: number;
    rushing_factor?: number;
    scoring_factor?: number;
    kicking_factor?: number;
    classification?: string;
    severity_score?: number;
  };
};

function getGames(payload: any): WeatherGame[] {
  if (Array.isArray(payload)) return payload;

  for (const key of ["games", "weather", "data"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

function fmt(value: unknown, digits = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

function factorText(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  const delta = (n - 1) * 100;

  if (Math.abs(delta) < 0.05) return "Neutral";

  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

function classification(game: WeatherGame) {
  return (
    game.classification ||
    game.context?.classification ||
    "Neutral"
  );
}

export default function NFLWeatherPage() {
  const [view, setView] = useState<"current" | "next">("current");
  const [games, setGames] = useState<WeatherGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);

      const path =
        view === "current"
          ? "/data/nfl/weather.json"
          : "/data/nfl/next/weather.json";

      try {
        const res = await fetch(path, { cache: "no-store" });
        const payload = res.ok ? await res.json() : {};

        if (!cancelled) {
          setGames(getGames(payload));
        }
      } catch {
        if (!cancelled) setGames([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [view]);

  const sortedGames = useMemo(
    () =>
      [...games].sort(
        (a, b) =>
          Number(
            b.severity_score ??
              b.context?.severity_score ??
              0,
          ) -
          Number(
            a.severity_score ??
              a.context?.severity_score ??
              0,
          ),
      ),
    [games],
  );

  return (
    <AppShell>
      <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Alpha Wagerz NFL
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Weather Report
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Stadium and forecast conditions feeding the independent NFL projection models.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
              {(["current", "next"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    view === option
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option === "current" ? "Current Slate" : "Next Slate"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-slate-400">
              Loading weather data…
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-slate-400">
              No weather file is available for this slate yet.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {sortedGames.map((game, index) => {
                const context = game.context || {};

                return (
                  <article
                    key={game.game_id || `${game.away_team}-${game.home_team}-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
                      <div className="flex items-center gap-3">
                        <NFLTeamLogo team={game.away_team || ""} size={38} />
                        <span className="font-black">{game.away_team || "AWAY"}</span>
                        <span className="text-slate-600">@</span>
                        <NFLTeamLogo team={game.home_team || ""} size={38} />
                        <span className="font-black">{game.home_team || "HOME"}</span>
                      </div>

                      <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-300">
                        {classification(game)}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-5 text-sm text-slate-400">
                        {game.venue || "Venue unavailable"} · {game.roof || "Roof unknown"}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Metric label="Temperature" value={`${fmt(game.temperature)}°F`} />
                        <Metric label="Feels Like" value={`${fmt(game.apparent_temperature)}°F`} />
                        <Metric label="Humidity" value={`${fmt(game.relative_humidity, 0)}%`} />
                        <Metric label="Precip Chance" value={`${fmt(game.precipitation_probability, 0)}%`} />
                        <Metric label="Wind" value={`${fmt(game.wind_speed)} mph`} />
                        <Metric label="Gusts" value={`${fmt(game.wind_gusts)} mph`} />
                        <Metric
                          label="Severity"
                          value={fmt(game.severity_score ?? context.severity_score, 2)}
                        />
                        <Metric
                          label="Conditions"
                          value={game.weather_description || game.conditions || "—"}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Factor label="Passing" value={factorText(context.passing_factor)} />
                        <Factor label="Rushing" value={factorText(context.rushing_factor)} />
                        <Factor label="Scoring" value={factorText(context.scoring_factor)} />
                        <Factor label="Kicking" value={factorText(context.kicking_factor)} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/80 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-extrabold text-slate-100">
        {value}
      </div>
    </div>
  );
}

function Factor({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label} Factor
      </div>
      <div className="mt-1 text-sm font-extrabold">{value}</div>
    </div>
  );
}
