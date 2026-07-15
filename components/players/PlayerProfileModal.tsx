"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type TimeRange = "season" | "last7" | "last14" | "last30" | "career";
type ProfileTab = "player" | "team";
type ViewKey = "vsLHP" | "vsRHP" | "matchup" | "overall" | "home" | "away";

type PlayerSelection = {
  playerId?: string | number;
  playerName: string;
  teamName?: string;
  teamId?: string | number;
  playerType?: "hitter" | "pitcher";
};

type PlayerProfileModalProps = {
  player: PlayerSelection | null;
  onClose: () => void;
};

const rangeLabels: Record<TimeRange, string> = {
  season: "Current Season",
  last7: "Last 7 Days",
  last14: "Last 14 Days",
  last30: "Last 30 Days",
  career: "Career",
};

const hitterOrder = [
  "G", "PA", "AB", "R", "H", "2B", "3B", "HR", "RBI", "BB", "SO", "SB",
  "AVG", "OBP", "SLG", "OPS", "ISO",
];

const pitcherOrder = [
  "G", "GS", "IP", "W", "L", "ERA", "WHIP", "K", "BB", "HR", "K/9",
  "BB/9", "H/9", "HR/9", "K%", "BB%", "OPP AVG",
];

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }
  return String(value);
}

function StatGrid({ stats, order }: { stats?: Record<string, unknown>; order: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {order.map((key) => (
        <div key={key} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            {key}
          </div>
          <div className="mt-1 text-lg font-black text-white">
            {displayValue(stats?.[key])}
          </div>
        </div>
      ))}
    </div>
  );
}

function labelsFor(isPitcher: boolean): Record<ViewKey, string> {
  return {
    vsLHP: isPitcher ? "vs LH" : "vs LHP",
    vsRHP: isPitcher ? "vs RH" : "vs RHP",
    matchup: "Matchup",
    overall: "Overall",
    home: "Home",
    away: "Away",
  };
}

export function PlayerProfileModal({ player, onClose }: PlayerProfileModalProps) {
  const [tab, setTab] = useState<ProfileTab>("player");
  const [range, setRange] = useState<TimeRange>("season");
  const [view, setView] = useState<ViewKey>("overall");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!player) return;

    setTab("player");
    setRange("season");
    setView("overall");
    setLoading(true);
    setError("");
    setData(null);

    const params = new URLSearchParams({
      playerName: player.playerName,
      teamName: player.teamName || "",
      playerType: player.playerType || "hitter",
    });

    if (player.playerId) params.set("playerId", String(player.playerId));
    if (player.teamId) params.set("teamId", String(player.teamId));

    fetch(`/api/player-profile?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Unable to load player profile.");
        return payload;
      })
      .then(setData)
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "Unable to load player profile.");
      })
      .finally(() => setLoading(false));
  }, [player]);

  useEffect(() => {
    if (!player) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, player]);

  useEffect(() => {
    if (tab === "team" && range === "career") setRange("season");
    if (tab === "team" && view === "matchup") setView("overall");
  }, [range, tab, view]);

  const isPitcher = data?.player?.type === "pitching";
  const viewLabels = labelsFor(isPitcher);

  const availableRanges = useMemo<TimeRange[]>(
    () =>
      tab === "player"
        ? ["season", "last7", "last14", "last30", "career"]
        : ["season", "last7", "last14", "last30"],
    [tab],
  );

  const availableViews = useMemo<ViewKey[]>(
    () =>
      tab === "player"
        ? ["vsLHP", "vsRHP", "matchup", "overall", "home", "away"]
        : ["vsLHP", "vsRHP", "overall", "home", "away"],
    [tab],
  );

  const playerStats = data?.playerStats?.[view]?.[range] ?? {};
  const teamStats = data?.teamStats?.[view]?.[range] ?? {};

  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#0b1020] shadow-2xl shadow-black/60">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-white">
              {data?.player?.name || player.playerName}
            </div>

            <div className="mt-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm font-bold text-slate-400">
                  {data?.player?.team || player.teamName || "—"}
                  {data?.player?.position ? ` · ${data.player.position}` : ""}
                </div>

                <div className="flex flex-wrap gap-2 lg:mr-16 lg:justify-end">
                  {availableViews.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setView(value)}
                      className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                        view === value
                          ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                      }`}
                    >
                      {viewLabels[value]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
                <span>Bats {data?.player?.bats || "—"}</span>
                <span>Throws {data?.player?.throws || "—"}</span>
              </div>

              {view === "matchup" && data?.matchup?.opponentTeamName ? (
                <div className="mt-2 text-xs font-bold text-slate-500">
                  Today: vs {data.matchup.opponentTeamName}
                  {data?.matchup?.opponentPitcherName
                    ? ` · ${data.matchup.opponentPitcherName}`
                    : ""}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-pink-300/30 hover:text-white"
            aria-label="Close player profile"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 pt-4">
          <div className="flex gap-2">
            {(["player", "team"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-t-xl border-b-2 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
                  tab === value
                    ? "border-cyan-300 text-cyan-100"
                    : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-white/10 p-4">
          <div className="flex flex-wrap gap-2">
            {availableRanges.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${
                  range === value
                    ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                }`}
              >
                {rangeLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-sm font-bold text-slate-400">
              Loading complete stats...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5 text-sm font-bold text-rose-200">
              {error}
            </div>
          ) : tab === "player" && view === "matchup" ? (
            <div className="space-y-6">
              {!isPitcher ? (
                <section>
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                    vs Today&apos;s Pitcher
                    {data?.matchup?.opponentPitcherName
                      ? ` · ${data.matchup.opponentPitcherName}`
                      : ""}
                  </h3>
                  <StatGrid stats={playerStats?.vsPitcher} order={hitterOrder} />
                </section>
              ) : null}

              <section>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-pink-200">
                  vs Today&apos;s Team
                  {data?.matchup?.opponentTeamName
                    ? ` · ${data.matchup.opponentTeamName}`
                    : ""}
                </h3>
                <StatGrid
                  stats={playerStats?.vsTeam}
                  order={isPitcher ? pitcherOrder : hitterOrder}
                />
              </section>
            </div>
          ) : tab === "player" ? (
            <section>
              <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                {viewLabels[view]} · {rangeLabels[range]} Player Stats
              </h3>
              <StatGrid stats={playerStats} order={isPitcher ? pitcherOrder : hitterOrder} />
            </section>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
  {view === "vsLHP"
    ? "vs LHP"
    : view === "vsRHP"
      ? "vs RHP"
      : viewLabels[view]}{" "}
  · Team Hitting
</h3>
                <StatGrid stats={teamStats?.hitting} order={hitterOrder} />
              </section>

              <section>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-pink-200">
                  {viewLabels[view]} · Team Pitching
                </h3>
                <StatGrid stats={teamStats?.pitching} order={pitcherOrder} />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
