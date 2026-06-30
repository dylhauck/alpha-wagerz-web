import { BarChart3, CloudSun, Home, Swords, Target, Trophy } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Home },
  { label: "Top Hitters", icon: Target },
  { label: "Pitchers", icon: Swords },
  { label: "Weather", icon: CloudSun },
  { label: "Breakdown", icon: BarChart3 },
  { label: "Rankings", icon: Trophy },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-cyan-300/10 bg-slate-950/80 p-5 backdrop-blur-xl lg:block">
        <div className="mb-8">
          <div className="text-3xl font-black tracking-tight neon-text">Alpha Wagerz</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/60">
            Model Terminal
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                  index === 0
                    ? "border-cyan-300/30 bg-cyan-300/10 text-white shadow-[0_0_18px_rgba(35,216,255,0.12)]"
                    : "border-white/5 bg-white/[0.03] text-slate-400 hover:border-pink-300/25 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-pink-300/20 bg-pink-500/10 p-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-pink-200">
            V1 Engine
          </div>
          <div className="mt-2 text-sm text-slate-300">
            Statcast, weather, park, bullpen, arsenal and matchup modeling active.
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}