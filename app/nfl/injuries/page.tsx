"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type Injury = {
  player_id?: string;
  player_name?: string;
  name?: string;
  team?: string;
  team_abbr?: string;
  position?: string;
  status?: string;
  injury?: string;
  description?: string;
  detail?: string;
  source?: string;
};

function getRows(payload: any): Injury[] {
  if (Array.isArray(payload)) return payload;

  for (const key of ["injuries", "players", "data", "rows"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

function statusOrder(status: string) {
  const key = status.toUpperCase();

  if (key.includes("OUT") || key.includes("IR") || key.includes("PUP")) return 0;
  if (key.includes("DOUBTFUL")) return 1;
  if (key.includes("QUESTION")) return 2;
  if (key.includes("LIMIT")) return 3;
  if (key.includes("PROBABLE")) return 4;

  return 5;
}

function statusClass(status: string) {
  const key = status.toUpperCase();

  if (key.includes("OUT") || key.includes("IR") || key.includes("PUP")) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (key.includes("DOUBTFUL")) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  if (key.includes("QUESTION")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  if (key.includes("LIMIT")) {
    return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default function NFLInjuryReportPage() {
  const [view, setView] = useState<"current" | "next">("current");
  const [rows, setRows] = useState<Injury[]>([]);
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setTeamFilter("ALL");

      const path =
        view === "current"
          ? "/data/nfl/injuries.json"
          : "/data/nfl/next/injuries.json";

      try {
        const res = await fetch(path, { cache: "no-store" });
        const payload = res.ok ? await res.json() : {};

        if (!cancelled) setRows(getRows(payload));
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [view]);

  const teams = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => (row.team || row.team_abbr || "").toUpperCase())
            .filter(Boolean),
        ),
      ).sort(),
    [rows],
  );

  const visible = useMemo(
    () =>
      [...rows]
        .filter((row) => {
          const team = (row.team || row.team_abbr || "").toUpperCase();
          return teamFilter === "ALL" || team === teamFilter;
        })
        .sort((a, b) => {
          const statusDiff =
            statusOrder(a.status || "") -
            statusOrder(b.status || "");

          if (statusDiff !== 0) return statusDiff;

          const teamA = (a.team || a.team_abbr || "").toUpperCase();
          const teamB = (b.team || b.team_abbr || "").toUpperCase();

          return (
            teamA.localeCompare(teamB) ||
            (a.player_name || a.name || "").localeCompare(
              b.player_name || b.name || "",
            )
          );
        }),
    [rows, teamFilter],
  );

  return (
    <AppShell>
      <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Alpha Wagerz NFL
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Injury Report
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Live NFL injury data used by the injury-context and projection models.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-white outline-none"
              >
                <option value="ALL">All Teams</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                {(["current", "next"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    className={`rounded-lg px-4 py-2 text-sm font-bold ${
                      view === option
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400"
                    }`}
                  >
                    {option === "current" ? "Current Slate" : "Next Slate"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-slate-400">
              Loading injuries…
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-slate-400">
              No injuries are listed for this slate.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900/90 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Pos</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Injury</th>
                      <th className="px-4 py-3">Detail</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {visible.map((row, index) => {
                      const team = (row.team || row.team_abbr || "").toUpperCase();
                      const name = row.player_name || row.name || "Unknown Player";
                      const status = row.status || "Unknown";

                      return (
                        <tr key={row.player_id || `${team}-${name}-${index}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 font-bold">
                              <NFLTeamLogo team={team} size={28} />
                              {team || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-100">
                            {name}
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {row.position || "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold uppercase ${statusClass(
                                status,
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            {row.injury || row.description || "—"}
                          </td>
                          <td className="max-w-lg px-4 py-4 text-slate-400">
                            {row.detail || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
