"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Home,
  LineChart,
  Swords,
  Target,
  Users,
  Shield,
} from "lucide-react";

type Sport = "MLB" | "NFL" | "NBA" | "NHL";

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
};

const sports: {
  label: Sport;
  emoji: string;
  path: string;
}[] = [
  { label: "MLB", emoji: "⚾", path: "/" },
  { label: "NFL", emoji: "🏈", path: "/nfl" },
  { label: "NBA", emoji: "🏀", path: "/nba" },
  { label: "NHL", emoji: "🏒", path: "/nhl" },
];

const mlbNavItems: NavItem[] = [
  {
    label: "Slate Summary",
    path: "",
    icon: Home,
  },
  {
    label: "Alpha Hitters",
    path: "/hitters",
    icon: Target,
  },
  {
    label: "Alpha Pitchers",
    path: "/pitchers",
    icon: Swords,
  },
  {
    label: "Weather Edge Report",
    path: "/weather",
    icon: CloudSun,
  },
  {
    label: "Alpha Projections",
    path: "/projections",
    icon: LineChart,
  },
  {
    label: "Injury Report",
    path: "/injury-report",
    icon: BarChart3,
  },
];

const nflNavItems: NavItem[] = [
  {
    label: "Slate Summary",
    path: "",
    icon: Home,
  },
  {
    label: "NFL Players",
    path: "/players",
    icon: Users,
  },
  {
    label: "NFL Teams",
    path: "/teams",
    icon: Shield,
  },
  {
    label: "Alpha Projections",
    path: "/projections",
    icon: LineChart,
  },
  {
    label: "Injury Report",
    path: "/injury-report",
    icon: BarChart3,
  },
];

