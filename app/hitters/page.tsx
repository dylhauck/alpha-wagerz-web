import { AppShell } from "@/components/AppShell";
import { HitterTable } from "@/components/HitterTable";
import { getTopHitters } from "@/lib/data/modelData";
import Image from "next/image";

export default function HittersPage() {
  const hitters = getTopHitters(250);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

      <HitterTable hitters={hitters} />
    </AppShell>
  );
}