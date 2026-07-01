import Link from "next/link";
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
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Top Hitters", href: "/hitters", icon: Target },
  { label: "Games", href: "/games", icon: Trophy },
  { label: "Pitchers", href: "/pitchers", icon: Swords },
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Trends", href: "/", icon: LineChart },
  { label: "Breakdown", href: "/", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 hidden h-screen w-56 border-r border-cyan-300/10 bg-slate-950/90 p-3 backdrop-blur-xl lg:block">
        <div className="mb-7 px-2 pt-2">
          <div className="text-2xl font-black tracking-tight neon-text">ALPHA</div>
          <div className="text-2xl font-black tracking-tight text-white">WAGERZ</div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition ${
                  index === 0
                    ? "border-cyan-300/35 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(35,216,255,0.16)]"
                    : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-pink-300/25 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-cyan-300/15 bg-white/[0.035] p-3">
          <div className="text-sm font-black text-white">Model Engine</div>
          <div className="text-xs text-slate-400">v1.0.0</div>
          <div className="mt-2 text-xs font-bold text-emerald-300">● All Systems Active</div>
        </div>
      </aside>

      <main className="lg:pl-56">
        <div className="mx-auto max-w-[1500px] px-3 py-3">{children}</div>
      </main>
    </div>
  );
}