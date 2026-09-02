"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CloudRain,
  Droplets,
  Gauge,
  MapPin,
  Thermometer,
  Wind,
} from "lucide-react";

import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type NFLTeam = {
  abbr?: string;
  name?: string;
  logo?: string;
};

type WeatherDetails = {
  forecast_time?: string;
  temperature_f?: number;
  feels_like_f?: number;
  humidity_pct?: number;
  precip_probability_pct?: number;
  precipitation_in?: number;
  wind_mph?: number;
  wind_gust_mph?: number;
  weather_code?: number;
  conditions?: string;
};

type WeatherContext = {
  severity_score?: number;
  passing_factor?: number;
  rushing_factor?: number;
  scoring_factor?: number;
  kicking_factor?: number;
  classification?: string;
};

type WeatherGame = {
  game_id?: string;
  away_team?: string;
  home_team?: string;

  stadium?: string;
  latitude?: number;
  longitude?: number;

  roof?: string;
  kickoff?: string;
  available?: boolean;

  weather?: WeatherDetails;
  context?: WeatherContext;
};

function getGames(
  payload: unknown,
): WeatherGame[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object"
  ) {
    const record =
      payload as Record<string, unknown>;

    for (const key of [
      "games",
      "weather",
      "data",
    ]) {
      if (Array.isArray(record[key])) {
        return record[
          key
        ] as WeatherGame[];
      }
    }
  }

  return [];
}

function fmt(
  value: unknown,
  digits = 1,
) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  return numeric.toFixed(digits);
}

function factorText(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "—";
  }

  const delta =
    (numeric - 1) * 100;

  if (Math.abs(delta) < 0.05) {
    return "Neutral";
  }

  return `${
    delta > 0 ? "+" : ""
  }${delta.toFixed(1)}%`;
}

function classification(
  game: WeatherGame,
) {
  return (
    game.context?.classification ||
    "NEUTRAL"
  );
}

function formatRoof(value?: string) {
  if (!value) {
    return "Roof unknown";
  }

  const normalized =
    value.toLowerCase();

  if (
    normalized === "outdoor" ||
    normalized === "outdoors"
  ) {
    return "Outdoor";
  }

  if (
    normalized === "closed" ||
    normalized === "dome"
  ) {
    return "Closed Roof";
  }

  if (
    normalized === "open"
  ) {
    return "Open Roof";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
      </div>

      <div className="mt-2 text-lg font-black text-white">
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
    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200/60">
        {label} Factor
      </div>

      <div className="mt-2 text-base font-black text-white">
        {value}
      </div>
    </div>
  );
}

function NFLLogoGlow({
  team,
  teams,
}: {
  team: string;
  teams: NFLTeam[];
}) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-white/50 blur-xl" />

      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 bg-white/45 shadow-[0_0_24px_rgba(255,255,255,0.35)]">
        <NFLTeamLogo
          team={team}
          teams={teams}
          size={28}
        />
      </div>
    </div>
  );
}

function GameTickerCard({
  game,
  index,
  teams,
  active,
  onClick,
}: {
  game: WeatherGame;
  index: number;
  teams: NFLTeam[];
  active: boolean;
  onClick: () => void;
}) {
  const away =
    game.away_team || "AWAY";

  const home =
    game.home_team || "HOME";

  const kickoff = game.kickoff
    ? new Date(game.kickoff).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        },
      )
    : "TBD";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[150px] rounded-xl border bg-slate-950/80 px-3 py-2 transition ${
        active
          ? "border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_20px_rgba(35,216,255,0.25)]"
          : "border-white/10 bg-white/[0.035] hover:border-pink-300/40"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <NFLLogoGlow
          team={away}
          teams={teams}
        />

        <span className="text-xs font-black text-slate-400">
          @
        </span>

        <NFLLogoGlow
          team={home}
          teams={teams}
        />
      </div>

      <div className="mt-2 text-center text-sm font-black tracking-wide text-white">
        {kickoff}
      </div>
    </button>
  );
}

