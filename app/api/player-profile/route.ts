import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;
type Group = "hitting" | "pitching";
type RangeKey = "season" | "last7" | "last14" | "last30" | "career";
type ViewKey = "vsLHP" | "vsRHP" | "matchup" | "overall" | "home" | "away";
type ScheduleGame = { gamePk: number; gameDate: string };

const MLB_BASE = "https://statsapi.mlb.com/api/v1";
const CACHE_TTL_MS = 15 * 60 * 1000;
const responseCache = new Map<string, { expires: number; data: AnyRecord }>();

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedName(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return dateOnly(date);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateOnly(date);
}

function rangeStart(range: RangeKey) {
  if (range === "last7") return subtractDays(7);
  if (range === "last14") return subtractDays(14);
  if (range === "last30") return subtractDays(30);
  return undefined;
}

async function fetchJson(url: string): Promise<AnyRecord> {
  const cached = responseCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.data;

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "Alpha-Wagerz/1.0" },
  });

  if (!response.ok) throw new Error(`MLB request failed (${response.status})`);

  const data = (await response.json()) as AnyRecord;
  responseCache.set(url, { expires: Date.now() + CACHE_TTL_MS, data });
  return data;
}

function statSplits(payload: AnyRecord) {
  const groups = Array.isArray(payload?.stats)
    ? payload.stats
    : [];

  return groups.flatMap((group: AnyRecord) =>
    Array.isArray(group?.splits)
      ? group.splits
      : [],
  );
}

function firstStat(payload: AnyRecord) {
  const split = statSplits(payload).find(
    (item: AnyRecord) =>
      item?.stat &&
      Object.keys(item.stat).length > 0,
  );

  return split?.stat ?? {};
}

