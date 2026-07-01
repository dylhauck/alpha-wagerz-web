import { AppShell } from "@/components/AppShell";
import { PitcherTable } from "@/components/pitchers/PitcherTable";
import { getAllPitchers } from "@/lib/data/modelData";

export default function PitchersPage() {
  const pitchers = getAllPitchers()
    .filter((p) => p.Pitcher)
    .sort((a, b) => Number(b["Strikeout Score"] || 0) - Number(a["Strikeout Score"] || 0));

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-200/70">
          Alpha Pitcher Model
        </div>
        <h1 className="mt-2 text-5xl font-black neon-text">Pitchers</h1>
        <p className="mt-3 text-slate-400">
          Pitch score, K upside, HR vulnerability, fly-ball and barrel profile.
        </p>
      </div>

      <PitcherTable pitchers={pitchers} />
    </AppShell>
  );
}