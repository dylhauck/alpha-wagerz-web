"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getToday() {
  return formatDate(new Date());
}

function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export default function NBALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isNextSlate =
    pathname === "/nba/next" ||
    pathname.startsWith("/nba/next/");

  const [currentDate, setCurrentDate] = useState("");
  const [nextSlateDate, setNextSlateDate] = useState("");

  useEffect(() => {
    setCurrentDate(getToday());
  }, []);

  useEffect(() => {
    if (!isNextSlate) return;

    let active = true;

    async function loadNextSlateDate() {
      try {
        const response = await fetch(
          "/data/nba/next/slate.json",
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Failed to load next NBA slate");
        }

        const data = await response.json();

        if (!active) return;

        if (data.slate_date) {
          const date = new Date(
            `${data.slate_date}T12:00:00`
          );

          if (!Number.isNaN(date.getTime())) {
            setNextSlateDate(formatDate(date));
            return;
          }
        }

        setNextSlateDate(getTomorrow());
      } catch (error) {
        console.error(
          "Unable to load next NBA slate date:",
          error
        );

        if (active) {
          setNextSlateDate(getTomorrow());
        }
      }
    }

    loadNextSlateDate();

    return () => {
      active = false;
    };
  }, [isNextSlate]);

  const displayedDate = isNextSlate
    ? nextSlateDate || currentDate
    : currentDate;

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
          {displayedDate}
        </div>
      </div>

      {children}
    </AppShell>
  );
}