function WeatherReportCard({
  game,
  index,
  teams,
}: {
  game: WeatherGame;
  index: number;
  teams: NFLTeam[];
}) {
  const weather =
    game.weather || {};

  const context =
    game.context || {};

  const away =
    game.away_team || "AWAY";

  const home =
    game.home_team || "HOME";

  const weatherAvailable =
    game.available !== false &&
    Boolean(game.weather);

  return (
    <article
      key={
        game.game_id ||
        `${away}-${home}-${index}`
      }
      className="glass w-full overflow-hidden rounded-3xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <NFLTeamLogo
              team={away}
              teams={teams}
              size={42}
            />

            <span className="text-lg font-black text-white">
              {away}
            </span>
          </div>

          <span className="text-sm font-black text-slate-500">
            @
          </span>

          <div className="flex items-center gap-2">
            <NFLTeamLogo
              team={home}
              teams={teams}
              size={42}
            />

            <span className="text-lg font-black text-white">
              {home}
            </span>
          </div>
        </div>

        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
          {classification(game)}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-400">
          <span className="flex items-center gap-2">
            <MapPin size={15} />

            {game.stadium ||
              "Stadium unavailable"}
          </span>

          <span>
            {formatRoof(game.roof)}
          </span>

          {!weatherAvailable ? (
            <span className="text-amber-300">
              Forecast unavailable
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Metric
            label="Temperature"
            value={
              weatherAvailable
                ? `${fmt(
                    weather.temperature_f,
                  )}°F`
                : "—"
            }
            icon={
              <Thermometer
                size={14}
              />
            }
          />

          <Metric
            label="Feels Like"
            value={
              weatherAvailable
                ? `${fmt(
                    weather.feels_like_f,
                  )}°F`
                : "—"
            }
            icon={
              <Thermometer
                size={14}
              />
            }
          />

          <Metric
            label="Humidity"
            value={
              weatherAvailable
                ? `${fmt(
                    weather.humidity_pct,
                    0,
                  )}%`
                : "—"
            }
            icon={
              <Droplets size={14} />
            }
          />

          <Metric
            label="Precip Chance"
            value={
              weatherAvailable
                ? `${fmt(
                    weather.precip_probability_pct,
                    0,
                  )}%`
                : "—"
            }
            icon={
              <CloudRain size={14} />
            }
          />

          <Metric
            label="Wind"
            value={
              weatherAvailable
                ? `${fmt(
                    weather.wind_mph,
                  )} mph`
                : "—"
            }
            icon={<Wind size={14} />}
          />

          <Metric
            label="Gusts"
            value={
              weatherAvailable
                ? `${fmt(
                    weather.wind_gust_mph,
                  )} mph`
                : "—"
            }
            icon={<Wind size={14} />}
          />

          <Metric
            label="Severity"
            value={fmt(
              context.severity_score,
              2,
            )}
            icon={<Gauge size={14} />}
          />

          <Metric
            label="Conditions"
            value={
              weatherAvailable
                ? weather.conditions ||
                  "—"
                : "—"
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Factor
            label="Passing"
            value={factorText(
              context.passing_factor,
            )}
          />

          <Factor
            label="Rushing"
            value={factorText(
              context.rushing_factor,
            )}
          />

          <Factor
            label="Scoring"
            value={factorText(
              context.scoring_factor,
            )}
          />

          <Factor
            label="Kicking"
            value={factorText(
              context.kicking_factor,
            )}
          />
        </div>
      </div>
    </article>
  );
}

export default function NFLNextWeatherPage() {
  const [games, setGames] =
    useState<WeatherGame[]>([]);

  const [teams, setTeams] =
    useState<NFLTeam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedGameId, setSelectedGameId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      try {
        const response = await fetch(
          "/data/nfl/teams.json",
          {
            cache: "no-store",
          },
        );

        const payload =
          response.ok
            ? await response.json()
            : [];

        const teamList = Array.isArray(
          payload,
        )
          ? payload
          : Array.isArray(
                payload?.teams,
              )
            ? payload.teams
            : [];

        if (!cancelled) {
          setTeams(teamList);
        }
      } catch {
        if (!cancelled) {
          setTeams([]);
        }
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setLoading(true);

      try {
        const response =
          await fetch(
            "/data/nfl/next/weather.json",
            {
              cache: "no-store",
            },
          );

        const payload =
          response.ok
            ? await response.json()
            : {};

        if (!cancelled) {
          setGames(
            getGames(payload),
          );
        }
      } catch {
        if (!cancelled) {
          setGames([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedGames =
    useMemo(
      () =>
        [...games].sort(
          (a, b) =>
            Number(
              b.context
                ?.severity_score ??
                0,
            ) -
            Number(
              a.context
                ?.severity_score ??
                0,
            ),
        ),
      [games],
    );

  useEffect(() => {
    if (sortedGames.length === 0) {
      setSelectedGameId(null);
      return;
    }

    const currentStillExists =
      selectedGameId &&
      sortedGames.some(
        (game, index) =>
          (game.game_id ||
            `${game.away_team}-${game.home_team}-${index}`) ===
          selectedGameId,
      );

    if (!currentStillExists) {
      const first = sortedGames[0];
      setSelectedGameId(
        first.game_id ||
          `${first.away_team}-${first.home_team}-0`,
      );
    }
  }, [sortedGames, selectedGameId]);

  const selectedIndex = Math.max(
    0,
    sortedGames.findIndex(
      (game, index) =>
        (game.game_id ||
          `${game.away_team}-${game.home_team}-${index}`) ===
        selectedGameId,
    ),
  );

  const selectedGame =
    sortedGames[selectedIndex] || null;


  return (
    <div className="space-y-5">
      {!loading &&
      sortedGames.length > 0 ? (
        <div className="mb-4 flex justify-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            {sortedGames.length} Weather{" "}
            {sortedGames.length === 1
              ? "Report"
              : "Reports"}{" "}
            Loaded For Next Slate
          </div>
        </div>
      ) : null}

      {loading ? (
        <section className="glass rounded-3xl p-8 text-center text-slate-400">
          Loading NFL weather...
        </section>
      ) : sortedGames.length ===
        0 ? (
        <section className="glass rounded-3xl p-8 text-center">
          <div className="text-lg font-black text-white">
            No Weather Data
          </div>

          <div className="mt-2 text-sm text-slate-400">
            No weather file is
            available for this slate
            yet.
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <section className="glass rounded-3xl p-4">
            <div className="table-scroll mt-2 pb-2">
              <div className="flex min-w-max gap-2">
                {sortedGames.map(
                  (game, index) => {
                    const gameKey =
                      game.game_id ||
                      `${game.away_team}-${game.home_team}-${index}`;

                    return (
                      <GameTickerCard
                        key={gameKey}
                        game={game}
                        index={index}
                        teams={teams}
                        active={
                          gameKey ===
                          selectedGameId
                        }
                        onClick={() =>
                          setSelectedGameId(
                            gameKey,
                          )
                        }
                      />
                    );
                  },
                )}
              </div>
            </div>
          </section>

          {selectedGame ? (
            <WeatherReportCard
              game={selectedGame}
              index={selectedIndex}
              teams={teams}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
