import Image from "next/image";
import { getTeamCode, getTeamLogoUrl } from "@/lib/teamLogos";

export function TeamLogo({
  team,
  size = 42,
}: {
  team?: string;
  size?: number;
}) {
  return (
    <Image
      src={getTeamLogoUrl(team)}
      alt={team || "Team logo"}
      width={size}
      height={size}
      className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
    />
  );
}

export function TeamCode({ team }: { team?: string }) {
  return <span>{getTeamCode(team)}</span>;
}