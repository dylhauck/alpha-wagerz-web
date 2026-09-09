"use client";

import Image from "next/image";
import Link from "next/link";

type ComingSoonPageProps = {
  title?: string;
  subtitle?: string;
  backHref?: string;
};

export default function ComingSoonPage({
  title = "Coming Soon",
  subtitle = "We're building the next evolution of Alpha Wagerz. This section will be available soon.",
  backHref = "/",
}: ComingSoonPageProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-24px)] items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/15 bg-[#050b16] px-6 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[15%] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[18%] h-[420px] w-[420px] rounded-full bg-pink-400/10 blur-[140px]" />

        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-gradient-to-t from-cyan-950/15 to-transparent" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="mx-auto flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-full bg-cyan-300/10 blur-3xl" />

            <Image
              src="/awlogo2.png"
              alt="Alpha Wagerz"
              width={260}
              height={260}
              priority
              className="relative z-10 h-auto w-[220px] object-contain sm:w-[260px]"
            />
          </div>
        </div>

        <div className="mt-4 text-xs font-black uppercase tracking-[0.35em] text-cyan-200/70">
          Alpha Wagerz
        </div>

        <h1 className="mt-3 text-5xl font-black uppercase tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-cyan-200 via-white to-pink-300 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>

        <div className="mx-auto mt-5 h-px max-w-md bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

        <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-7 text-slate-400 sm:text-lg">
          {subtitle}
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href={backHref}
            className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_24px_rgba(35,216,255,0.12)] transition hover:border-pink-300/40 hover:bg-pink-300/10 hover:text-white"
          >
            Back To Home
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(35,216,255,0.9)]" />
          <div className="h-2 w-2 rounded-full bg-white/30" />
          <div className="h-2 w-2 rounded-full bg-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
        </div>
      </div>
    </div>
  );
}