function situationStat(
  payload: AnyRecord,
  sitCode: "vl" | "vr",
) {
  const splits = statSplits(payload);

  const wantedTerms =
    sitCode === "vl"
      ? ["vs left", "left-handed", "left handed"]
      : ["vs right", "right-handed", "right handed"];

  const matchingSplit = splits.find((split: AnyRecord) => {
    const searchable = [
      split?.code,
      split?.description,
      split?.split?.code,
      split?.split?.description,
      split?.sitCode,
      split?.sitCodes,
    ]
      .map((value) => clean(value).toLowerCase())
      .join(" ");

    if (searchable.includes(sitCode)) return true;

    return wantedTerms.some((term) =>
      searchable.includes(term),
    );
  });

  return matchingSplit?.stat ?? firstStat(payload);
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInningsToOuts(value: unknown) {
  const text = clean(value);
  if (!text) return 0;
  const [wholeText, outsText = "0"] = text.split(".");
  const whole = num(wholeText);
  const outs = Math.min(2, Math.max(0, num(outsText)));
  return whole * 3 + outs;
}

function outsToInnings(outs: number) {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

function safeRate(numerator: number, denominator: number, digits = 3) {
  return denominator ? Number((numerator / denominator).toFixed(digits)) : null;
}

function normalizeHitting(stat: AnyRecord) {
  if (!stat || Object.keys(stat).length === 0) return {};

  return {
    G: stat.gamesPlayed ?? stat.games ?? 0,
    PA: stat.plateAppearances ?? 0,
    AB: stat.atBats ?? 0,
    R: stat.runs ?? 0,
    H: stat.hits ?? 0,
    "2B": stat.doubles ?? 0,
    "3B": stat.triples ?? 0,
    HR: stat.homeRuns ?? 0,
    RBI: stat.rbi ?? 0,
    BB: stat.baseOnBalls ?? stat.walks ?? 0,
    SO: stat.strikeOuts ?? stat.strikeouts ?? 0,
    SB: stat.stolenBases ?? 0,
    CS: stat.caughtStealing ?? 0,
    AVG: stat.avg ?? null,
    OBP: stat.obp ?? null,
    SLG: stat.slg ?? null,
    OPS: stat.ops ?? null,
    ISO:
      stat.slg !== undefined && stat.avg !== undefined
        ? Number((Number(stat.slg) - Number(stat.avg)).toFixed(3))
        : null,
  };
}

function normalizePitching(stat: AnyRecord) {
  if (!stat || Object.keys(stat).length === 0) return {};

  const outs = parseInningsToOuts(stat.inningsPitched);
  const innings = outs / 3;
  const strikeouts = num(stat.strikeOuts ?? stat.strikeouts);
  const walks = num(stat.baseOnBalls ?? stat.walks);
  const hits = num(stat.hits);
  const homeRuns = num(stat.homeRuns ?? stat.homeRunsAllowed);
  const battersFaced =
    num(stat.battersFaced) ||
    num(stat.plateAppearances) ||
    num(stat.atBats) +
      walks +
      num(stat.hitByPitch) +
      num(stat.sacFlies) +
      num(stat.sacBunts);

  return {
    G: stat.gamesPlayed ?? stat.games ?? null,
    GS: stat.gamesStarted ?? null,
    IP: stat.inningsPitched ?? null,
    W: stat.wins ?? null,
    L: stat.losses ?? null,
    ERA: stat.era ?? null,
    WHIP: stat.whip ?? null,
    K: stat.strikeOuts ?? stat.strikeouts ?? null,
    BB: stat.baseOnBalls ?? stat.walks ?? null,
    HR: stat.homeRuns ?? stat.homeRunsAllowed ?? null,
    "K/9":
      stat.strikeoutsPer9Inn ??
      stat.strikeoutsPer9Innings ??
      (innings ? Number(((strikeouts * 9) / innings).toFixed(2)) : null),
    "BB/9":
      stat.walksPer9Inn ??
      stat.walksPer9Innings ??
      (innings ? Number(((walks * 9) / innings).toFixed(2)) : null),
    "H/9":
      stat.hitsPer9Inn ??
      stat.hitsPer9Innings ??
      (innings ? Number(((hits * 9) / innings).toFixed(2)) : null),
    "HR/9":
      stat.homeRunsPer9 ??
      stat.homeRunsPer9Inn ??
      (innings ? Number(((homeRuns * 9) / innings).toFixed(2)) : null),
    "K%":
      stat.strikeoutPercentage ??
      (battersFaced
        ? Number(((strikeouts / battersFaced) * 100).toFixed(1))
        : null),
    "BB%":
      stat.walkPercentage ??
      (battersFaced
        ? Number(((walks / battersFaced) * 100).toFixed(1))
        : null),
    "OPP AVG":
      stat.avg ??
      stat.opponentAvg ??
      (battersFaced
        ? safeRate(hits, Math.max(1, battersFaced - walks))
        : null),
  };
}

function aggregateHitting(splits: AnyRecord[]) {
  let pa = 0, ab = 0, r = 0, h = 0, doubles = 0, triples = 0;
  let hr = 0, rbi = 0, bb = 0, so = 0, sb = 0, cs = 0, hbp = 0, sf = 0;
  const games = new Set<string>();

  for (const split of splits) {
    const stat = split?.stat ?? {};
    games.add(clean(split?.game?.gamePk ?? split?.date));
    pa += num(stat.plateAppearances);
    ab += num(stat.atBats);
    r += num(stat.runs);
    h += num(stat.hits);
    doubles += num(stat.doubles);
    triples += num(stat.triples);
    hr += num(stat.homeRuns);
    rbi += num(stat.rbi);
    bb += num(stat.baseOnBalls ?? stat.walks);
    so += num(stat.strikeOuts ?? stat.strikeouts);
    sb += num(stat.stolenBases);
    cs += num(stat.caughtStealing);
    hbp += num(stat.hitByPitch);
    sf += num(stat.sacFlies);
  }

  const singles = h - doubles - triples - hr;
  const totalBases = singles + doubles * 2 + triples * 3 + hr * 4;
  const avg = safeRate(h, ab);
  const obp = safeRate(h + bb + hbp, ab + bb + hbp + sf);
  const slg = safeRate(totalBases, ab);

  return {
    G: [...games].filter(Boolean).length || splits.length,
    PA: pa, AB: ab, R: r, H: h, "2B": doubles, "3B": triples,
    HR: hr, RBI: rbi, BB: bb, SO: so, SB: sb, CS: cs,
    AVG: avg, OBP: obp, SLG: slg,
    OPS: obp !== null && slg !== null ? Number((obp + slg).toFixed(3)) : null,
    ISO: avg !== null && slg !== null ? Number((slg - avg).toFixed(3)) : null,
  };
}

function aggregatePitching(splits: AnyRecord[]) {
  let outs = 0, gs = 0, wins = 0, losses = 0, er = 0;
  let hits = 0, strikeouts = 0, walks = 0, hr = 0, bf = 0;
  const games = new Set<string>();

  for (const split of splits) {
    const stat = split?.stat ?? {};
    games.add(clean(split?.game?.gamePk ?? split?.date));
    outs += parseInningsToOuts(stat.inningsPitched);
    gs += num(stat.gamesStarted);
    wins += num(stat.wins);
    losses += num(stat.losses);
    er += num(stat.earnedRuns);
    hits += num(stat.hits);
    strikeouts += num(stat.strikeOuts ?? stat.strikeouts);
    walks += num(stat.baseOnBalls ?? stat.walks);
    hr += num(stat.homeRuns ?? stat.homeRunsAllowed);
    const splitBattersFaced =
  num(stat.battersFaced) ||
  num(stat.plateAppearances) ||
  (
    num(stat.atBats) +
    num(stat.baseOnBalls ?? stat.walks) +
    num(stat.hitByPitch) +
    num(stat.sacFlies) +
    num(stat.sacBunts)
  );

bf += splitBattersFaced;
  }

  const innings = outs / 3;
  return {
    G: [...games].filter(Boolean).length || splits.length,
    GS: gs,
    IP: outsToInnings(outs),
    W: wins,
    L: losses,
    ERA: innings ? Number(((er * 9) / innings).toFixed(2)) : null,
    WHIP: innings ? Number(((walks + hits) / innings).toFixed(3)) : null,
    K: strikeouts,
    BB: walks,
    HR: hr,
    "K/9": innings ? Number(((strikeouts * 9) / innings).toFixed(2)) : null,
    "BB/9": innings ? Number(((walks * 9) / innings).toFixed(2)) : null,
    "H/9": innings ? Number(((hits * 9) / innings).toFixed(2)) : null,
    "HR/9": innings ? Number(((hr * 9) / innings).toFixed(2)) : null,
    "K%": bf ? Number(((strikeouts / bf) * 100).toFixed(1)) : null,
    "BB%": bf ? Number(((walks / bf) * 100).toFixed(1)) : null,
    "OPP AVG": bf ? safeRate(hits, Math.max(1, bf - walks)) : null,
  };
}

function aggregate(group: Group, splits: AnyRecord[]) {
  return group === "pitching" ? aggregatePitching(splits) : aggregateHitting(splits);
}

function splitDate(split: AnyRecord) {
  return clean(split?.date ?? split?.gameDate);
}

function splitOpponentId(split: AnyRecord) {
  return Number(split?.opponent?.id ?? split?.opponent?.team?.id ?? 0);
}

function splitIsHome(split: AnyRecord, teamId: number) {
  if (typeof split?.isHome === "boolean") return split.isHome;
  const homeTeamId = Number(split?.game?.teams?.home?.team?.id ?? 0);
  const splitTeamId = Number(split?.team?.id ?? teamId);
  return Boolean(homeTeamId && splitTeamId === homeTeamId);
}

function filterGameLogs(
  splits: AnyRecord[],
  options: {
    startDate?: string;
    endDate?: string;
    venue?: "overall" | "home" | "away";
    opponentTeamId?: number;
    teamId: number;
  },
) {
  return splits.filter((split) => {
    const date = splitDate(split);
    if (options.startDate && date && date < options.startDate) return false;
    if (options.endDate && date && date > options.endDate) return false;
    if (options.opponentTeamId && splitOpponentId(split) !== options.opponentTeamId) return false;

    if (options.venue && options.venue !== "overall") {
      const isHome = splitIsHome(split, options.teamId);
      if (options.venue === "home" && !isHome) return false;
      if (options.venue === "away" && isHome) return false;
    }

    return true;
  });
}

async function resolveTeamId(teamName: string, season: number) {
  if (!teamName) return null;
  const payload = await fetchJson(`${MLB_BASE}/teams?sportId=1&season=${season}`);
  const target = normalizedName(teamName);
  const team = (payload?.teams ?? []).find((candidate: AnyRecord) =>
    [candidate?.name, candidate?.teamName, candidate?.clubName, candidate?.shortName, candidate?.locationName]
      .some((name) => normalizedName(name) === target),
  );
  return team?.id ?? null;
}

async function resolvePlayerId(
  playerName: string,
  teamName: string,
  season: number,
) {
  if (!playerName) return null;

  const targetName = normalizedName(playerName);
  const targetTeam = normalizedName(teamName);

  const seasonsToCheck = [
    season,
    season - 1,
    season - 2,
  ];

  for (const lookupSeason of seasonsToCheck) {
    try {
      const payload = await fetchJson(
        `${MLB_BASE}/sports/1/players?season=${lookupSeason}&hydrate=currentTeam`,
      );

      const candidates = (payload?.people ?? []).filter(
        (candidate: AnyRecord) =>
          normalizedName(candidate?.fullName) === targetName,
      );

      if (candidates.length === 1) {
        return Number(candidates[0]?.id) || null;
      }

      if (candidates.length > 1 && targetTeam) {
        const teamMatch = candidates.find((candidate: AnyRecord) => {
          const possibleTeamNames = [
            candidate?.currentTeam?.name,
            candidate?.currentTeam?.teamName,
            candidate?.currentTeam?.clubName,
            candidate?.currentTeam?.shortName,
            candidate?.currentTeam?.locationName,
          ];

          return possibleTeamNames.some(
            (name) => normalizedName(name) === targetTeam,
          );
        });

        if (teamMatch?.id) {
          return Number(teamMatch.id);
        }
      }

      if (candidates[0]?.id) {
        return Number(candidates[0].id);
      }
    } catch (error) {
      console.warn(
        `Unable to search players for season ${lookupSeason}:`,
        error,
      );
    }
  }

  try {
    const searchParams = new URLSearchParams({
      names: playerName,
      hydrate: "currentTeam",
    });

    const payload = await fetchJson(
      `${MLB_BASE}/people/search?${searchParams.toString()}`,
    );

    const candidates = (payload?.people ?? []).filter(
      (candidate: AnyRecord) =>
        normalizedName(candidate?.fullName) === targetName,
    );

    if (targetTeam) {
      const teamMatch = candidates.find((candidate: AnyRecord) => {
        const possibleTeamNames = [
          candidate?.currentTeam?.name,
          candidate?.currentTeam?.teamName,
          candidate?.currentTeam?.clubName,
          candidate?.currentTeam?.shortName,
          candidate?.currentTeam?.locationName,
        ];

        return possibleTeamNames.some(
          (name) => normalizedName(name) === targetTeam,
        );
      });

      if (teamMatch?.id) {
        return Number(teamMatch.id);
      }
    }

    return Number(candidates[0]?.id) || null;
  } catch (error) {
    console.warn(`Unable to search MLB player ${playerName}:`, error);
    return null;
  }
}

async function getPerson(playerId: number) {
  const payload = await fetchJson(`${MLB_BASE}/people/${playerId}?hydrate=currentTeam`);
  return payload?.people?.[0] ?? {};
}

async function getPlayerStats(
  playerId: number,
  group: Group,
  stats: string,
  season: number,
  options: {
    startDate?: string;
    endDate?: string;
    sitCode?: string;
    opposingPlayerId?: number;
    opposingTeamId?: number;
    omitSeason?: boolean;
    teamId?: number;
  } = {},
) {
  const params = new URLSearchParams({ stats, group });

  if (stats !== "career" && !options.omitSeason) {
    params.set("season", String(season));
  }

  if (options.startDate) params.set("startDate", options.startDate);
  if (options.endDate) params.set("endDate", options.endDate);
  if (options.sitCode) params.set("sitCodes", options.sitCode);

  if (options.opposingPlayerId) {
    params.set("opposingPlayerId", String(options.opposingPlayerId));
  }

  if (options.opposingTeamId) {
    params.set("opposingTeamId", String(options.opposingTeamId));
  }

  if (options.teamId) {
    params.set("teamId", String(options.teamId));
  }

  return fetchJson(
    `${MLB_BASE}/people/${playerId}/stats?${params.toString()}`,
  );
}

async function getPlayerGameLog(playerId: number, group: Group, season: number) {
  const params = new URLSearchParams({ stats: "gameLog", group, season: String(season), hydrate: "game" });
  return fetchJson(`${MLB_BASE}/people/${playerId}/stats?${params.toString()}`);
}

async function getPlayerCareerGameLogSplits(
  playerId: number,
  group: Group,
  currentSeason: number,
) {
  let seasons: number[] = [];

  try {
    const yearByYear = await getPlayerStats(
      playerId,
      group,
      "yearByYear",
      currentSeason,
      { omitSeason: true },
    );

    seasons = statSplits(yearByYear)
      .map((split: AnyRecord) => Number(split?.season ?? 0))
      .filter(
        (seasonNumber: number) =>
          Number.isInteger(seasonNumber) &&
          seasonNumber > 0 &&
          seasonNumber <= currentSeason,
      );
  } catch (error) {
    console.warn(`Unable to load career seasons for player ${playerId}:`, error);
  }

  seasons = [...new Set(seasons)];
  if (!seasons.includes(currentSeason)) seasons.push(currentSeason);
  seasons.sort((a, b) => a - b);

  const seasonLogs = await mapInBatches(
    seasons,
    4,
    async (seasonNumber: number) => {
      try {
        return statSplits(
          await getPlayerGameLog(playerId, group, seasonNumber),
        );
      } catch (error) {
        console.warn(
          `Unable to load ${seasonNumber} game log for player ${playerId}:`,
          error,
        );
        return [] as AnyRecord[];
      }
    },
  );

  return seasonLogs.flat();
}

async function getTeamGameLog(teamId: number, group: Group, season: number) {
  const params = new URLSearchParams({ stats: "gameLog", group, season: String(season), hydrate: "game" });
  return fetchJson(`${MLB_BASE}/teams/${teamId}/stats?${params.toString()}`);
}

async function getTeamSplit(
  teamId: number,
  group: Group,
  season: number,
  sitCode: "vl" | "vr",
) {
  const params = new URLSearchParams({
    stats: "statSplits",
    group,
    season: String(season),
    sitCodes: sitCode,
  });

  return fetchJson(
    `${MLB_BASE}/teams/${teamId}/stats?${params.toString()}`,
  );
}


type HittingAccumulator = {
  games: Set<number>;
  pa: number;
  ab: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  hitByPitch: number;
  sacFlies: number;
};

type PitchingAccumulator = {
  games: Set<number>;
  starts: Set<number>;
  outs: number;
  earnedRuns: number;
  hits: number;
  strikeouts: number;
  walks: number;
  homeRuns: number;
  battersFaced: number;
};

type HandednessAccumulator = {
  hitting: {
    vl: HittingAccumulator;
    vr: HittingAccumulator;
  };
  pitching: {
    vl: PitchingAccumulator;
    vr: PitchingAccumulator;
  };
};

function createHittingAccumulator(): HittingAccumulator {
  return {
    games: new Set<number>(),
    pa: 0,
    ab: 0,
    runs: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    rbi: 0,
    walks: 0,
    strikeouts: 0,
    stolenBases: 0,
    caughtStealing: 0,
    hitByPitch: 0,
    sacFlies: 0,
  };
}

function createPitchingAccumulator(): PitchingAccumulator {
  return {
    games: new Set<number>(),
    starts: new Set<number>(),
    outs: 0,
    earnedRuns: 0,
    hits: 0,
    strikeouts: 0,
    walks: 0,
    homeRuns: 0,
    battersFaced: 0,
  };
}

function createHandednessAccumulator(): HandednessAccumulator {
  return {
    hitting: {
      vl: createHittingAccumulator(),
      vr: createHittingAccumulator(),
    },
    pitching: {
      vl: createPitchingAccumulator(),
      vr: createPitchingAccumulator(),
    },
  };
}

function normalizeHandCode(value: unknown): "L" | "R" | "" {
  const code = clean(value).toUpperCase();
  return code === "L" || code === "R" ? code : "";
}

function pitcherHandFromPlay(play: AnyRecord): "L" | "R" | "" {
  const possibleValues = [
    play?.matchup?.pitchHand?.code,
    play?.matchup?.pitchHand?.description,
    play?.matchup?.pitcher?.pitchHand?.code,
    play?.matchup?.pitcher?.pitchHand?.description,
  ];

  for (const value of possibleValues) {
    const normalized = clean(value).toUpperCase();

    if (
      normalized === "L" ||
      normalized === "LEFT" ||
      normalized === "LEFT-HANDED"
    ) {
      return "L";
    }

    if (
      normalized === "R" ||
      normalized === "RIGHT" ||
      normalized === "RIGHT-HANDED"
    ) {
      return "R";
    }
  }

  return "";
}

function eventTypeOf(play: AnyRecord) {
  return clean(play?.result?.eventType).toLowerCase();
}

function isWalkEvent(eventType: string) {
  return eventType === "walk" || eventType === "intent_walk";
}

function isStrikeoutEvent(eventType: string) {
  return eventType === "strikeout" || eventType === "strikeout_double_play";
}

function isHitEvent(eventType: string) {
  return ["single", "double", "triple", "home_run"].includes(eventType);
}

function isAtBatEvent(eventType: string) {
  return ![
    "walk",
    "intent_walk",
    "hit_by_pitch",
    "sac_fly",
    "sac_bunt",
    "catcher_interf",
    "catcher_interference",
  ].includes(eventType);
}

function countRunsOnPlay(play: AnyRecord) {
  const runners = Array.isArray(play?.runners) ? play.runners : [];

  return runners.filter(
    (runner: AnyRecord) =>
      runner?.movement?.isScoringEvent === true ||
      runner?.movement?.end === "score",
  ).length;
}

function countRunnerEvent(play: AnyRecord, names: string[]) {
  const runners = Array.isArray(play?.runners) ? play.runners : [];

  return runners.filter((runner: AnyRecord) => {
    const eventType = clean(
      runner?.details?.eventType ??
        runner?.details?.event ??
        runner?.movement?.reason,
    ).toLowerCase();

    return names.includes(eventType);
  }).length;
}

function finalizeHitting(acc: HittingAccumulator) {
  const singles = acc.hits - acc.doubles - acc.triples - acc.homeRuns;
  const totalBases =
    singles +
    acc.doubles * 2 +
    acc.triples * 3 +
    acc.homeRuns * 4;

  const avg = safeRate(acc.hits, acc.ab);
  const obp = safeRate(
    acc.hits + acc.walks + acc.hitByPitch,
    acc.ab + acc.walks + acc.hitByPitch + acc.sacFlies,
  );
  const slg = safeRate(totalBases, acc.ab);

  return {
    G: acc.games.size,
    PA: acc.pa,
    AB: acc.ab,
    R: acc.runs,
    H: acc.hits,
    "2B": acc.doubles,
    "3B": acc.triples,
    HR: acc.homeRuns,
    RBI: acc.rbi,
    BB: acc.walks,
    SO: acc.strikeouts,
    SB: acc.stolenBases,
    CS: acc.caughtStealing,
    AVG: avg,
    OBP: obp,
    SLG: slg,
    OPS:
      obp !== null && slg !== null
        ? Number((obp + slg).toFixed(3))
        : null,
    ISO:
      avg !== null && slg !== null
        ? Number((slg - avg).toFixed(3))
        : null,
  };
}

function finalizePitching(acc: PitchingAccumulator) {
  const innings = acc.outs / 3;

  return {
    G: acc.games.size,
    GS: acc.starts.size,
    IP: outsToInnings(acc.outs),
    W: null,
    L: null,
    ERA:
      innings
        ? Number(((acc.earnedRuns * 9) / innings).toFixed(2))
        : null,
    WHIP:
      innings
        ? Number(((acc.walks + acc.hits) / innings).toFixed(3))
        : null,
    K: acc.strikeouts,
    BB: acc.walks,
    HR: acc.homeRuns,
    "K/9":
      innings
        ? Number(((acc.strikeouts * 9) / innings).toFixed(2))
        : null,
    "BB/9":
      innings
        ? Number(((acc.walks * 9) / innings).toFixed(2))
        : null,
    "H/9":
      innings
        ? Number(((acc.hits * 9) / innings).toFixed(2))
        : null,
    "HR/9":
      innings
        ? Number(((acc.homeRuns * 9) / innings).toFixed(2))
        : null,
    "K%":
      acc.battersFaced
        ? Number(((acc.strikeouts / acc.battersFaced) * 100).toFixed(1))
        : null,
    "BB%":
      acc.battersFaced
        ? Number(((acc.walks / acc.battersFaced) * 100).toFixed(1))
        : null,
    "OPP AVG": safeRate(
      acc.hits,
      Math.max(1, acc.battersFaced - acc.walks),
    ),
  };
}

async function getTeamGamesForRange(
  teamId: number,
  startDate: string,
  endDate: string,
): Promise<ScheduleGame[]> {
  const params = new URLSearchParams({
    sportId: "1",
    teamId: String(teamId),
    startDate,
    endDate,
    gameType: "R",
  });

  const payload = await fetchJson(
    `${MLB_BASE}/schedule?${params.toString()}`,
  );

  return (payload?.dates ?? [])
    .flatMap((dateEntry: AnyRecord) =>
      (dateEntry?.games ?? []).map((game: AnyRecord) => ({
        gamePk: Number(game?.gamePk ?? 0),
        gameDate: clean(game?.officialDate ?? dateEntry?.date),
      })),
    )
    .filter((game: ScheduleGame) => game.gamePk > 0) as ScheduleGame[];
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  callback: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(callback));
    results.push(...batchResults);
  }

  return results;
}

