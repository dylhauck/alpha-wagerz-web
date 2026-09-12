"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Home,
  LineChart,
  Swords,
  Target,
  Users,
  Shield,
  Menu,
  X,
} from "lucide-react";

type Sport =
  | "MLB"
  | "NFL"
  | "NBA"
  | "NHL"
  | "WNBA"
  | "MLS"
  | "UFC";

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
  {
    label: "MLB",
    emoji: "⚾",
    path: "/",
  },
  {
    label: "NFL",
    emoji: "🏈",
    path: "/nfl",
  },
  {
    label: "NBA",
    emoji: "🏀",
    path: "/nba",
  },
  {
    label: "NHL",
    emoji: "🏒",
    path: "/nhl",
  },
  {
    label: "WNBA",
    emoji: "🏀",
    path: "/wnba",
  },
  {
    label: "MLS",
    emoji: "⚽",
    path: "/mls",
  },
  {
    label: "UFC",
    emoji: "🥊",
    path: "/ufc",
  },
];

const mlbNavItems: NavItem[] = [
  {
    label: "Slate Summary",
    path: "",
    icon: Home,
  },
  {
    label: "Hitters",
    path: "/hitters",
    icon: Target,
  },
  {
    label: "Pitchers",
    path: "/pitchers",
    icon: Swords,
  },
  {
    label: "Weather Report",
    path: "/weather",
    icon: CloudSun,
  },
  {
    label: "Projections",
    path: "/projections",
    icon: LineChart,
  },
  {
    label: "Injury Report",
    path: "/injury-report",
    icon: BarChart3,
  },
  {
    label: "How To",
    path: "/how-to",
    icon: BookOpen,
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
    label: "Weather Report",
    path: "/weather",
    icon: CloudSun,
  },
  {
    label: "Projections",
    path: "/projections",
    icon: LineChart,
  },
  {
    label: "Injury Report",
    path: "/injuries",
    icon: BarChart3,
  },
  {
    label: "How To",
    path: "/how-to",
    icon: BookOpen,
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
  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
    setSportsOpen(false);
  }, [pathname]);

  const activeSport: Sport =
    pathname.startsWith("/nfl")
      ? "NFL"
      : pathname.startsWith("/nba")
        ? "NBA"
        : pathname.startsWith("/nhl")
          ? "NHL"
          : pathname.startsWith("/wnba")
            ? "WNBA"
            : pathname.startsWith("/mls")
              ? "MLS"
              : pathname.startsWith("/ufc")
                ? "UFC"
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
      ? "Next Slate"
      : "Today's Slate";

  const nextSlateLabel =
    activeSport === "NFL"
      ? "Future Slate"
      : "Tomorrow's Slate";

  function renderSidebarContent(
    mobile = false,
  ) {
    return (
      <>
        {!mobile && (
          <div className="mb-5 flex items-center justify-center pt-3">
            <Image
              src="/awlogo2.png"
              alt="Alpha Wagerz"
              width={190}
              height={190}
              priority
              className="h-auto w-[190px] object-contain"
            />
          </div>
        )}

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
            <div
              className={`left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#08101f] shadow-2xl ${
                mobile ? "relative" : "absolute top-full"
              }`}
            >
              {sports.map((sport) => {
                const isSelected =
                  sport.label ===
                  activeSport;

                return (
                  <button
                    key={sport.label}
                    type="button"
                    onClick={() => {
                      handleSportChange(
                        sport,
                      );
                      if (mobile) {
                        setMobileNavOpen(
                          false,
                        );
                      }
                    }}
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
                onClick={() => {
                  if (mobile) {
                    setMobileNavOpen(false);
                  }
                }}
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

        <div
          className={
            mobile
              ? "mt-5 space-y-2 pb-5"
              : "absolute bottom-3 left-3 right-3 space-y-2"
          }
        >
          <Link
            href={
              currentSlateBase || "/"
            }
            onClick={() => {
              if (mobile) {
                setMobileNavOpen(false);
              }
            }}
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
              onClick={() => {
                if (mobile) {
                  setMobileNavOpen(false);
                }
              }}
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
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 hidden h-screen w-56 border-r border-cyan-300/10 bg-slate-950/90 p-3 backdrop-blur-xl lg:block">
        {renderSidebarContent(false)}
      </aside>

      <header className="sticky top-0 z-[9999] isolate border-b border-cyan-300/10 bg-slate-950/95 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <Link
            href={
              activeSport === "NFL"
                ? "/nfl"
                : activeSport === "MLB"
                  ? "/"
                  : selectedSport.path
            }
            className="flex items-center"
            aria-label="Alpha Wagerz home"
            onClick={() => setMobileNavOpen(false)}
          >
            <Image
              src="/awlogo2.png"
              alt="Alpha Wagerz"
              width={140}
              height={60}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>

          <button
            type="button"
            onPointerUp={(e) => {
              e.preventDefault();
              setMobileNavOpen((open) => !open);
            }}
            className="relative z-[10000] flex h-11 w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(35,216,255,0.12)] transition active:scale-95 pointer-events-auto"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            aria-controls="alpha-mobile-menu"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileNavOpen && (
        <div
          id="alpha-mobile-menu"
          className="relative z-[9998] border-b border-cyan-300/10 bg-[#08101f] px-3 pb-4 pt-3 shadow-2xl lg:hidden"
        >
          <div className="mx-auto max-h-[calc(100dvh-80px)] max-w-[1500px] overflow-y-auto rounded-2xl border border-cyan-300/15 bg-slate-950 p-3">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      <main className="lg:pl-56">
        <div className="mx-auto max-w-[1500px] px-3 pb-3 pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}