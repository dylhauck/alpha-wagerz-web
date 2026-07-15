import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AnyRecord = Record<string, any>;
type Group = "hitting" | "pitching";
type RangeKey = "season" | "last7" | "last14" | "last30" | "career";
type ViewKey = "vsLHP" | "vsRHP" | "matchup" | "overall" | "home" | "away";

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
  const outs = parseInningsToOuts(stat.inningsPitched);
  const innings = outs / 3;
  const strikeouts = num(stat.strikeOuts ?? stat.strikeouts);
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
    "BB/9": stat.walksPer9Inn ?? stat.walksPer9Innings ?? null,
    "H/9": stat.hitsPer9Inn ?? stat.hitsPer9Innings ?? null,
    "HR/9": stat.homeRunsPer9 ?? stat.homeRunsPer9Inn ?? null,
    "K%": stat.strikeoutPercentage ?? null,
    "BB%": stat.walkPercentage ?? null,
    "OPP AVG": stat.avg ?? stat.opponentAvg ?? null,
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

async function getTeamRosterPlayerIds(
  teamId: number,
  season: number,
  group: Group,
) {
  const params = new URLSearchParams({
    rosterType: "fullSeason",
    season: String(season),
    hydrate: "person",
  });

  const payload = await fetchJson(
    `${MLB_BASE}/teams/${teamId}/roster?${params.toString()}`,
  );

  const entries = Array.isArray(payload?.roster)
    ? payload.roster
    : [];

  const ids = entries
    .filter((entry: AnyRecord) => {
      const positionCode = clean(
        entry?.position?.code ??
          entry?.person?.primaryPosition?.code,
      ).toUpperCase();

      const positionType = clean(
        entry?.position?.type ??
          entry?.person?.primaryPosition?.type,
      ).toLowerCase();

      const isPitcher =
        positionCode === "1" ||
        positionType === "pitcher";

      return group === "pitching"
        ? isPitcher
        : !isPitcher;
    })
    .map((entry: AnyRecord) =>
      Number(entry?.person?.id ?? 0),
    )
    .filter((id: number) => id > 0);

  return [...new Set(ids)];
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

async function buildTeamPlayerSplit(
  teamId: number,
  season: number,
  group: Group,
  sitCode: "vl" | "vr",
  startDate: string,
  endDate: string,
  playerIds: number[],
) {
  const playerSplits = await mapInBatches(
    playerIds,
    8,
    async (playerId) => {
      try {
        const payload = await getPlayerStats(
          playerId,
          group,
          "statSplits",
          season,
          {
            startDate,
            endDate,
            sitCode,
            teamId,
          },
        );

        const stat = firstStat(payload);

        if (!stat || Object.keys(stat).length === 0) {
          return null;
        }

        return {
          person: { id: playerId },
          stat,
        };
      } catch (error) {
        console.warn(
          `Unable to load ${group} ${sitCode} split for player ${playerId}:`,
          error,
        );
        return null;
      }
    },
  );

  const validSplits: AnyRecord[] = playerSplits.filter(
  (split) => split !== null,
) as AnyRecord[];

return group === "pitching"
  ? aggregatePitching(validSplits)
  : aggregateHitting(validSplits);
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

async function buildPlayerViews(playerId: number, group: Group, teamId: number, season: number, matchup: AnyRecord) {
  const endDate = dateOnly(new Date());
  const ranges: RangeKey[] = ["season", "last7", "last14", "last30", "career"];
  const gameLog = statSplits(await getPlayerGameLog(playerId, group, season));
  const career = group === "pitching"
    ? normalizePitching(firstStat(await getPlayerStats(playerId, group, "career", season)))
    : normalizeHitting(firstStat(await getPlayerStats(playerId, group, "career", season)));

  const result: Record<ViewKey, AnyRecord> = {
    vsLHP: {}, vsRHP: {}, matchup: {}, overall: {}, home: {}, away: {},
  };

  for (const range of ranges) {
    const startDate = rangeStart(range);

    result.overall[range] = range === "career"
      ? career
      : aggregate(group, filterGameLogs(gameLog, { startDate, endDate, venue: "overall", teamId }));
    result.home[range] = aggregate(group, filterGameLogs(gameLog, { startDate, endDate, venue: "home", teamId }));
    result.away[range] = aggregate(group, filterGameLogs(gameLog, { startDate, endDate, venue: "away", teamId }));

    for (const [view, sitCode] of [
      ["vsLHP", "vl"],
      ["vsRHP", "vr"],
    ] as const) {
      try {
        const isCareer = range === "career";

        const payload = await getPlayerStats(
          playerId,
          group,
          "statSplits",
          season,
          {
            startDate: isCareer ? undefined : startDate,
            endDate:
            !isCareer && startDate
            ? endDate
            : undefined,
          sitCode,
          omitSeason: isCareer,
          },
        );

    result[view][range] =
      group === "pitching"
        ? normalizePitching(firstStat(payload))
        : normalizeHitting(firstStat(payload));
  } catch {
    result[view][range] = {};
  }
}

    const vsTeam = aggregate(
      group,
      filterGameLogs(gameLog, {
        startDate,
        endDate,
        opponentTeamId: matchup?.opponentTeamId,
        teamId,
      }),
    );

    if (group === "hitting" && matchup?.opponentPitcherId) {
      try {
        const payload = await getPlayerStats(playerId, group, "vsPlayer", season, {
          opposingPlayerId: matchup.opponentPitcherId,
        });
        result.matchup[range] = {
          vsPitcher: normalizeHitting(firstStat(payload)),
          vsTeam,
        };
      } catch {
        result.matchup[range] = { vsPitcher: {}, vsTeam };
      }
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

  const [
    hittingLog,
    pitchingLog,
    hitterIds,
    pitcherIds,
  ] = await Promise.all([
    getTeamGameLog(teamId, "hitting", season),
    getTeamGameLog(teamId, "pitching", season),
    getTeamRosterPlayerIds(teamId, season, "hitting"),
    getTeamRosterPlayerIds(teamId, season, "pitching"),
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

    for (const [view, sitCode] of [
      ["vsLHP", "vl"],
      ["vsRHP", "vr"],
    ] as const) {
      try {
        if (range === "season") {
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

          continue;
        }

        if (!startDate) {
          result[view][range] = {
            hitting: {},
            pitching: {},
          };
          continue;
        }

        const [hitting, pitching] = await Promise.all([
          buildTeamPlayerSplit(
            teamId,
            season,
            "hitting",
            sitCode,
            startDate,
            endDate,
            hitterIds,
          ),
          buildTeamPlayerSplit(
            teamId,
            season,
            "pitching",
            sitCode,
            startDate,
            endDate,
            pitcherIds,
          ),
        ]);

        // A player-by-player aggregation cannot infer the team's unique
        // game count, so use the already-calculated team game-log total.
        hitting.G = result.overall[range]?.hitting?.G ?? hitting.G;
        pitching.G = result.overall[range]?.pitching?.G ?? pitching.G;

        result[view][range] = {
          hitting,
          pitching,
        };
      } catch (error) {
        console.error(
          `Unable to load ${view} ${range} team splits:`,
          error,
        );

        result[view][range] = {
          hitting: {},
          pitching: {},
        };
      }
    }
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