async function getTeamGameFeeds(
  teamId: number,
  startDate: string,
  endDate: string,
) {
  const games = await getTeamGamesForRange(teamId, startDate, endDate);

  return mapInBatches(games, 4, async (game) => {
    try {
      const feed = await fetchJson(
        `${MLB_BASE}/game/${game.gamePk}/feed/live`,
      );

      return {
        gamePk: game.gamePk,
        gameDate: game.gameDate,
        feed,
      };
    } catch (error) {
      console.warn(
        `Unable to load play-by-play for game ${game.gamePk}:`,
        error,
      );
      return null;
    }
  }).then((feeds) =>
    feeds.filter(
      (
        item,
      ): item is {
        gamePk: number;
        gameDate: string;
        feed: AnyRecord;
      } => item !== null,
    ),
  );
}

function buildTeamHandednessFromFeeds(
  teamId: number,
  feeds: Array<{
    gamePk: number;
    gameDate: string;
    feed: AnyRecord;
  }>,
  startDate: string,
) {
  const result = createHandednessAccumulator();

  for (const { gamePk, gameDate, feed } of feeds) {
    if (gameDate < startDate) continue;

    const homeTeamId = Number(feed?.gameData?.teams?.home?.id ?? 0);
    const awayTeamId = Number(feed?.gameData?.teams?.away?.id ?? 0);
    const teamIsHome = homeTeamId === teamId;
    const teamIsAway = awayTeamId === teamId;

    if (!teamIsHome && !teamIsAway) continue;

    const plays = Array.isArray(feed?.liveData?.plays?.allPlays)
      ? feed.liveData.plays.allPlays
      : [];

    const firstPitcherByHalf = new Map<string, number>();
    const previousOutsByHalf = new Map<string, number>();

    for (const play of plays) {
      const inning = Number(play?.about?.inning ?? 0);
      const half = clean(play?.about?.halfInning).toLowerCase();
      const halfKey = `${inning}-${half}`;
      const battingTeamId = half === "top" ? awayTeamId : homeTeamId;
      const pitchingTeamId = half === "top" ? homeTeamId : awayTeamId;

      const batterHand = normalizeHandCode(play?.matchup?.batSide?.code);
      const pitcherHand = pitcherHandFromPlay(play);
      const pitcherId = Number(play?.matchup?.pitcher?.id ?? 0);

      if (pitcherId && !firstPitcherByHalf.has(halfKey)) {
        firstPitcherByHalf.set(halfKey, pitcherId);
      }

      const currentOuts = Number(play?.count?.outs ?? 0);
      const previousOuts = previousOutsByHalf.get(halfKey) ?? 0;
      const outsOnPlay =
        currentOuts >= previousOuts
          ? currentOuts - previousOuts
          : currentOuts;
      previousOutsByHalf.set(halfKey, currentOuts);

      const eventType = eventTypeOf(play);
      const runs = countRunsOnPlay(play);
      const rbi = num(play?.result?.rbi);
      const stolenBases = countRunnerEvent(play, [
        "stolen_base_2b",
        "stolen_base_3b",
        "stolen_base_home",
        "stolen base 2b",
        "stolen base 3b",
        "stolen base home",
      ]);
      const caughtStealing = countRunnerEvent(play, [
        "caught_stealing_2b",
        "caught_stealing_3b",
        "caught_stealing_home",
        "pickoff_caught_stealing_2b",
        "pickoff_caught_stealing_3b",
        "pickoff_caught_stealing_home",
      ]);

      if (battingTeamId === teamId && pitcherHand) {
        const key = pitcherHand === "L" ? "vl" : "vr";
        const acc = result.hitting[key];

        acc.games.add(gamePk);
        acc.pa += 1;
        if (isAtBatEvent(eventType)) acc.ab += 1;
        acc.runs += runs;
        acc.rbi += rbi;
        acc.stolenBases += stolenBases;
        acc.caughtStealing += caughtStealing;

        if (isHitEvent(eventType)) {
          acc.hits += 1;
          if (eventType === "double") acc.doubles += 1;
          if (eventType === "triple") acc.triples += 1;
          if (eventType === "home_run") acc.homeRuns += 1;
        }

        if (isWalkEvent(eventType)) acc.walks += 1;
        if (isStrikeoutEvent(eventType)) acc.strikeouts += 1;
        if (eventType === "hit_by_pitch") acc.hitByPitch += 1;
        if (eventType === "sac_fly") acc.sacFlies += 1;
      }

      if (pitchingTeamId === teamId && batterHand) {
        const key = batterHand === "L" ? "vl" : "vr";
        const acc = result.pitching[key];

        acc.games.add(gamePk);
        acc.outs += Math.max(0, outsOnPlay);
        acc.earnedRuns += runs;
        acc.battersFaced += 1;

        if (
          pitcherId &&
          firstPitcherByHalf.get(halfKey) === pitcherId
        ) {
          acc.starts.add(gamePk);
        }

        if (isHitEvent(eventType)) acc.hits += 1;
        if (isStrikeoutEvent(eventType)) acc.strikeouts += 1;
        if (isWalkEvent(eventType)) acc.walks += 1;
        if (eventType === "home_run") acc.homeRuns += 1;
      }
    }
  }

  return {
    vsLHP: {
      hitting: finalizeHitting(result.hitting.vl),
      pitching: finalizePitching(result.pitching.vl),
    },
    vsRHP: {
      hitting: finalizeHitting(result.hitting.vr),
      pitching: finalizePitching(result.pitching.vr),
    },
  };
}

