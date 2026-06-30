import fs from "fs";
import path from "path";

export type AnyRecord = Record<string, any>;

const DATA_FILE = path.join(process.cwd(), "public", "data", "all_games.json");

export function getAllGames(): AnyRecord[] {
  if (!fs.existsSync(DATA_FILE)) return [];

  const raw = fs.readFileSync(DATA_FILE, "utf-8");

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getAllHitters() {
  const games = getAllGames();
  const hitters: AnyRecord[] = [];

  for (const game of games) {
    const hittersObj = game.hitters || {};

    for (const side of ["away", "home"]) {
      const team = side === "away" ? game.away_team : game.home_team;

      for (const hitter of hittersObj[side] || []) {
        hitters.push({
          ...hitter,
          game: game.game,
          game_id: game.game_id,
          team,
          side,
          venue: game.venue,
          weather: game.weather,
        });
      }
    }
  }

  return hitters;
}

export function getTopHitters(limit = 50) {
  return getAllHitters()
    .filter((hitter) => hitter.Likely !== "" && hitter.Likely !== undefined)
    .sort((a, b) => Number(b.Likely || 0) - Number(a.Likely || 0))
    .slice(0, limit);
}

export function getAllPitchers() {
  const games = getAllGames();
  const pitchers: AnyRecord[] = [];

  for (const game of games) {
    for (const pitcher of game.pitchers || []) {
      pitchers.push({
        ...pitcher,
        game: game.game,
        game_id: game.game_id,
        venue: game.venue,
      });
    }
  }

  return pitchers;
}