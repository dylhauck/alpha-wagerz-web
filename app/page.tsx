import Image from "next/image";
import Link from "next/link";
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

function SeasonNotStarted() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] items-center justify-center px-4 pb-16 pt-8 sm:px-6">
      <div className="relative w-full max-w-[1170px] overflow-hidden rounded-[24px] border border-cyan-400/35 bg-[#07101f]/80 px-6 py-12 shadow-[0_0_70px_rgba(34,211,238,0.06)] backdrop-blur-sm md:px-12 md:py-14">
        {/* Background glows */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-pink-500/[0.07] blur-[110px]"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-cyan-400/[0.07] blur-[110px]"
          aria-hidden="true"
        />

        {/* Top gradient accent */}
        <div
          className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-pink-400/70"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Baseball + calendar */}
          <div className="relative mb-6 flex h-[92px] w-[112px] items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-pink-400/20 blur-2xl"
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 120 100"
              className="relative h-[92px] w-[112px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Calendar */}
              <rect
                x="49"
                y="16"
                width="57"
                height="54"
                rx="8"
                stroke="url(#calendarGradient)"
                strokeWidth="4"
              />

              <path
                d="M49 33H106"
                stroke="url(#calendarGradient)"
                strokeWidth="4"
              />

              <path
                d="M63 10V23"
                stroke="#8B8CFF"
                strokeWidth="5"
                strokeLinecap="round"
              />

              <path
                d="M91 10V23"
                stroke="#FF65C7"
                strokeWidth="5"
                strokeLinecap="round"
              />

              <rect
                x="61"
                y="42"
                width="8"
                height="8"
                rx="1.5"
                fill="#57DFFF"
              />

              <rect
                x="76"
                y="42"
                width="8"
                height="8"
                rx="1.5"
                fill="#B68CFF"
              />

              <rect
                x="91"
                y="42"
                width="8"
                height="8"
                rx="1.5"
                fill="#FF65C7"
              />

              {/* Baseball */}
              <circle
                cx="43"
                cy="62"
                r="27"
                fill="#07101F"
                stroke="url(#baseballGradient)"
                strokeWidth="4"
              />

              <path
                d="M29 40C36 47 39 54 39 62C39 70 36 77 29 84"
                stroke="#57DFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M57 40C50 47 47 54 47 62C47 70 50 77 57 84"
                stroke="#FF65C7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Baseball stitches */}
              <path
                d="M32 46L27 47M35 52L30 54M37 59L32 61M37 66L32 64M35 73L30 71M32 79L27 77"
                stroke="#57DFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M54 46L59 47M51 52L56 54M49 59L54 61M49 66L54 64M51 73L56 71M54 79L59 77"
                stroke="#FF65C7"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <defs>
                <linearGradient
                  id="calendarGradient"
                  x1="49"
                  y1="16"
                  x2="106"
                  y2="70"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#49DFFF" />
                  <stop offset="0.5" stopColor="#9B87FF" />
                  <stop offset="1" stopColor="#FF62C5" />
                </linearGradient>

                <linearGradient
                  id="baseballGradient"
                  x1="16"
                  y1="35"
                  x2="70"
                  y2="89"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#42DFFF" />
                  <stop offset="0.5" stopColor="#8B8CFF" />
                  <stop offset="1" stopColor="#FF62C5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Section label */}
          <div className="mb-3 text-[12px] font-black uppercase tracking-[0.42em] text-cyan-300 md:text-[13px]">
            MLB Next Slate
          </div>

          {/* Main title */}
          <h2 className="bg-gradient-to-r from-cyan-200 via-white to-pink-300 bg-clip-text text-[34px] font-black uppercase leading-none tracking-[-0.035em] text-transparent sm:text-[44px] md:text-[56px] lg:text-[64px]">
            No Games Scheduled
          </h2>

          {/* Divider */}
          <div className="my-7 flex w-full max-w-[600px] items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400/80" />

            <div className="flex items-center gap-2 text-[15px]">
              <span className="text-cyan-300">★</span>
              <span className="text-purple-300">★</span>
              <span className="text-pink-300">★</span>
            </div>

            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pink-400/80" />
          </div>

          {/* Message */}
          <div className="max-w-[700px] text-[15px] font-semibold leading-7 text-slate-300 md:text-[17px]">
            <p>No Games Scheduled Today.</p>

            <p className="text-slate-400">
              Check back when the next games are scheduled.
            </p>
          </div>

          {/* Home button */}
          <Link
            href="/"
            className="group mt-9 inline-flex h-[52px] items-center justify-center gap-3 rounded-xl border border-cyan-400/40 bg-cyan-400/[0.06] px-8 text-[12px] font-black uppercase tracking-[0.28em] text-cyan-100 transition-all duration-200 hover:border-cyan-300/70 hover:bg-cyan-400/[0.12] hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] text-cyan-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 11.5L12 4l9 7.5" />
              <path d="M5.5 10v10h13V10" />
              <path d="M9.5 20v-6h5v6" />
            </svg>

            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
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

        <div className="mt-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {games.length} MLB Games Loaded For Current Slate
        </div>

        {sortedGames.length > 0 && (
          <div className="mt-3 w-full">
            <GameTicker
              games={sortedGames}
              selectedGameId={selectedGame?.game_id}
            />
          </div>
        )}
      </div>

      {selectedGame ? (
        <SelectedGameDashboard game={selectedGame} />
      ) : (
        <SeasonNotStarted />
      )}
    </AppShell>
  );
}