function buildPlayerHandednessFromFeeds(
  playerId: number,
  group: Group,
  feeds: Array<{
    gamePk: number;
    gameDate: string;
    feed: AnyRecord;
  }>,
  startDate: string,
) {
  const accumulators = createHandednessAccumulator();

  for (const { gamePk, gameDate, feed } of feeds) {
    if (gameDate < startDate) continue;

    const plays = Array.isArray(feed?.liveData?.plays?.allPlays)
      ? feed.liveData.plays.allPlays
      : [];

    const firstPitcherByHalf = new Map<string, number>();
    const previousOutsByHalf = new Map<string, number>();

    for (const play of plays) {
      const batterId = Number(play?.matchup?.batter?.id ?? 0);
      const pitcherId = Number(play?.matchup?.pitcher?.id ?? 0);
      const batterHand = normalizeHandCode(play?.matchup?.batSide?.code);
      const pitcherHand = pitcherHandFromPlay(play);
      const eventType = eventTypeOf(play);

      const inning = Number(play?.about?.inning ?? 0);
      const half = clean(play?.about?.halfInning).toLowerCase();
      const halfKey = `${inning}-${half}`;

      if (pitcherId && !firstPitcherByHalf.has(halfKey)) {
        firstPitcherByHalf.set(halfKey, pitcherId);
      }

      const currentOuts = Number(play?.count?.outs ?? 0);
      const previousOuts = previousOutsByHalf.get(halfKey) ?? 0;
      const outsOnPlay =
        currentOuts >= previousOuts
          ? currentOuts - previousOuts
          : currentOuts;
      previousOutsByHalf.set(halfKey, currentOuts);

      if (group === "hitting" && batterId === playerId && pitcherHand) {
        const key = pitcherHand === "L" ? "vl" : "vr";
        const acc = accumulators.hitting[key];

        acc.games.add(gamePk);
        acc.pa += 1;
        if (isAtBatEvent(eventType)) acc.ab += 1;
        if (isHitEvent(eventType)) {
          acc.hits += 1;
          if (eventType === "double") acc.doubles += 1;
          if (eventType === "triple") acc.triples += 1;
          if (eventType === "home_run") acc.homeRuns += 1;
        }
        if (isWalkEvent(eventType)) acc.walks += 1;
        if (isStrikeoutEvent(eventType)) acc.strikeouts += 1;
        if (eventType === "hit_by_pitch") acc.hitByPitch += 1;
        if (eventType === "sac_fly") acc.sacFlies += 1;

        acc.rbi += num(play?.result?.rbi);

        const runners = Array.isArray(play?.runners) ? play.runners : [];
        acc.runs += runners.filter(
          (runner: AnyRecord) =>
            Number(runner?.details?.runner?.id ?? 0) === playerId &&
            (runner?.movement?.isScoringEvent === true ||
              runner?.movement?.end === "score"),
        ).length;

        acc.stolenBases += runners.filter((runner: AnyRecord) => {
          if (Number(runner?.details?.runner?.id ?? 0) !== playerId) return false;
          const runnerEvent = clean(
            runner?.details?.eventType ?? runner?.details?.event,
          ).toLowerCase();
          return runnerEvent.startsWith("stolen_base");
        }).length;

        acc.caughtStealing += runners.filter((runner: AnyRecord) => {
          if (Number(runner?.details?.runner?.id ?? 0) !== playerId) return false;
          const runnerEvent = clean(
            runner?.details?.eventType ?? runner?.details?.event,
          ).toLowerCase();
          return runnerEvent.includes("caught_stealing");
        }).length;
      }

      if (group === "pitching" && pitcherId === playerId && batterHand) {
        const key = batterHand === "L" ? "vl" : "vr";
        const acc = accumulators.pitching[key];

        acc.games.add(gamePk);
        acc.battersFaced += 1;
        acc.outs += Math.max(0, outsOnPlay);

        if (firstPitcherByHalf.get(halfKey) === playerId) {
          acc.starts.add(gamePk);
        }

        if (isHitEvent(eventType)) acc.hits += 1;
        if (isStrikeoutEvent(eventType)) acc.strikeouts += 1;
        if (isWalkEvent(eventType)) acc.walks += 1;
        if (eventType === "home_run") acc.homeRuns += 1;

        const runners = Array.isArray(play?.runners) ? play.runners : [];
        acc.earnedRuns += runners.filter(
          (runner: AnyRecord) =>
            (runner?.movement?.isScoringEvent === true ||
              runner?.movement?.end === "score") &&
            runner?.details?.earned !== false,
        ).length;
      }
    }
  }

  return {
    vsLHP:
      group === "pitching"
        ? finalizePitching(accumulators.pitching.vl)
        : finalizeHitting(accumulators.hitting.vl),
    vsRHP:
      group === "pitching"
        ? finalizePitching(accumulators.pitching.vr)
        : finalizeHitting(accumulators.hitting.vr),
  };
}

