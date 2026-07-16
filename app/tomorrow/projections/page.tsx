import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { ProjectionsDashboard } from "@/components/trends/ProjectionsDashboard";

export const dynamic = "force-dynamic";

type Projection = Record<string, any>;

function getTomorrowProjections(): Projection[] {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "tomorrow",
    "game_projections.json",
  );

  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const raw = fs.readFileSync(filePath, "utf-8").trim();

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as Projection[])
      : [];
  } catch (error) {
    console.error(
      "Unable to load tomorrow projections:",
      error,
    );

    return [];
  }
}

function getTomorrowLabel() {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TomorrowProjectionsPage() {
  const projections = getTomorrowProjections();
  const tomorrow = getTomorrowLabel();

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
          {tomorrow}
        </div>

        <div className="mt-2 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          Tomorrow&apos;s Projections
        </div>
      </div>

      <ProjectionsDashboard
        projections={projections}
      />
    </AppShell>
  );
}