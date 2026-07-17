import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { PitcherTable } from "@/components/pitchers/PitcherTable";

export const dynamic = "force-dynamic";

type Game = Record<string, any>;
type Pitcher = Record<string, any>;

function loadTomorrowGames(): Game[] {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "tomorrow",
    "all_games.json",
  );

  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const raw = fs.readFileSync(filePath, "utf-8").trim();

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as Game[])
      : [];
  } catch (error) {
    console.error(
      "Unable to load tomorrow pitchers:",
      error,
    );

    return [];
  }
}

function getTomorrowPitchers(): Pitcher[] {
  const games = loadTomorrowGames();
  const pitchers: Pitcher[] = [];

  for (const game of games) {
    const gamePitchers = Array.isArray(game.pitchers)
      ? game.pitchers
      : [];

    for (const pitcher of gamePitchers) {
      pitchers.push({
        ...pitcher,

        Pitcher:
          pitcher.Pitcher ||
          pitcher.name ||
          pitcher.player_name ||
          "",

        "Pitcher ID":
          pitcher["Pitcher ID"] ||
          pitcher.pitcher_id ||
          pitcher.player_id ||
          pitcher.id ||
          "",

        Game:
          pitcher.Game ||
          game.game ||
          "",

        "Game ID":
          pitcher["Game ID"] ||
          game.game_id ||
          "",

        Venue:
          pitcher.Venue ||
          game.venue ||
          "",
      });
    }
  }

  return pitchers
    .filter((pitcher) => pitcher.Pitcher)
    .sort(
      (a, b) =>
        Number(b["Strikeout Score"] || 0) -
        Number(a["Strikeout Score"] || 0),
    );
}

function getTomorrowLabel() {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TomorrowPitchersPage() {
  const pitchers = getTomorrowPitchers();
  const tomorrow = getTomorrowLabel();

  return (
    <AppShell>
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
          {tomorrow}
        </div>
      </div>

      <PitcherTable
  pitchers={pitchers}
  slateLabel="Tomorrow's Slate"
/>
    </AppShell>
  );
}