const placeholderNavItems: NavItem[] = [
  {
    label: "Slate Summary",
    path: "",
    icon: Home,
  },
];

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sportsOpen, setSportsOpen] =
    useState(false);

  const activeSport: Sport =
    pathname.startsWith("/nfl")
      ? "NFL"
      : pathname.startsWith("/nba")
        ? "NBA"
        : pathname.startsWith("/nhl")
          ? "NHL"
          : "MLB";

  const selectedSport =
    sports.find(
      (sport) =>
        sport.label === activeSport,
    ) ?? sports[0];

  const navItems =
    activeSport === "MLB"
      ? mlbNavItems
      : activeSport === "NFL"
        ? nflNavItems
        : placeholderNavItems;

  function handleSportChange(
    sport: (typeof sports)[number],
  ) {
    setSportsOpen(false);
    router.push(sport.path);
  }

  /*
   * MLB:
   *   Current = /
   *   Next    = /tomorrow
   *
   * NFL:
   *   Current = /nfl
   *   Next    = /nfl/next
   */
  const isMLBTomorrowSection =
    activeSport === "MLB" &&
    (pathname === "/tomorrow" ||
      pathname.startsWith(
        "/tomorrow/",
      ));

  const isNFLNextSection =
    activeSport === "NFL" &&
    (pathname === "/nfl/next" ||
      pathname.startsWith(
        "/nfl/next/",
      ));

  const isNextSection =
    isMLBTomorrowSection ||
    isNFLNextSection;

  /*
   * Base route for whichever slate
   * we're currently viewing.
   */
  const slateBasePath =
    activeSport === "MLB"
      ? isMLBTomorrowSection
        ? "/tomorrow"
        : ""
      : activeSport === "NFL"
        ? isNFLNextSection
          ? "/nfl/next"
          : "/nfl"
        : selectedSport.path;

  /*
   * Determine whether the current
   * slate button should be highlighted.
   */
  const currentSlateBase =
    activeSport === "MLB"
      ? ""
      : activeSport === "NFL"
        ? "/nfl"
        : selectedSport.path;

  const nextSlateBase =
    activeSport === "MLB"
      ? "/tomorrow"
      : activeSport === "NFL"
        ? "/nfl/next"
        : "";

  const isCurrentSlateSection =
    !isNextSection &&
    navItems.some((item) => {
      const href =
        item.path === ""
          ? currentSlateBase || "/"
          : `${currentSlateBase}${item.path}`;

      return (
        pathname === href ||
        pathname.startsWith(
          `${href}/`,
        )
      );
    });

  /*
   * Bottom navigation labels.
   */
  const currentSlateLabel =
    activeSport === "NFL"
      ? "Today's Slate"
      : "Today's Slate";

  const nextSlateLabel =
    activeSport === "NFL"
      ? "Next Slate"
      : "Tomorrow's Slate";

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 hidden h-screen w-56 border-r border-cyan-300/10 bg-slate-950/90 p-3 backdrop-blur-xl lg:block">
        <div className="mb-5 flex justify-center pt-3">
          <Image
            src="/awlogo2.png"
            alt="Alpha Wagerz"
            width={190}
            height={190}
            priority
            className="h-auto w-[190px] object-contain"
          />
        </div>

        <div className="relative mb-3">
          <button
            type="button"
            onClick={() =>
              setSportsOpen(
                (open) => !open,
              )
            }
            className="relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-3 py-3 text-sm font-bold text-white shadow-[0_0_18px_rgba(35,216,255,0.12)] transition hover:bg-cyan-300/15"
            aria-expanded={sportsOpen}
            aria-haspopup="listbox"
          >
            <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-pink-400 shadow-[0_0_12px_rgba(35,216,255,0.75)]" />

            <span className="flex items-center gap-3">
              <span className="text-base">
                {selectedSport.emoji}
              </span>

              <span>
                {selectedSport.label}
              </span>
            </span>

            <ChevronDown
              size={17}
              className={`transition-transform ${
                sportsOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {sportsOpen && (
            <div className="absolute left-0 right-0 top-full z-[9999] mt-2 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#08101f] shadow-2xl backdrop-blur-none">
              {sports.map((sport) => {
                const isSelected =
                  sport.label ===
                  activeSport;

                return (
                  <button
                    key={sport.label}
                    type="button"
                    onClick={() =>
                      handleSportChange(
                        sport,
                      )
                    }
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold transition ${
                      isSelected
                        ? "bg-cyan-300/15 text-white"
                        : "bg-[#08101f] text-slate-400 hover:bg-[#111c31] hover:text-white"
                    }`}
                  >
                    <span className="text-base">
                      {sport.emoji}
                    </span>

                    <span>
                      {sport.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            const href =
              item.path === ""
                ? slateBasePath || "/"
                : `${slateBasePath}${item.path}`;

            const isActive =
              item.path === ""
                ? pathname === href
                : pathname === href ||
                  pathname.startsWith(
                    `${href}/`,
                  );

            return (
              <Link
                key={item.label}
                href={href}
                className={`relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  isActive
                    ? "border-cyan-300/35 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(35,216,255,0.16)]"
                    : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-pink-300/25 hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-pink-400 shadow-[0_0_12px_rgba(35,216,255,0.75)]" />
                )}

                <Icon size={17} />

                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-3 left-3 right-3 space-y-2">
          <Link
            href={
              currentSlateBase || "/"
            }
            className={`relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-sm font-bold transition ${
              isCurrentSlateSection
                ? "border-cyan-300/35 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(35,216,255,0.16)]"
                : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-cyan-300/25 hover:text-white"
            }`}
          >
            {isCurrentSlateSection && (
              <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-pink-400 shadow-[0_0_12px_rgba(35,216,255,0.75)]" />
            )}

            <CalendarDays size={17} />

            {currentSlateLabel}
          </Link>

          {(activeSport === "MLB" ||
            activeSport === "NFL") && (
            <Link
              href={nextSlateBase}
              className={`relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-sm font-bold transition ${
                isNextSection
                  ? "border-cyan-300/35 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(35,216,255,0.16)]"
                  : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-pink-300/25 hover:text-white"
              }`}
            >
              {isNextSection && (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-pink-400 shadow-[0_0_12px_rgba(35,216,255,0.75)]" />
              )}

              <CalendarDays size={17} />

              {nextSlateLabel}
            </Link>
          )}

          <div className="rounded-xl border border-cyan-300/15 bg-white/[0.035] p-3">
            <div className="text-sm font-black text-white">
              Model Engine
            </div>

            <div className="text-xs text-slate-400">
              v1.0.0
            </div>

            <div className="mt-2 text-xs font-bold text-emerald-300">
              ● All Systems Active
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-56">
  <div className="mx-auto max-w-[1500px] px-3 pb-3 pt-0">
    {children}
  </div>
</main>
    </div>
  );
}