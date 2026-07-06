"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  CloudSun,
  Home,
  LineChart,
  Swords,
  Target,
  Trophy,
} from "lucide-react";

const navItems = [
  { label: "Slate Summary", href: "/", icon: Home },
  { label: "Alpha Hitters", href: "/hitters", icon: Target },
  { label: "Alpha Pitchers", href: "/pitchers", icon: Swords },
  { label: "Weather Edge Report", href: "/weather", icon: CloudSun },
  { label: "Alpha Projections", href: "/trends", icon: LineChart },
  { label: "Analysis Breakdown", href: "/breakdown", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
  key={item.label}
  href={item.href}
  className={`relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-sm font-bold transition ${
    isActive
      ? "border-cyan-300/35 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(35,216,255,0.16)]"
      : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-pink-300/25 hover:text-white"
  }`}
>
  {isActive && (
    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 to-pink-400 shadow-[0_0_12px_rgba(35,216,255,0.75)]" />
  )}

  <Icon size={17} />
  {item.label}
</Link>
            );
          })}
        </nav>

        <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-cyan-300/15 bg-white/[0.035] p-3">
          <div className="text-sm font-black text-white">Model Engine</div>
          <div className="text-xs text-slate-400">v1.0.0</div>
          <div className="mt-2 text-xs font-bold text-emerald-300">
            ● All Systems Active
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