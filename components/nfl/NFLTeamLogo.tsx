"use client";

type NFLTeam = {
  abbr?: string;
  name?: string;
  logo?: string;
};

type Props = {
  team: string;
  teams?: NFLTeam[];
  size?: number;
  className?: string;
};

export function NFLTeamLogo({
  team,
  teams = [],
  size = 44,
  className = "",
}: Props) {
  const normalized = String(team || "")
    .trim()
    .toUpperCase();

  const teamData = teams.find(
    (item) =>
      String(item.abbr || "")
        .trim()
        .toUpperCase() === normalized,
  );

  const logo = teamData?.logo || "";

  if (!logo) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[10px] font-black text-slate-400 ${className}`}
        style={{
          width: size,
          height: size,
        }}
      >
        {normalized || "—"}
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src={logo}
        alt={`${normalized} logo`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </div>
  );
}