function buildHitterVsPitcherFromFeeds(
  hitterId: number,
  pitcherId: number,
  feeds: Array<{
    gamePk: number;
    gameDate: string;
    feed: AnyRecord;
  }>,
  startDate: string,
) {
  const acc = createHittingAccumulator();

  for (const { gamePk, gameDate, feed } of feeds) {
    if (gameDate < startDate) continue;

    const plays = Array.isArray(feed?.liveData?.plays?.allPlays)
      ? feed.liveData.plays.allPlays
      : [];

    for (const play of plays) {
      const playPitcherId = Number(
        play?.matchup?.pitcher?.id ?? 0,
      );

      if (playPitcherId !== pitcherId) continue;

      const batterId = Number(
        play?.matchup?.batter?.id ?? 0,
      );

      const eventType = eventTypeOf(play);

      if (batterId === hitterId) {
        acc.games.add(gamePk);
        acc.pa += 1;

        if (isAtBatEvent(eventType)) {
          acc.ab += 1;
        }

        if (isHitEvent(eventType)) {
          acc.hits += 1;

          if (eventType === "double") {
            acc.doubles += 1;
          }

          if (eventType === "triple") {
            acc.triples += 1;
          }

          if (eventType === "home_run") {
            acc.homeRuns += 1;
          }
        }

        if (isWalkEvent(eventType)) {
          acc.walks += 1;
        }

        if (isStrikeoutEvent(eventType)) {
          acc.strikeouts += 1;
        }

        if (eventType === "hit_by_pitch") {
          acc.hitByPitch += 1;
        }

        if (eventType === "sac_fly") {
          acc.sacFlies += 1;
        }

        acc.rbi += num(play?.result?.rbi);
      }

      const runners = Array.isArray(play?.runners)
        ? play.runners
        : [];

      for (const runner of runners) {
        const runnerId = Number(
          runner?.details?.runner?.id ?? 0,
        );

        if (runnerId !== hitterId) continue;

        if (
          runner?.movement?.isScoringEvent === true ||
          runner?.movement?.end === "score"
        ) {
          acc.runs += 1;
        }

        const runnerEvent = clean(
          runner?.details?.eventType ??
            runner?.details?.event ??
            runner?.movement?.reason,
        ).toLowerCase();

        if (runnerEvent.startsWith("stolen_base")) {
          acc.stolenBases += 1;
        }

        if (runnerEvent.includes("caught_stealing")) {
          acc.caughtStealing += 1;
        }
      }
    }
  }

  return finalizeHitting(acc);
}

