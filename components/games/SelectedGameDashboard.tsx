"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { WeatherBadge } from "@/components/weather/WeatherBadge";
import { GameHitterTable } from "@/components/tables/GameHitterTable";
import { StatCell } from "@/components/StatCell";
import { TeamMatchupPanel } from "@/components/games/TeamMatchupPanel";
import { PlayerNameButton } from "@/components/players/PlayerNameButton";
import { PlayerProfileModal } from "@/components/players/PlayerProfileModal";

function getTopTarget(hitters: Record<string, any>[] = []) {
  return [...hitters].sort(
    (a, b) => Number(b.Likely || 0) - Number(a.Likely || 0),
  )[0];
}

function getThrowHand(value: unknown) {
  const hand = String(value || "")
    .trim()
    .toUpperCase();

  if (hand.startsWith("L")) return "L";
  if (hand.startsWith("R")) return "R";

  return "";
}

function ThrowHandBadge({ throws }: { throws: unknown }) {
  const hand = getThrowHand(throws);

  if (!hand) return null;

  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-[10px] font-black text-cyan-200">
      {hand}
    </span>
  );
}

function PitcherCard({
  pitcher,
  onPitcherClick,
}: {
  pitcher?: Record<string, any>;
  onPitcherClick: (pitcher: Record<string, any>) => void;
}) {
  if (!pitcher) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-slate-400">
        Pitcher TBD
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2">
        <PlayerNameButton
          name={pitcher.Pitcher || "TBD"}
          onClick={() => onPitcherClick(pitcher)}
          className="text-sm font-black"
        />

        <ThrowHandBadge throws={pitcher.Throws} />
      </div>

      <div className="text-xs text-slate-500">
        {pitcher.Team} vs {pitcher.Opponent}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Pitch Score
          </div>

          <StatCell
            value={pitcher["Pitch Score"]}
            statKey="Pitch Score"
          />
        </div>

        <div>
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            K Score
          </div>

          <StatCell
            value={pitcher["Strikeout Score"]}
            statKey="Strikeout Score"
          />
        </div>

        <div>
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            HR Vuln
          </div>

          <StatCell
            value={pitcher["HR Vulnerability"]}
            statKey="HR Vulnerability"
          />
        </div>

        <div>
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            Barrel
          </div>

          <StatCell
            value={pitcher["Barrel Profile"]}
            statKey="Barrel Profile"
          />
        </div>
      </div>
    </div>
  );
}

export function SelectedGameDashboard({
  game,
}: {
  game: Record<string, any>;
}) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<Record<string, any> | null>(null);

  const awayHitters = game?.hitters?.away || [];
  const homeHitters = game?.hitters?.home || [];

  const awayTop = getTopTarget(awayHitters);
  const homeTop = getTopTarget(homeHitters);

  const awayPitcher = game?.pitchers?.find(
    (pitcher: any) => pitcher.Team === game.away_team,
  );

  const homePitcher = game?.pitchers?.find(
    (pitcher: any) => pitcher.Team === game.home_team,
  );

  function openPitcherProfile(pitcher: Record<string, any>) {
    setSelectedPlayer({
      playerId:
        pitcher.player_id ||
        pitcher.playerId ||
        pitcher.mlb_id ||
        pitcher.mlbId ||
        pitcher["Pitcher ID"],

      playerName: pitcher.Pitcher || "",
      teamName: pitcher.Team || "",

      teamId:
        pitcher.team_id ||
        pitcher.teamId ||
        pitcher.mlb_team_id,

      playerType: "pitcher",
    });
  }

  return (
    <>
      <div className="space-y-5">
        <section className="glass rounded-3xl p-5">
          <div className="mb-4 text-center">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
              MLB Slate Summary
            </div>

            <h1 className="mt-2 overflow-visible pb-2 text-center text-3xl font-black leading-tight neon-text sm:text-5xl">
              {game.game}
            </h1>

            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-400">
              <MapPin size={15} />
              {game.venue}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
            <TeamMatchupPanel
              team={game.away_team}
              context={game.away_team_context}
              align="left"
            />

            <div className="hidden h-full items-center justify-center xl:flex">
              <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-xl font-black text-white">
                @
              </div>
            </div>

            <TeamMatchupPanel
              team={game.home_team}
              context={game.home_team_context}
              align="right"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                {game.away_team} Top Target
              </div>

              <div className="mt-2 text-xl font-black text-white">
                {awayTop?.Player || "—"}
              </div>

              <div className="mt-2">
                <StatCell
                  value={awayTop?.Likely}
                  statKey="Likely"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-pink-300/20 bg-pink-500/10 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-pink-200">
                {game.home_team} Top Target
              </div>

              <div className="mt-2 text-xl font-black text-white">
                {homeTop?.Player || "—"}
              </div>

              <div className="mt-2">
                <StatCell
                  value={homeTop?.Likely}
                  statKey="Likely"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="glass rounded-3xl p-4">
            <h2 className="mb-3 text-lg font-black text-white">
              Weather Edge
            </h2>

            <WeatherBadge weather={game.weather} />

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
              <div>
                Conditions: {game.weather?.conditions || "—"}
              </div>

              <div>
                Humidity: {game.weather?.humidity || "—"}%
              </div>

              <div>
                Roof: {game.weather?.roof || game.roof || "open"}
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-4">
            <h2 className="mb-3 text-lg font-black text-white">
              Away Starter
            </h2>

            <PitcherCard
              pitcher={awayPitcher}
              onPitcherClick={openPitcherProfile}
            />
          </div>

          <div className="glass rounded-3xl p-4">
            <h2 className="mb-3 text-lg font-black text-white">
              Home Starter
            </h2>

            <PitcherCard
              pitcher={homePitcher}
              onPitcherClick={openPitcherProfile}
            />
          </div>
        </section>

        <section className="space-y-5">
          <GameHitterTable
            title={`${game.away_team} Hitters`}
            team={game.away_team}
            hitters={awayHitters}
          />

          <GameHitterTable
            title={`${game.home_team} Hitters`}
            team={game.home_team}
            hitters={homeHitters}
          />
        </section>
      </div>

      <PlayerProfileModal
        player={selectedPlayer as any}
        onClose={() => setSelectedPlayer(null)}
      />
    </>
  );
}