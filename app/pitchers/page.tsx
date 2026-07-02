import { AppShell } from "@/components/AppShell";
import { PitcherTable } from "@/components/pitchers/PitcherTable";
import { getAllPitchers } from "@/lib/data/modelData";
import Image from "next/image";

const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function PitchersPage() {
  const pitchers = getAllPitchers()
    .filter((p) => p.Pitcher)
    .sort((a, b) => Number(b["Strikeout Score"] || 0) - Number(a["Strikeout Score"] || 0));

  return (
    <AppShell>
      <div className="mb-3 pt-8 flex flex-col items-center">
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
      </div>

      <PitcherTable pitchers={pitchers} />
    </AppShell>
  );
}