async function getScheduleContext(teamId: number, group: Group) {
  const params = new URLSearchParams({
    sportId: "1",
    teamId: String(teamId),
    startDate: dateOnly(new Date()),
    endDate: addDays(2),
    hydrate: "probablePitcher",
  });
  const payload = await fetchJson(`${MLB_BASE}/schedule?${params.toString()}`);
  const game = (payload?.dates ?? []).flatMap((d: AnyRecord) => d?.games ?? [])[0];
  if (!game) return {};

  const home = game?.teams?.home ?? {};
  const away = game?.teams?.away ?? {};
  const isHome = Number(home?.team?.id) === teamId;
  const opponent = isHome ? away : home;

  return {
    opponentTeamId: Number(opponent?.team?.id ?? 0),
    opponentTeamName: clean(opponent?.team?.name),
    opponentPitcherId: group === "hitting" ? Number(opponent?.probablePitcher?.id ?? 0) : 0,
    opponentPitcherName: group === "hitting" ? clean(opponent?.probablePitcher?.fullName) : "",
    gameDate: clean(game?.gameDate),
  };
}

async function buildPlayerViews(
  playerId: number,
  group: Group,
  teamId: number,
  season: number,
  matchup: AnyRecord,
) {
  const endDate = dateOnly(new Date());
  const seasonStart = `${season}-01-01`;
  const ranges: RangeKey[] = [
    "season",
    "last7",
    "last14",
    "last30",
    "career",
  ];

  const [gameLogPayload, careerPayload, careerGameLog, seasonFeeds] =
    await Promise.all([
      getPlayerGameLog(playerId, group, season),
      getPlayerStats(playerId, group, "career", season),
      getPlayerCareerGameLogSplits(playerId, group, season),
      group === "hitting" && teamId
        ? getTeamGameFeeds(teamId, seasonStart, endDate)
        : Promise.resolve([]),
    ]);

  const gameLog = statSplits(gameLogPayload);
  const career =
    group === "pitching"
      ? normalizePitching(firstStat(careerPayload))
      : normalizeHitting(firstStat(careerPayload));

  const result: Record<ViewKey, AnyRecord> = {
    vsLHP: {},
    vsRHP: {},
    matchup: {},
    overall: {},
    home: {},
    away: {},
  };

  result.overall.season = aggregate(
    group,
    filterGameLogs(gameLog, {
      endDate,
      venue: "overall",
      teamId,
    }),
  );
  result.overall.career = career;

  result.home.season = aggregate(
    group,
    filterGameLogs(gameLog, {
      endDate,
      venue: "home",
      teamId,
    }),
  );
  result.away.season = aggregate(
    group,
    filterGameLogs(gameLog, {
      endDate,
      venue: "away",
      teamId,
    }),
  );
  result.home.career = aggregate(
    group,
    filterGameLogs(careerGameLog, {
      endDate,
      venue: "home",
      teamId,
    }),
  );
  result.away.career = aggregate(
    group,
    filterGameLogs(careerGameLog, {
      endDate,
      venue: "away",
      teamId,
    }),
  );

  if (group === "hitting") {
  const seasonHandedness = buildPlayerHandednessFromFeeds(
    playerId,
    group,
    seasonFeeds,
    seasonStart,
  );

  result.vsLHP.season = seasonHandedness.vsLHP;
  result.vsRHP.season = seasonHandedness.vsRHP;

  try {
    const [careerVsLHP, careerVsRHP] = await Promise.all([
      getPlayerStats(playerId, group, "statSplits", season, {
        sitCode: "vl",
        omitSeason: true,
      }),
      getPlayerStats(playerId, group, "statSplits", season, {
        sitCode: "vr",
        omitSeason: true,
      }),
    ]);

    result.vsLHP.career = normalizeHitting(
      situationStat(careerVsLHP, "vl"),
    );

    result.vsRHP.career = normalizeHitting(
      situationStat(careerVsRHP, "vr"),
    );
  } catch (error) {
    console.error(
      `Unable to load career handedness splits for player ${playerId}:`,
      error,
    );

    result.vsLHP.career = {};
    result.vsRHP.career = {};
  }
}

  for (const range of ["last7", "last14", "last30"] as const) {
    const startDate = rangeStart(range) ?? endDate;

    result.overall[range] = aggregate(
      group,
      filterGameLogs(gameLog, {
        startDate,
        endDate,
        venue: "overall",
        teamId,
      }),
    );
    result.home[range] = aggregate(
      group,
      filterGameLogs(gameLog, {
        startDate,
        endDate,
        venue: "home",
        teamId,
      }),
    );
    result.away[range] = aggregate(
      group,
      filterGameLogs(gameLog, {
        startDate,
        endDate,
        venue: "away",
        teamId,
      }),
    );

    if (group === "hitting") {
      const handedness = buildPlayerHandednessFromFeeds(
        playerId,
        group,
        seasonFeeds,
        startDate,
      );
      result.vsLHP[range] = handedness.vsLHP;
      result.vsRHP[range] = handedness.vsRHP;
    }
  }

  for (const range of ranges) {
    const startDate = rangeStart(range);
    let vsTeam: AnyRecord = {};

    if (matchup?.opponentTeamId) {
      const sourceSplits =
        range === "career" ? careerGameLog : gameLog;

      vsTeam = aggregate(
        group,
        filterGameLogs(sourceSplits, {
          startDate: range === "career" ? undefined : startDate,
          endDate,
          opponentTeamId: matchup.opponentTeamId,
          teamId,
        }),
      );
    }

        if (group === "hitting" && matchup?.opponentPitcherId) {
      let vsPitcher: AnyRecord = {};

      if (range === "career") {
        try {
          const payload = await getPlayerStats(
            playerId,
            group,
            "vsPlayer",
            season,
            {
              opposingPlayerId: Number(
                matchup.opponentPitcherId,
              ),
              omitSeason: true,
            },
          );

          vsPitcher = normalizeHitting(
            firstStat(payload),
          );
        } catch (error) {
          console.error(
            `Unable to load career matchup against pitcher ${matchup.opponentPitcherId}:`,
            error,
          );

          vsPitcher = {};
        }
      } else {
        const matchupStartDate =
          range === "season"
            ? seasonStart
            : startDate ?? seasonStart;

        vsPitcher = buildHitterVsPitcherFromFeeds(
          playerId,
          Number(matchup.opponentPitcherId),
          seasonFeeds,
          matchupStartDate,
        );
      }

      result.matchup[range] = {
        vsPitcher,
        vsTeam,
      };
    } else {
      result.matchup[range] = { vsTeam };
    }
  }

  return result;
}

