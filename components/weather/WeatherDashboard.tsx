"use client";

import { useMemo, useState } from "react";
import { GameSelector } from "@/components/games/GameSelector";

function formatTemp(value: any) {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(1)}°`;
}

function formatWind(weather: any) {
  const direction = weather?.wind_direction || "—";
  const speed = Number(weather?.wind_speed || 0);
  return `${direction} ${speed.toFixed(1).replace(".0", "")} MPH`;
}

function getWeatherScore(weather: any) {
  const wind = String(weather?.wind_direction || "").toUpperCase();
  const speed = Number(weather?.wind_speed || 0);
  const temp = Number(weather?.temperature || 0);

  if (wind.includes("IN")) return "Suppression";
  if (wind.includes("OUT") && (speed >= 6 || temp >= 85)) return "Elite";
  if (wind.includes("OUT")) return "Positive";
  return "Neutral";
}

function arrowRotationDeg(windDirection: string) {
  const wind = String(windDirection || "").toUpperCase();

  if (wind.includes("OUT TOWARDS RF")) return 35;
  if (wind.includes("OUT TOWARDS LF")) return -35;
  if (wind.includes("OUT")) return 0;
  if (wind.includes("IN")) return 180;
  return 90;
}

function windLabel(windDirection: string) {
  const wind = String(windDirection || "").toUpperCase();

  if (wind.includes("OUT TOWARDS RF")) return "Out to RF";
  if (wind.includes("OUT TOWARDS LF")) return "Out to LF";
  if (wind.includes("OUT")) return "Out";
  if (wind.includes("IN")) return "In";
  return "Neutral";
}

function WindFieldVisual({ weather }: { weather: Record<string, any> }) {
  const rotation = arrowRotationDeg(weather.wind_direction);
  const speed = Number(weather.wind_speed || 0);

  return (
    <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.035] p-5 shadow-[0_0_30px_rgba(35,216,255,0.08)]">
      <div className="mb-3 text-center text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
        Wind Direction
      </div>

      <div className="relative mx-auto h-[360px] w-full max-w-[420px] overflow-visible">
        <svg viewBox="0 0 440 330" className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            <linearGradient id="grassGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(35,125,48,0.78)" />
              <stop offset="100%" stopColor="rgba(11,55,25,0.78)" />
            </linearGradient>

            <clipPath id="fieldClipFixed">
              <path d="M42 168 A178 178 0 0 1 398 168 L220 306 Z" />
            </clipPath>

            <filter id="purpleGlowFixed" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="greenGlowFixed" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform="translate(200 150) scale(0.82) translate(-200 -150)">
  {/* all field paths, grass, fence, foul lines, infield, bases, home plate */}
</g>

          <g clipPath="url(#fieldClipFixed)">
            <path d="M42 168 A178 178 0 0 1 398 168 L220 306 Z" fill="url(#grassGradient)" />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x={30 + i * 34}
                y="28"
                width="17"
                height="290"
                fill={i % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.055)"}
              />
            ))}
          </g>

          <path
            d="M42 168 A178 178 0 0 1 398 168"
            stroke="rgba(181,107,255,0.98)"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#purpleGlowFixed)"
          />
          <path
            d="M42 168 L220 306"
            stroke="rgba(181,107,255,0.92)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#purpleGlowFixed)"
          />
          <path
            d="M398 168 L220 306"
            stroke="rgba(181,107,255,0.92)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#purpleGlowFixed)"
          />

          <polygon points="220,120 290,190 220,260 150,190" fill="rgba(142,91,45,0.82)" />
          <polygon
            points="220,120 290,190 220,260 150,190"
            fill="none"
            stroke="rgba(181,107,255,0.98)"
            strokeWidth="5"
            strokeLinejoin="round"
            filter="url(#purpleGlowFixed)"
          />

          <circle
            cx="220"
            cy="190"
            r="16"
            fill="rgba(255,255,255,0.07)"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
          />
          <line
            x1="214"
            y1="190"
            x2="226"
            y2="190"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {[
            [220, 120],
            [290, 190],
            [220, 260],
            [150, 190],
          ].map(([x, y], i) => (
            <rect
              key={i}
              x={x - 8}
              y={y - 8}
              width="16"
              height="16"
              rx="2"
              transform={`rotate(45 ${x} ${y})`}
              fill="rgba(181,107,255,0.95)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              filter="url(#purpleGlowFixed)"
            />
          ))}

          <polygon
            points="207,275 233,275 233,293 220,305 207,293"
            fill="rgba(168,85,247,0.16)"
            stroke="rgba(181,107,255,0.98)"
            strokeWidth="4"
            filter="url(#purpleGlowFixed)"
          />

          <g transform={`translate(220 190) rotate(${rotation}) scale(0.48)`} filter="url(#greenGlowFixed)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-118"
              stroke="#16d99a"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <polygon points="0,-155 -28,-106 28,-106" fill="#16d99a" />
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Temp</div>
          <div className="mt-1 text-2xl font-black text-white">{formatTemp(weather.temperature)}</div>
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Wind</div>
          <div className="mt-1 text-2xl font-black text-emerald-300">{windLabel(weather.wind_direction)}</div>
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Speed</div>
          <div className="mt-1 text-2xl font-black text-white">{speed.toFixed(1).replace(".0", "")} MPH</div>
        </div>
      </div>
    </div>
  );
}

export function WeatherDashboard({ games }: { games: Record<string, any>[] }) {
  const [selectedId, setSelectedId] = useState(String(games[0]?.game_id || ""));

  const game = useMemo(() => {
    return games.find((g) => String(g.game_id) === selectedId) || games[0];
  }, [games, selectedId]);

  if (!games.length) {
    return <section className="glass rounded-3xl p-6 text-center text-slate-400">No weather loaded.</section>;
  }

  const weather = game.weather || {};
  const score = getWeatherScore(weather);

  return (
    <section className="glass rounded-3xl p-4">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {`${games.length} WEATHER REPORTS LOADED FOR TODAY'S SLATE`}
        </div>
      </div>

      <GameSelector games={games} selectedGameId={selectedId} onSelect={setSelectedId} />

      <div className="rounded-3xl border border-cyan-300/15 bg-white/[0.035] p-5">
        <div className="grid gap-6 xl:grid-cols-[1fr_450px] xl:items-stretch">
          <div>
            <div className="mb-4 text-center">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">Weather Edge</div>
              <h1 className="mx-auto mt-2 max-w-[1100px] pb-3 text-3xl font-black leading-[1.08] neon-text sm:text-5xl xl:text-6xl">
  {game.game}
