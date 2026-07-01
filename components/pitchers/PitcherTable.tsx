import { StatCell } from "@/components/StatCell";

export function PitcherTable({ pitchers }: { pitchers: Record<string, any>[] }) {
  return (
    <section className="glass rounded-3xl p-4">
      <div className="mb-4">
        <h2 className="text-xl font-black text-white">Pitcher Slate</h2>
        <p className="text-sm text-slate-400">
          Strikeout upside, HR vulnerability, arsenal profile and contact risk.
        </p>
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[1500px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-3 py-2">Pitcher</th>
              <th className="px-3 py-2">Game</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Opponent</th>
              <th className="px-3 py-2">Pitch Score</th>
              <th className="px-3 py-2">K Score</th>
              <th className="px-3 py-2">HR Vuln</th>
              <th className="px-3 py-2">FB Profile</th>
              <th className="px-3 py-2">Barrel</th>
              <th className="px-3 py-2">xwOBA</th>
              <th className="px-3 py-2">CSW</th>
              <th className="px-3 py-2">SwStr</th>
              <th className="px-3 py-2">Ball</th>
              <th className="px-3 py-2">Brl/BIP</th>
              <th className="px-3 py-2">HH</th>
              <th className="px-3 py-2">HR/9</th>
            </tr>
          </thead>

          <tbody>
            {pitchers.map((p, index) => (
              <tr key={`${p.game_id}-${p.Pitcher}-${index}`} className="bg-white/[0.035] text-sm">
                <td className="rounded-l-2xl px-3 py-3">
                  <div className="font-black text-white">{p.Pitcher || "TBD"}</div>
                  <div className="text-xs text-slate-500">{p["Pitcher Notes"] || ""}</div>
                </td>
                <td className="px-3 py-3 text-slate-300">{p.game}</td>
                <td className="px-3 py-3 text-slate-300">{p.Team}</td>
                <td className="px-3 py-3 text-slate-300">{p.Opponent}</td>
                <td className="px-3 py-3"><StatCell value={p["Pitch Score"]} statKey="Likely" /></td>
                <td className="px-3 py-3"><StatCell value={p["Strikeout Score"]} statKey="Likely" /></td>
                <td className="px-3 py-3"><StatCell value={p["HR Vulnerability"]} statKey="xHR Matchup" /></td>
                <td className="px-3 py-3"><StatCell value={p["Fly Ball Profile"]} statKey="FB%" /></td>
                <td className="px-3 py-3"><StatCell value={p["Barrel Profile"]} statKey="Brl/BIP%" /></td>
                <td className="px-3 py-3"><StatCell value={p.xwOBA} statKey="xwOBA" /></td>
                <td className="px-3 py-3">{p["CSW%"] || "—"}%</td>
                <td className="px-3 py-3">{p["SwStr%"] || "—"}%</td>
                <td className="px-3 py-3">{p["Ball%"] || "—"}%</td>
                <td className="px-3 py-3">{p["Brl/BIP%"] || "—"}%</td>
                <td className="px-3 py-3">{p["HH%"] || "—"}%</td>
                <td className="rounded-r-2xl px-3 py-3">{p["HR/9"] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}