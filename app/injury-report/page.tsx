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

        {/* Injury Report Controls */}
        <section className="glass overflow-hidden rounded-3xl p-5">
          <div className="mb-5 flex justify-center">
            <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              MLB Injury Report
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(
                event,
              ) =>
                setQuery(
                  event.target
                    .value,
                )
              }
              placeholder="Search player, team, position, or injury"
              className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
            />

            <div className="flex gap-2">
              {(
                [
                  "ALL",
                  "OUT",
                ] as const
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setStatus(
                      item,
                    )
                  }
                  className={`rounded-xl border px-4 py-2 text-xs font-black tracking-wider transition ${
                    status ===
                    item
                      ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 text-xs font-semibold text-slate-500">
            Showing{" "}
            {players.length}{" "}
            players
            {report?.primary_source
              ? ` · Source: ${report.primary_source}`
              : ""}
            {report?.generated_at
              ? ` · Updated ${new Date(
                  report.generated_at,
                ).toLocaleString()}`
              : ""}
          </div>
        </section>

        {/* Injury Table */}
        <section className="glass overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="bg-white/[0.04] text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Player
                  </th>

                  <th className="px-4 py-4">
                    Team
                  </th>

                  <th className="px-4 py-4">
                    Pos
                  </th>

                  <th className="px-4 py-4">
                    Status
                  </th>

                  <th className="px-4 py-4">
                    Injury / Reason
                  </th>

                  <th className="px-4 py-4">
                    Estimated Return
                  </th>

                  <th className="px-4 py-4">
                    Source Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {players.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm font-bold text-slate-400"
                    >
                      No matching
                      injury records
                      were found.
                    </td>
                  </tr>
                ) : (
                  players.map(
                    (player) => (
                      <tr
                        key={`${player.team}-${player.player}`}
                        className="border-t border-white/[0.06]"
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPlayer(
                                {
                                  playerId:
                                    player.player_id,
                                  playerName:
                                    player.player,
                                  teamName:
                                    player.team,
                                  teamId:
                                    player.team_id,
                                  playerType:
                                    isPitcherPosition(
                                      player.position,
                                    )
                                      ? "pitcher"
                                      : "hitter",
                                },
                              )
                            }
                            className="font-black text-white transition hover:text-cyan-300 hover:underline"
                          >
                            {
                              player.player
                            }
                          </button>

                          {player.source_type ===
                            "suspension" && (
                            <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-amber-300">
                              Suspended
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-slate-300">
                          {
                            player.team
                          }
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-slate-300">
                          {player.position ||
                            "—"}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              player.availability
                            }
                          />
                        </td>

                        <td className="max-w-[360px] px-4 py-4">
                          <div className="text-sm font-bold text-slate-100">
                            {getInjuryLabel(
                              player,
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-cyan-200">
                          {player.estimated_return ||
                            "Unknown"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm font-bold text-slate-300">
                            {player.espn_status ||
                              player.availability}
                          </div>

                          <div className="mt-1 text-[11px] font-semibold text-slate-500">
                            {player.source ||
                              ""}
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
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