</h1>
              <div className="mt-2 text-sm text-slate-400">{game.venue}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                <div className="text-xs font-black uppercase text-cyan-100">Temp</div>
                <div className="mt-1 text-2xl font-black text-white">{formatTemp(weather.temperature)}</div>
              </div>

              <div className="rounded-2xl border border-pink-300/15 bg-pink-300/10 p-4">
                <div className="text-xs font-black uppercase text-pink-100">Wind</div>
                <div className="mt-1 text-sm font-black uppercase text-white">{formatWind(weather)}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-xs font-black uppercase text-slate-400">Roof</div>
                <div className="mt-1 text-lg font-black uppercase text-white">{weather.roof || game.roof || "open"}</div>
              </div>

              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
                <div className="text-xs font-black uppercase text-yellow-200">HR Environment</div>
                <div className="mt-1 text-lg font-black text-white">{score}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#11182c] p-4 text-sm text-slate-300">
              <div>
                <span className="font-bold text-white">Conditions:</span> {weather.conditions || "—"}
              </div>
              <div>
                <span className="font-bold text-white">Humidity:</span> {weather.humidity || "—"}%
              </div>
              <div>
  <span className="font-bold text-white">Wind Degrees:</span>{" "}
  {weather.wind_degrees ?? weather.wind_deg ?? game.wind_degrees ?? game.wind_deg ?? "—"}
</div>
            </div>
          </div>

          <WindFieldVisual weather={weather} />
        </div>
      </div>
    </section>
  );
}
