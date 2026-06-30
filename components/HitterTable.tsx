import { StatCell } from "./StatCell";
import { ScoreBadge } from "./ScoreBadge";

export type HitterRow = Record<string, any>;

export function HitterTable({ hitters }: { hitters: HitterRow[] }) {
  return (
    <section className="glass rounded-3xl p-4">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-black text-white">Top HR Targets</h2>
          <p className="text-sm text-slate-400">
            Real Alpha Wagerz model output ranked by Likely score.
          </p>
        </div>

        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          {hitters.length} hitters loaded
        </div>
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[2300px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="sticky left-0 z-20 bg-[#0b1020] px-3 py-2">Rank</th>
              <th className="sticky left-[64px] z-20 bg-[#0b1020] px-3 py-2">Player</th>
              <th className="px-3 py-2">Game</th>
              <th className="px-3 py-2">Likely</th>
              <th className="px-3 py-2">Test</th>
              <th className="px-3 py-2">Matchup</th>
              <th className="px-3 py-2">Ceiling</th>
              <th className="px-3 py-2">Zone</th>
              <th className="px-3 py-2">HR Form</th>
              <th className="px-3 py-2">kHR</th>
              <th className="px-3 py-2">Pitches</th>
              <th className="px-3 py-2">BIP</th>
              <th className="px-3 py-2">ISO</th>
              <th className="px-3 py-2">xwOBA</th>
              <th className="px-3 py-2">xwOBAcon</th>
              <th className="px-3 py-2">SwStr</th>
              <th className="px-3 py-2">Pulled Brl</th>
              <th className="px-3 py-2">Brl/BIP</th>
              <th className="px-3 py-2">Sweet Spot</th>
              <th className="px-3 py-2">FB</th>
              <th className="px-3 py-2">HH</th>
              <th className="px-3 py-2">LA</th>
              <th className="px-3 py-2">Arsenal</th>
              <th className="px-3 py-2">Fastball</th>
              <th className="px-3 py-2">Breaking</th>
              <th className="px-3 py-2">Offspeed</th>
              <th className="px-3 py-2">xHR</th>
            </tr>
          </thead>

          <tbody>
            {hitters.map((hitter, index) => (
              <tr
                key={`${hitter.game_id}-${hitter.Player}-${index}`}
                className="rounded-2xl bg-white/[0.035] text-sm"
              >
                <td className="sticky left-0 z-10 rounded-l-2xl bg-[#11182c] px-3 py-3 font-black text-cyan-200">
                  #{index + 1}
                </td>

                <td className="sticky left-[64px] z-10 bg-[#11182c] px-3 py-3">
                  <div className="font-black text-white">{hitter.Player}</div>
                  <div className="text-xs text-slate-500">{hitter.team}</div>
                </td>

                <td className="px-3 py-3 text-slate-300">{hitter.game}</td>
                <td className="px-3 py-3"><ScoreBadge value={hitter.Likely} /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Test Score"]} statKey="Test Score" /></td>
                <td className="px-3 py-3"><StatCell value={hitter.Matchup} statKey="Matchup" /></td>
                <td className="px-3 py-3"><StatCell value={hitter.Ceiling} statKey="Ceiling" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Zone Fit"]} statKey="Zone Fit" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["HR Form"]} statKey="HR Form" /></td>
                <td className="px-3 py-3"><StatCell value={hitter.kHR} statKey="kHR" /></td>

                <td className="px-3 py-3">{hitter.Pitches || "—"}</td>
                <td className="px-3 py-3">{hitter.BIP || "—"}</td>

                <td className="px-3 py-3"><StatCell value={hitter.ISO} statKey="ISO" /></td>
                <td className="px-3 py-3"><StatCell value={hitter.xwOBA} statKey="xwOBA" /></td>
                <td className="px-3 py-3"><StatCell value={hitter.xwOBAcon} statKey="xwOBAcon" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["SwStr%"]} statKey="SwStr%" suffix="%" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["PulledBrl%"]} statKey="PulledBrl%" suffix="%" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Brl/BIP%"]} statKey="Brl/BIP%" suffix="%" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Sweet Spot%"]} statKey="Sweet Spot%" suffix="%" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["FB%"]} statKey="FB%" suffix="%" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["HH%"]} statKey="HH%" suffix="%" /></td>
                <td className="px-3 py-3"><StatCell value={hitter.LA} statKey="LA" /></td>

                <td className="px-3 py-3"><StatCell value={hitter["Arsenal Score"]} statKey="Arsenal Score" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Fastball Matchup"]} statKey="Fastball Matchup" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Breaking Ball Matchup"]} statKey="Breaking Ball Matchup" /></td>
                <td className="px-3 py-3"><StatCell value={hitter["Offspeed Matchup"]} statKey="Offspeed Matchup" /></td>
                <td className="rounded-r-2xl px-3 py-3"><StatCell value={hitter["xHR Matchup"]} statKey="xHR Matchup" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}