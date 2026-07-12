import { AppShell } from "@/components/AppShell";
import { ProjectionsDashboard } from "@/components/trends/ProjectionsDashboard";
import { getGameProjections } from "@/lib/data/modelData";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default function TrendsPage() {
  const projections = getGameProjections();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppShell>
      <div className="mb-5 flex flex-col items-center pt-8">
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

      <ProjectionsDashboard projections={projections} />
    </AppShell>
  );
}