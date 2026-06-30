import { CloudSun, Wind } from "lucide-react";
import { StatCell } from "@/components/StatCell";

type Props = {
  weather?: Record<string, any>;
};

export function WeatherBadge({ weather }: Props) {
  if (!weather) {
    return (
      <div className="rounded-2xl border border-slate-400/10 bg-slate-400/10 px-3 py-2 text-xs text-slate-400">
        Weather unavailable
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-100">
          <CloudSun size={14} />
          Temp
        </div>
        <div className="mt-1 text-lg font-black text-white">
          {weather.temperature ?? "—"}°
        </div>
      </div>

      <div className="rounded-2xl border border-pink-300/15 bg-pink-300/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold text-pink-100">
          <Wind size={14} />
          Wind
        </div>
        <div className="mt-1 text-sm font-black text-white">
          {weather.wind_direction || "Neutral"}
        </div>
        <div className="text-xs text-slate-400">{weather.wind_speed ?? "—"} mph</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
        <div className="text-xs font-bold text-slate-400">Weather Score</div>
        <div className="mt-1">
          <StatCell value={weather.score ?? weather.Weather ?? ""} statKey="Weather" />
        </div>
      </div>
    </div>
  );
}