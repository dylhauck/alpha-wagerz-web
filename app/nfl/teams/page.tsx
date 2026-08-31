import { AppShell } from "@/components/AppShell";
import { NFLTeamLogo } from "@/components/nfl/NFLTeamLogo";

type TeamRecord = {
  team_abbr?: string;
  team?: string;
  team_name?: string;
  name?: string;
  full_name?: string;
  team_nick?: string;
  conference?: string;
  division?: string;
  team_conf?: string;
  team_division?: string;
};

async function loadJson(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${base}${path}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

function rowsFromPayload(payload: any): TeamRecord[] {
  if (Array.isArray(payload)) return payload;

  for (const key of ["teams", "data", "rows"]) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

function teamAbbr(team: TeamRecord) {
  return (
    team.team_abbr ||
    team.team ||
    ""
  ).toUpperCase();
}

function teamName(team: TeamRecord) {
  return (
    team.team_name ||
    team.full_name ||
    team.name ||
    team.team_nick ||
    teamAbbr(team)
  );
}

export default async function NFLTeamsPage() {
  const payload = await loadJson("/data/nfl/teams.json");
  const teams = rowsFromPayload(payload)
    .filter((team) => teamAbbr(team))
    .sort((a, b) => teamName(a).localeCompare(teamName(b)));

  return (
    <AppShell>
      <main className="min-h-screen bg-[#07111f] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Alpha Wagerz NFL
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              NFL Teams
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              League directory powered by the NFL data pipeline. Team pages can be expanded later with
              offense, defense, matchup and betting-model metrics.
            </p>
          </div>

          {teams.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-slate-400">
              No team data is available yet. Run the NFL data pipeline so
              <span className="font-mono text-slate-300"> /public/data/nfl/teams.json </span>
              is populated.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {teams.map((team) => {
                const abbr = teamAbbr(team);

                return (
                  <article
                    key={abbr}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
                        <NFLTeamLogo team={abbr} size={48} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          {abbr}
                        </div>
                        <h2 className="truncate text-lg font-extrabold">
                          {teamName(team)}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-900/80 p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Conference
                        </div>
                        <div className="mt-1 font-semibold">
                          {team.conference || team.team_conf || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-900/80 p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Division
                        </div>
                        <div className="mt-1 font-semibold">
                          {team.division || team.team_division || "—"}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
