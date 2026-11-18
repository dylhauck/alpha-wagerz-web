"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PlayerProfileModal } from "@/components/players/PlayerProfileModal";

type InjuryPlayer = {
  player_id?: string | number;
  team_id?: string | number;
  team: string;
  player: string;
  position?: string;
  availability: "DTD" | "OUT";
  espn_status?: string;
  injury: string;
  estimated_return?: string;
  comment?: string;
  source?: string;
  source_type?: "injury" | "suspension";
};

type InjuryReport = {
  generated_at?: string;
  primary_source?: string;
  player_count?: number;
  players?: InjuryPlayer[];
};

function getInjuryLabel(player: InjuryPlayer) {
  const current = (player.injury || "").trim();
  const normalizedCurrent = current.toLowerCase();

  if (
    current &&
    normalizedCurrent !== "injury not specified" &&
    normalizedCurrent !== "undisclosed" &&
    normalizedCurrent !== "undisclosed injury"
  ) {
    return current;
  }

  const comment = (player.comment || "").trim();

  if (!comment) {
    return "Undisclosed";
  }

  const sentences = comment
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  const injuryKeywords = [
    "surgery",
    "recovery",
    "strain",
    "sprain",
    "fracture",
    "inflammation",
    "soreness",
    "tightness",
    "tear",
    "elbow",
    "shoulder",
    "hamstring",
    "knee",
    "back",
    "wrist",
    "ankle",
    "hip",
    "groin",
    "forearm",
    "ucl",
    "labrum",
    "adductor",
    "oblique",
    "concussion",
  ];

  for (
    let index = sentences.length - 1;
    index >= 0;
    index -= 1
  ) {
    const sentence = sentences[index];
    const lowered = sentence.toLowerCase();

    if (
      injuryKeywords.some((keyword) =>
        lowered.includes(keyword),
      )
    ) {
      return sentence;
    }
  }

  return "Undisclosed";
}

function isPitcherPosition(position?: string) {
  const normalized = (position || "")
    .trim()
    .toUpperCase();

  return [
    "P",
    "SP",
    "RP",
    "LHP",
    "RHP",
  ].includes(normalized);
}

