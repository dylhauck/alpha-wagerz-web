import Image from "next/image";
import { AppShell } from "@/components/AppShell";

function getToday() {
  return new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );
}

export default function NFLLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const today = getToday();

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
          {today}
        </div>
      </div>

      {children}
    </AppShell>
  );
}