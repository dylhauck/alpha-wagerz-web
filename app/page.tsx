import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { GameTicker } from "@/components/games/GameTicker";
import { SelectedGameDashboard } from "@/components/games/SelectedGameDashboard";
import { getAllGames } from "@/lib/data/modelData";

type Game = Record<string, any>;

function timeToMinutes(value: unknown) {
  const time = String(value || "").trim();

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  return hour * 60 + minute;
}

function gameSortValue(game: Game) {
  const datetimeValue =
    game.game_datetime_utc ||
    game.game_datetime ||
    game.commence_time ||
    game.game_date_utc ||
    game.game_time_utc;

  if (datetimeValue) {
    const timestamp = new Date(datetimeValue).getTime();

    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return timeToMinutes(game.game_time);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ game?: string }>;
}) {
  const params = await searchParams;

  const games = getAllGames();

  const sortedGames = [...games].sort((a, b) => {
    return gameSortValue(a) - gameSortValue(b);
  });

  const requestedGameId = String(params?.game || "");

  const selectedGame =
    sortedGames.find(
      (game) => String(game.game_id) === requestedGameId
    ) || sortedGames[0];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
          {today}
        </div>

        <div className="mt-3 w-full">
          <GameTicker
            games={sortedGames}
            selectedGameId={selectedGame?.game_id}
          />
        </div>
      </div>

      {selectedGame ? (
        <SelectedGameDashboard game={selectedGame} />
      ) : (
        <div className="glass rounded-3xl p-8 text-slate-300">
          No games loaded. Run the Alpha Wagerz model and publish
          all_games.json.
        </div>
      )}
    </AppShell>
  );
}