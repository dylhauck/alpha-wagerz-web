import { AppShell } from "@/components/AppShell";
import { HitterTable } from "@/components/HitterTable";
import { getTopHitters } from "@/lib/data/modelData";

export default function HittersPage() {
  const hitters = getTopHitters(250);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200/70">
          Alpha Wagerz
        </div>
        <h1 className="mt-2 text-5xl font-black neon-text">Top Hitters</h1>
        <p className="mt-3 text-slate-400">
          Full slate HR target rankings with Kasper-style heat grading.
        </p>
      </div>

      <HitterTable hitters={hitters} />
    </AppShell>
  );
}