function fmt(value: any, suffix = "") {
  if (value === "" || value === null || value === undefined) return "—";

  const num = Number(value);
  if (Number.isNaN(num)) return `${value}${suffix}`;

  return `${num.toFixed(1).replace(/\.0$/, "")}${suffix}`;
}

function marketText(value: any) {
  if (value === "" || value === null || value === undefined) return "—";
  return value > 0 ? `+${value}` : value;
}

function getThrowHand(value: unknown) {
  const hand = String(value || "")
    .trim()
    .toUpperCase();

  if (hand.startsWith("L")) return "L";
  if (hand.startsWith("R")) return "R";

  return "";
}

function ThrowHandBadge({ throws }: { throws: unknown }) {
  const hand = getThrowHand(throws);

  if (!hand) return null;

  return (
    <span
      title={`${hand}-handed pitcher`}
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-[10px] font-black text-cyan-200"
    >
      {hand}
    </span>
  );
}

function EdgePill({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-pink-300/25 bg-pink-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-pink-200">
      {label || "No Lean"}
    </div>
  );
}

function MarketBox({
  title,
  market,
  model,
  edge,
  lean,
}: {
  title: string;
  market: string;
  model: string;
  edge: string;
  lean: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#11182c] p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] font-black uppercase text-slate-500">Market</div>
          <div className="mt-1 text-sm font-black text-white">{market}</div>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase text-slate-500">Model</div>
          <div className="mt-1 text-sm font-black text-cyan-200">{model}</div>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase text-slate-500">Edge</div>
          <div className="mt-1 text-sm font-black text-pink-200">{edge}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
        {lean}
      </div>
    </div>
  );
}

export function GameProjectionCard({ projection }: { projection: Record<string, any> }) {
  const away = projection.away_team;
  const home = projection.home_team;

  return (
    <div className="rounded-3xl border border-cyan-300/15 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-black text-white">{projection.game}</div>
          <div className="text-sm font-semibold text-slate-400">
            {projection.venue} · {projection.game_time || "Time TBD"}
          </div>
        </div>

        <EdgePill label={projection.best_lean || projection.moneyline_lean} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
          <div className="text-xs font-black uppercase text-cyan-100">Projected Score</div>
          <div className="mt-2 text-xl font-black text-white">
            {away}: {fmt(projection.away_projected_runs)}
          </div>
          <div className="text-xl font-black text-white">
            {home}: {fmt(projection.home_projected_runs)}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-300/15 bg-pink-300/10 p-4">
          <div className="text-xs font-black uppercase text-pink-100">Win Probability</div>
          <div className="mt-2 text-xl font-black text-white">
            {away}: {fmt(projection.away_win_probability, "%")}
          </div>
          <div className="text-xl font-black text-white">
            {home}: {fmt(projection.home_win_probability, "%")}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="text-xs font-black uppercase text-slate-400">Projected Total</div>
          <div className="mt-2 text-3xl font-black text-white">
            {fmt(projection.projected_total)}
          </div>
          <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            {projection.total_recommendation || projection.total_lean}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <MarketBox
          title="Moneyline"
          market={`${away} ${marketText(projection.market?.moneyline?.away)} / ${home} ${marketText(
            projection.market?.moneyline?.home
          )}`}
          model={`${projection.moneyline_lean} ${fmt(projection.moneyline_edge, "% edge")}`}
          edge={fmt(projection.moneyline_edge, "%")}
          lean={projection.moneyline_recommendation || projection.moneyline_lean}
        />

        <MarketBox
          title="Run Line"
          market={`${away} ${fmt(projection.market?.spread?.away)} / ${home} ${fmt(
            projection.market?.spread?.home
          )}`}
          model={`Projected margin ${fmt(projection.projected_margin)}`}
          edge={fmt(projection.spread_edge)}
          lean={projection.spread_recommendation || projection.spread_lean}
        />

        <MarketBox
          title="Game Total"
          market={fmt(projection.market?.total)}
          model={fmt(projection.projected_total)}
          edge={fmt(projection.total_edge)}
          lean={projection.total_recommendation || projection.total_lean}
        />

        <MarketBox
          title="Team Totals"
          market={`${away} ${fmt(projection.market?.team_totals?.away)} / ${home} ${fmt(
            projection.market?.team_totals?.home
          )}`}
          model={`${away} ${fmt(projection.away_projected_runs)} / ${home} ${fmt(
            projection.home_projected_runs
          )}`}
          edge={`${away} ${fmt(projection.away_team_total_edge)} / ${home} ${fmt(
            projection.home_team_total_edge
          )}`}
          lean={projection.team_total_recommendation || "No Team Total Lean"}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#11182c] p-4">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          Starter K Projections
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/10 p-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-black text-white">
                {projection.away_pitcher}
              </div>

              <ThrowHandBadge throws={projection.away_pitcher_throws} />
            </div>
            <div className="text-xs text-slate-400">
              Market: {fmt(projection.away_pitcher_k_line)} · Model:{" "}
              {fmt(projection.away_projected_ks)} K
            </div>
            <div className="mt-1 text-xs font-black uppercase text-cyan-200">
              {projection.away_pitcher_k_recommendation || "No K Lean"}
            </div>
          </div>

          <div className="rounded-xl border border-pink-300/10 bg-pink-300/10 p-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-black text-white">
                {projection.home_pitcher}
              </div>

              <ThrowHandBadge throws={projection.home_pitcher_throws} />
            </div>
            <div className="text-xs text-slate-400">
              Market: {fmt(projection.home_pitcher_k_line)} · Model:{" "}
              {fmt(projection.home_projected_ks)} K
            </div>
            <div className="mt-1 text-xs font-black uppercase text-pink-200">
              {projection.home_pitcher_k_recommendation || "No K Lean"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}