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

function NoGamesScheduled() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] items-center justify-center px-4 pb-16 pt-7 sm:px-6">
      <div className="relative w-full max-w-[1170px] overflow-hidden rounded-[24px] border border-cyan-400/30 bg-[#07101f]/80 px-6 py-12 shadow-[0_0_70px_rgba(34,211,238,0.05)] backdrop-blur-sm md:px-12 md:py-14">
        {/* Background glows */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-pink-500/[0.07] blur-[110px]"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-cyan-400/[0.07] blur-[110px]"
          aria-hidden="true"
        />

        {/* Top accent */}
        <div
          className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-pink-400/70"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Calendar icon */}
          <div className="relative mb-6 flex h-[86px] w-[100px] items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-pink-400/20 blur-2xl"
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 100 100"
              className="relative h-[82px] w-[82px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                x="16"
                y="22"
                width="68"
                height="62"
                rx="11"
                fill="#07101F"
                stroke="url(#noGamesCalendarGradient)"
                strokeWidth="4"
              />

              <path
                d="M16 42H84"
                stroke="url(#noGamesCalendarGradient)"
                strokeWidth="4"
              />

              <path
                d="M32 15V29"
                stroke="#59DFFF"
                strokeWidth="6"
                strokeLinecap="round"
              />

              <path
                d="M68 15V29"
                stroke="#FF67C8"
                strokeWidth="6"
                strokeLinecap="round"
              />

              <circle
                cx="35"
                cy="57"
                r="4"
                fill="#59DFFF"
              />

              <circle
                cx="50"
                cy="57"
                r="4"
                fill="#A78BFA"
              />

              <circle
                cx="65"
                cy="57"
                r="4"
                fill="#FF67C8"
              />

              <path
                d="M34 71H66"
                stroke="url(#noGamesCalendarGradient)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <defs>
                <linearGradient
                  id="noGamesCalendarGradient"
                  x1="16"
                  y1="22"
                  x2="84"
                  y2="84"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#49DFFF" />
                  <stop offset="0.5" stopColor="#9B87FF" />
                  <stop offset="1" stopColor="#FF62C5" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Label */}
          <div className="mb-3 text-[12px] font-black uppercase tracking-[0.42em] text-cyan-300 md:text-[13px]">
            MLB Games Loaded For Next Slate
          </div>

          {/* Main title */}
          <h2 className="bg-gradient-to-r from-cyan-200 via-white to-pink-300 bg-clip-text text-[34px] font-black uppercase leading-none tracking-[-0.035em] text-transparent sm:text-[44px] md:text-[54px] lg:text-[60px]">
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
          <div className="max-w-[650px] text-[15px] font-semibold leading-7 text-slate-300 md:text-[17px]">
            <p>There are no MLB games scheduled for tomorrow.</p>

            <p className="text-slate-400">
              Check back for the next available slate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
        <NoGamesScheduled />
      )}
    </AppShell>
  );
}