async function buildTeamViews(teamId: number, season: number) {
  const endDate = dateOnly(new Date());

  const ranges: Exclude<RangeKey, "career">[] = [
    "season",
    "last7",
    "last14",
    "last30",
  ];

  const last30Start = rangeStart("last30") ?? endDate;

  const [hittingLog, pitchingLog, gameFeeds] = await Promise.all([
    getTeamGameLog(teamId, "hitting", season),
    getTeamGameLog(teamId, "pitching", season),
    getTeamGameFeeds(teamId, last30Start, endDate),
  ]);

  const hittingSplits = statSplits(hittingLog);
  const pitchingSplits = statSplits(pitchingLog);

  const result: Record<Exclude<ViewKey, "matchup">, AnyRecord> = {
    vsLHP: {},
    vsRHP: {},
    overall: {},
    home: {},
    away: {},
  };

  for (const range of ranges) {
    const startDate = rangeStart(range);

    for (const venue of ["overall", "home", "away"] as const) {
      result[venue][range] = {
        hitting: aggregateHitting(
          filterGameLogs(hittingSplits, {
            startDate,
            endDate,
            venue,
            teamId,
          }),
        ),
        pitching: aggregatePitching(
          filterGameLogs(pitchingSplits, {
            startDate,
            endDate,
            venue,
            teamId,
          }),
        ),
      };
    }

    if (range === "season") {
      for (const [view, sitCode] of [
        ["vsLHP", "vl"],
        ["vsRHP", "vr"],
      ] as const) {
        try {
          const [hitting, pitching] = await Promise.all([
            getTeamSplit(teamId, "hitting", season, sitCode),
            getTeamSplit(teamId, "pitching", season, sitCode),
          ]);

          result[view][range] = {
            hitting: normalizeHitting(
              situationStat(hitting, sitCode),
            ),
            pitching: normalizePitching(
              situationStat(pitching, sitCode),
            ),
          };
        } catch (error) {
          console.error(
            `Unable to load ${view} season team splits:`,
            error,
          );

          result[view][range] = {
            hitting: {},
            pitching: {},
          };
        }
      }

      continue;
    }

    if (!startDate) {
      result.vsLHP[range] = {
        hitting: {},
        pitching: {},
      };
      result.vsRHP[range] = {
        hitting: {},
        pitching: {},
      };
      continue;
    }

    const rollingSplits = buildTeamHandednessFromFeeds(
      teamId,
      gameFeeds,
      startDate,
    );

    result.vsLHP[range] = rollingSplits.vsLHP;
    result.vsRHP[range] = rollingSplits.vsRHP;
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const playerName = clean(params.get("playerName"));
    const teamName = clean(params.get("teamName"));
    const requestedType = clean(params.get("playerType")).toLowerCase();
    const season = Number(params.get("season") || new Date().getFullYear());

    let playerId = Number(params.get("playerId") || 0);
    let teamId = Number(params.get("teamId") || 0);

    if (!playerId) {
      playerId = Number(
        await resolvePlayerId(playerName, teamName, season),
      );
    }
    if (!playerId) {
      return NextResponse.json({ error: `Unable to resolve MLB player ID for ${playerName || "player"}.` }, { status: 404 });
    }

    const person = await getPerson(playerId);
    const group: Group = requestedType === "pitcher" || requestedType === "pitching" ? "pitching" : "hitting";

    if (!teamId) {
      teamId = Number(person?.currentTeam?.id || (await resolveTeamId(teamName, season)));
    }

    const matchup = teamId ? await getScheduleContext(teamId, group) : {};
    const [playerStats, teamStats] = await Promise.all([
      buildPlayerViews(playerId, group, teamId, season, matchup),
      teamId ? buildTeamViews(teamId, season) : Promise.resolve({}),
    ]);

    return NextResponse.json({
      player: {
        id: playerId,
        name: person?.fullName || playerName,
        team: person?.currentTeam?.name || teamName,
        teamId: teamId || null,
        position: person?.primaryPosition?.abbreviation || person?.primaryPosition?.name || "",
        bats: person?.batSide?.code || "",
        throws: person?.pitchHand?.code || "",
        type: group,
      },
      matchup,
      playerStats,
      teamStats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Player profile API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load player profile." },
      { status: 500 },
    );
  }
}