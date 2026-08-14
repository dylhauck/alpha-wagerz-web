import { CloudSun, Wind } from "lucide-react";

type Props = {
  weather?: Record<string, any>;
};

function getWeatherScore(weather?: Record<string, any>) {
  const wind = String(weather?.wind_direction || "").toUpperCase();
  const speed = Number(weather?.wind_speed || 0);
  const temp = Number(weather?.temperature || 0);

  if (wind.includes("IN")) return "Suppressed";
  if (wind.includes("OUT") && (speed >= 6 || temp >= 85)) return "Elite";

  // Matches the Weather Dashboard logic.
  if (wind.includes("OUT")) return "Elite";

  return "Neutral";
}

export function WeatherBadge({ weather }: Props) {
  if (!weather) {
    return (
      <div className="rounded-2xl border border-slate-400/10 bg-slate-400/10 px-3 py-2 text-xs text-slate-400">
        Weather unavailable
      </div>
    );
  }

  const environment = getWeatherScore(weather);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-cyan-100">
          <CloudSun size={14} />
          Temp
        </div>

        <div className="mt-1 text-lg font-black text-white">
          {weather.temperature ?? "—"}°
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-pink-300/15 bg-pink-300/10 px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-pink-100">
          <Wind size={14} />
          Wind
        </div>

        <div className="mt-1 text-sm font-black text-white">
          {weather.wind_direction || "Neutral"}
        </div>

        <div className="text-xs text-slate-400">
          {weather.wind_speed ?? "—"} mph
        </div>
      </div>

      <div
        className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-2 text-center ${
          environment === "Elite"
            ? "border-emerald-300/20 bg-emerald-500/10"
            : environment === "Suppressed"
            ? "border-rose-300/20 bg-rose-500/10"
            : environment === "Neutral"
            ? "border-cyan-300/20 bg-cyan-300/10"
            : "border-amber-300/20 bg-amber-500/10"
        }`}
      >
        <div className="text-xs font-bold text-slate-400">
          HR Environment
        </div>

        <div
          className={`mt-2 whitespace-nowrap text-center text-base font-black uppercase ${
            environment === "Elite"
              ? "text-emerald-300"
              : environment === "Suppressed"
              ? "text-rose-300"
              : environment === "Neutral"
              ? "text-cyan-300"
              : "text-amber-300"
          }`}
        >
          {environment}
        </div>
      </div>
    </div>
  );
}