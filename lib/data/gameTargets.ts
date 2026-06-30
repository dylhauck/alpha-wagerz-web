import { AnyRecord } from "@/lib/data/modelData";

export function getTopTargetsForSide(hitters: AnyRecord[] = [], limit = 2) {
  return [...hitters]
    .filter((hitter) => hitter?.Likely !== "" && hitter?.Likely !== undefined)
    .sort((a, b) => Number(b.Likely || 0) - Number(a.Likely || 0))
    .slice(0, limit);
}

export function getGameTopTargets(game: AnyRecord) {
  const awayHitters = game?.hitters?.away || [];
  const homeHitters = game?.hitters?.home || [];

  return {
    away: getTopTargetsForSide(awayHitters, 2),
    home: getTopTargetsForSide(homeHitters, 2),
  };
}