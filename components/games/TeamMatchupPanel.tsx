import { TeamLogo } from "@/components/TeamLogo";

function valueOrDash(value: any) {
  return value === "" || value === null || value === undefined ? "—" : value;
}

function LogoBadge({ team }: { team: string }) {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      {/* Large ambient glow */}
      <div className="absolute inset-0 rounded-3xl bg-white/70 blur-2xl" />

      {/* Bright glass puck */}
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/60 bg-white/60 shadow-[0_0_30px_rgba(255,255,255,0.45),inset_0_2px_3px_rgba(255,255,255,0.8)] backdrop-blur-md">
        <TeamLogo team={team} size={58} />
      </div>
    </div>
  );
}

export function TeamMatchupPanel({
  team,
  context,
  align = "left",
}: {
  team: string;
  context?: Record<string, any>;
  align?: "left" | "right";
}) {
  const rank = context?.division_rank_label || "";
  const division = context?.division || "";
  const record = context?.record || "—";
  const gb = context?.games_back;

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.035] p-5 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <div
        className={`flex items-center gap-4 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        {align === "left" && <LogoBadge team={team} />}

        <div>
          <div className="text-2xl font-black text-white">{team}</div>

          <div className="mt-1 text-sm font-bold text-slate-400">
            {record} · {rank ? `${rank} ${division}` : "Division —"}
          </div>
        </div>

        {align === "right" && <LogoBadge team={team} />}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
            Record
          </div>

          <div className="mt-1 text-lg font-black text-white">
            {record}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-300/15 bg-pink-300/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-200">
            Division
          </div>

          <div className="mt-1 text-lg font-black text-white">
            {rank || "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            GB
          </div>

          <div className="mt-1 text-lg font-black text-white">
            {valueOrDash(gb)}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs font-bold text-slate-400">
        Streak:{" "}
        <span className="text-white">
          {valueOrDash(context?.streak)}
        </span>
      </div>
    </div>
  );
}