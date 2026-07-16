import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { GameTicker } from "@/components/games/GameTicker";
import { SelectedGameDashboard } from "@/components/games/SelectedGameDashboard";

export const dynamic = "force-dynamic";

type Game = Record<string, any>;

function getTomorrowGames(): Game[] {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "tomorrow",
    "all_games.json",
  );

  try {
    if (!fs.existsSync(filePath)) {
      console.warn(
        `Tomorrow slate file was not found: ${filePath}`,
      );

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
      "Unable to load tomorrow slate:",
      error,
    );

    return [];
  }
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

export default async function TomorrowPage({
  searchParams,
}: {
  searchParams?: Promise<{ game?: string }>;
}) {
  const params = await searchParams;
  const games = getTomorrowGames();

  const selectedGame =
    games.find(
      (game) =>
        String(game.game_id) ===
        String(params?.game),
    ) ?? games[0];

  const tomorrowLabel = getTomorrowLabel();

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
          {tomorrowLabel}
        </div>

        <div className="mt-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          Tomorrow&apos;s Slate
        </div>

        {games.length > 0 ? (
          <div className="mt-3 w-full">
            <GameTicker
  games={games}
  selectedGameId={selectedGame?.game_id}
  basePath="/tomorrow"
/>
          </div>
        ) : null}
      </div>

      {selectedGame ? (
        <SelectedGameDashboard
          game={selectedGame}
        />
      ) : (
        <section className="glass rounded-3xl p-8 text-center">
          <div className="text-xl font-black text-white">
            No games loaded for tomorrow.
          </div>

          <div className="mt-2 text-sm text-slate-400">
            Run the Alpha Wagerz full update and confirm that
            public/data/tomorrow/all_games.json was published.
          </div>
        </section>
      )}
    </AppShell>
  );
}