export default function InjuryReportPage() {
  const [report, setReport] =
    useState<InjuryReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [selectedTeam, setSelectedTeam] = useState("ALL");

  const [status, setStatus] =
    useState<
      "ALL" | "DTD" | "OUT"
    >("ALL");

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] = useState<{
    playerId?: string | number;
    playerName: string;
    teamName: string;
    teamId?: string | number;
    playerType:
      | "hitter"
      | "pitcher";
  } | null>(null);

  const today =
    new Date().toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );

  useEffect(() => {
    fetch(
      "/data/injury_report.json",
      {
        cache: "no-store",
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Unable to load injury report (${response.status})`,
          );
        }

        return response.json();
      })
      .then(
        (data: InjuryReport) => {
          setReport(data);
        },
      )
      .catch((error) => {
        console.error(error);

        setReport({
          players: [],
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const players = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    return (
      report?.players ?? []
    )
      .filter((player) => {
        const matchesStatus =
          status === "ALL" ||
          player.availability ===
            status;

        const injuryLabel =
          getInjuryLabel(
            player,
          ).toLowerCase();

        const matchesSearch =
          !search ||
          player.player
            .toLowerCase()
            .includes(search) ||
          player.team
            .toLowerCase()
            .includes(search) ||
          injuryLabel.includes(
            search,
          ) ||
          (
            player.position ?? ""
          )
            .toLowerCase()
            .includes(search);

        return (
          matchesStatus &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        const statusOrder =
          Number(
            a.availability ===
              "DTD",
          ) -
          Number(
            b.availability ===
              "DTD",
          );

        if (
          statusOrder !== 0
        ) {
          return statusOrder;
        }

        const teamOrder =
          a.team.localeCompare(
            b.team,
          );

        if (teamOrder !== 0) {
          return teamOrder;
        }

        return a.player.localeCompare(
          b.player,
        );
      });
  }, [
    query,
    report,
    status,
  ]);

  const teams = [...new Set((report?.players ?? []).map((player) => player.team))].sort();
  const visiblePlayers = players.filter((player) => selectedTeam === "ALL" || player.team === selectedTeam);
  const outCount = visiblePlayers.filter((player) => player.availability === "OUT").length;
  const dtdCount = visiblePlayers.filter((player) => player.availability === "DTD").length;
  const summary = [
    {label: "Total Injuries", value: visiblePlayers.length, tone: "text-cyan-200"},
    {label: "Out / Injured List", value: outCount, tone: "text-rose-300"},
    {label: "Day-to-Day", value: dtdCount, tone: "text-amber-200"},
    {label: "Teams Affected", value: new Set(visiblePlayers.map((player) => player.team)).size, tone: "text-white"},
  ];
  const teamGroups = selectedTeam === "ALL" ? [...new Set(visiblePlayers.map((player) => player.team))].sort() : [selectedTeam];

  if (loading) {
    return (
      <AppShell>
        <div className="py-8 text-sm font-bold text-slate-400">
          Loading injury report...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Standard MLB Header */}
        <div className="mb-3 flex flex-col items-center pt-8">
          <div className="flex h-[92px] w-full items-center justify-center overflow-hidden">
            <Image
              src="/follow-alpha.png"
              alt="Follow The Alpha"
              width={640}
              height={180}
              priority
              className="h-auto w-[560px] max-w-full object-contain"
            />
          </div>

          <div className="-mt-2 text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            {today}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-3xl font-black neon-text">MLB Injury Report</h1>
          <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-2 text-xs font-black uppercase tracking-widest text-cyan-200">
            {report?.primary_source || "Injury Report"} · {report?.generated_at ? `Updated ${new Date(report.generated_at).toLocaleString("en-US", {timeZone: "America/Chicago", timeZoneName: "short"})}` : "Update unavailable"}
          </div>
        </div>
        <section className="glass rounded-3xl p-4 sm:p-5">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Select Team</div>
          <div className="table-scroll flex gap-2 overflow-x-auto pb-2">
            {["ALL", ...teams].map((team) => (
              <button key={team} type="button" onClick={() => setSelectedTeam(team)}
                className={`shrink-0 rounded-xl border px-4 py-3 text-xs font-black transition ${selectedTeam === team ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-100 shadow-[0_0_20px_rgba(35,216,255,0.2)]" : "border-white/10 bg-slate-950/80 text-slate-300 hover:border-pink-300/40"}`}>
                {team === "ALL" ? "All Teams" : team}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search player, team, position, or injury"
              className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"/>
            <div className="flex gap-2">
              {(["ALL", "OUT", "DTD"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setStatus(item)}
                  className={`rounded-xl border px-4 py-2 text-xs font-black tracking-wider transition ${status === item ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="glass rounded-3xl p-5 sm:p-7 text-center">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">MLB Injury Report</div>
          <h2 className="mx-auto mt-2 pb-2 text-3xl font-black leading-tight neon-text sm:text-5xl">{selectedTeam === "ALL" ? "All MLB Teams" : selectedTeam}</h2>
          <p className="text-sm text-slate-400">Current injury status for the selected team</p>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                <div className={`mt-2 text-3xl font-black ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>
        {teamGroups.length === 0 && <section className="glass rounded-3xl p-8 text-center text-sm text-slate-400">No matching injury records were found.</section>}
        <div className="grid gap-5 lg:grid-cols-2">
          {teamGroups.map((team) => {
            const teamPlayers = visiblePlayers.filter((player) => player.team === team);
            return (
              <section key={team} className="glass overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h3 className="text-lg font-black text-white">{team}</h3>
                  <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">{teamPlayers.length} INJURIES</span>
                </div>
                {teamPlayers.length === 0 ? <p className="p-5 text-sm text-slate-400">No injuries listed for this team.</p> :
                  <div className="divide-y divide-white/[0.06]">
                    {teamPlayers.map((player) => (
                      <div key={`${player.team}-${player.player}`} className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <button type="button" onClick={() => setSelectedPlayer({
                              playerId: player.player_id, playerName: player.player,
                              teamName: player.team, teamId: player.team_id,
                              playerType: isPitcherPosition(player.position) ? "pitcher" : "hitter",
                            })} className="font-black text-white hover:text-cyan-300 hover:underline">{player.player}</button>
                            <div className="mt-1 text-xs text-slate-400">{player.position || "—"} · {player.espn_status || player.availability}</div>
                          </div>
                          <StatusBadge status={player.availability}/>
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-200">{getInjuryLabel(player)}</div>
                        <div className="mt-2 text-xs text-cyan-200">Estimated Return: {player.estimated_return || "Unknown"}</div>
                        {player.source && <div className="mt-1 text-xs text-slate-500">Source: {player.source}</div>}
                      </div>
                    ))}
                  </div>}
              </section>
            );
          })}
        </div>
      </div>

      <PlayerProfileModal
        player={selectedPlayer}
        onClose={() =>
          setSelectedPlayer(
            null,
          )
        }
      />
    </AppShell>
  );
}

function StatusBadge({
  status,
}: {
  status: "DTD" | "OUT";
}) {
  const styles =
    status === "DTD"
      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
      : "border-rose-300/30 bg-rose-300/10 text-rose-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black tracking-wider ${styles}`}
    >
      {status}
    </span>
  );
}