import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { HitterTable } from "@/components/HitterTable";

export const dynamic = "force-dynamic";

type Game = Record<string, any>;
type Hitter = Record<string, any>;

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
      "Unable to load tomorrow hitters:",
      error,
    );

    return [];
  }
}

function getGameHitters(
  game: Game,
  side: "away" | "home",
): Hitter[] {
  const groupedHitters = game.hitters;

  if (
    groupedHitters &&
    typeof groupedHitters === "object" &&
    !Array.isArray(groupedHitters)
  ) {
    const hitters = groupedHitters[side];

    if (Array.isArray(hitters)) {
      return hitters;
    }
  }

  const fallback =
    side === "away"
      ? game.away_hitters
      : game.home_hitters;

  return Array.isArray(fallback)
    ? fallback
    : [];
}

function getTomorrowHitters(): Hitter[] {
  const games = loadTomorrowGames();
  const hitters: Hitter[] = [];

  for (const game of games) {
    for (const side of ["away", "home"] as const) {
      const team =
        side === "away"
          ? game.away_team
          : game.home_team;

      const opponent =
        side === "away"
          ? game.home_team
          : game.away_team;

      for (const hitter of getGameHitters(game, side)) {
        hitters.push({
          ...hitter,

          Player:
            hitter.Player ||
            hitter.name ||
            hitter.player_name ||
            "",

          "Player ID":
            hitter["Player ID"] ||
            hitter.player_id ||
            hitter.id ||
            "",

          Team:
            hitter.Team ||
            hitter.team ||
            team ||
            "",

          Opponent:
            hitter.Opponent ||
            opponent ||
            "",

          Game:
            hitter.Game ||
            game.game ||
            "",

          "Game ID":
            hitter["Game ID"] ||
            game.game_id ||
            "",

          Venue:
            hitter.Venue ||
            game.venue ||
            "",
        });
      }
    }
  }

  return hitters
    .filter((hitter) => hitter.Player)
    .sort(
      (a, b) =>
        Number(b.Likely || 0) -
        Number(a.Likely || 0),
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

export default function TomorrowHittersPage() {
  const hitters = getTomorrowHitters();
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

      <HitterTable
  hitters={hitters}
  slateLabel="Tomorrow's Slate"
/>
    </AppShell>
  );
}