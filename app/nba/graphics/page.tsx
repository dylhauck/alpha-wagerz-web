"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Game = {
  game_id: string;
  away_team: string;
  home_team: string;
  model?: {
    away_score?: number;
    home_score?: number;
    projected_total?: number;
    away_win_probability?: number;
    home_win_probability?: number;
    projected_winner?: string;
  };
};
type Payload = { slate_date?: string; generated_at?: string; games?: Game[] };
const names: Record<string, string> = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks", DEN: "Denver Nuggets",
  DET: "Detroit Pistons", GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
  LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat",
  MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves", NOP: "New Orleans Pelicans", NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder", ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors",
  UTA: "Utah Jazz", WAS: "Washington Wizards",
};
const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char] || char));
const pct = (value?: number) => typeof value === "number" && Number.isFinite(value)
  ? (value <= 1 ? value * 100 : value).toFixed(1) + "%" : "—";
const score = (value?: number) => typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "—";

function buildSvg(data: Payload, selected: Game[], size: "landscape" | "portrait") {
  if (selected.length >= 7) return buildTableSvg(data, selected, size);
  const width = size === "landscape" ? 1600 : 1080;
  const height = size === "landscape" ? 900 : 1350;
  const left = size === "landscape" ? 90 : 64;
  const top = size === "landscape" ? 220 : 255;
  const gap = size === "landscape" ? 20 : 22;
  const columns = size === "landscape" ? 2 : 1;
  const rows = Math.max(1, Math.ceil(selected.length / columns));
  const cardWidth = (width - left * 2 - gap * (columns - 1)) / columns;
  const available = height - top - 115;
  const cardHeight = Math.min(size === "landscape" ? 245 : 220, (available - gap * (rows - 1)) / rows);
  const body = selected.map((game, index) => {
    const col = index % columns, row = Math.floor(index / columns);
    const x = left + col * (cardWidth + gap), y = top + row * (cardHeight + gap);
    const model = game.model || {};
    const valid = [model.away_score, model.home_score, model.away_win_probability, model.home_win_probability]
      .every(v => typeof v === "number" && Number.isFinite(v));
    const teamFont = size === "landscape" ? 25 : 30;
    const row1 = y + Math.min(83, cardHeight * 0.36), row2 = y + Math.min(145, cardHeight * 0.66);
    return `<g>
      <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="23" fill="#101c33" stroke="#29d9f5" stroke-opacity=".4" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="7" height="${cardHeight}" rx="3" fill="#f653c9"/>
      <text x="${x + 27}" y="${y + 35}" fill="#9cb2cf" font-size="16" font-weight="700">MATCHUP ${String(index + 1).padStart(2, "0")}</text>
      <text x="${x + 27}" y="${row1}" fill="#ffffff" font-size="${teamFont}" font-weight="800">${esc(names[game.away_team] || game.away_team)}</text>
      <text x="${x + cardWidth - 26}" y="${row1}" text-anchor="end" fill="#46e9ff" font-size="25" font-weight="800">${valid ? score(model.away_score) : "—"}</text>
      <text x="${x + 27}" y="${row2}" fill="#ffffff" font-size="${teamFont}" font-weight="800">${esc(names[game.home_team] || game.home_team)}</text>
      <text x="${x + cardWidth - 26}" y="${row2}" text-anchor="end" fill="#46e9ff" font-size="25" font-weight="800">${valid ? score(model.home_score) : "—"}</text>
      <line x1="${x + 25}" y1="${y + cardHeight - 60}" x2="${x + cardWidth - 25}" y2="${y + cardHeight - 60}" stroke="#ffffff" stroke-opacity=".13"/>
      <text x="${x + 27}" y="${y + cardHeight - 29}" fill="#e8a1e9" font-size="18" font-weight="700">WIN PROB. ${valid ? pct(model.away_win_probability) + " / " + pct(model.home_win_probability) : "UNAVAILABLE"}</text>
      <text x="${x + cardWidth - 26}" y="${y + cardHeight - 29}" text-anchor="end" fill="#9eb9ce" font-size="17">TOTAL ${valid ? score(model.projected_total) : "—"}</text>
    </g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x2="1" y2="1"><stop stop-color="#071426"/><stop offset=".55" stop-color="#0c1730"/><stop offset="1" stop-color="#200e35"/></linearGradient>
      <linearGradient id="accent"><stop stop-color="#22e6ff"/><stop offset=".52" stop-color="#4d78ff"/><stop offset="1" stop-color="#f653c9"/></linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect x="0" y="0" width="${width}" height="12" fill="url(#accent)"/>
    <text x="${width / 2}" y="90" text-anchor="middle" fill="#f65ec9" font-size="54" font-weight="900" font-family="Arial,sans-serif" letter-spacing="2">ALPHA WAGERZ</text>
    <text x="${width / 2}" y="148" text-anchor="middle" fill="#ffffff" font-size="35" font-weight="800" font-family="Arial,sans-serif">NBA GAME PROJECTIONS</text>
    <text x="${width / 2}" y="186" text-anchor="middle" fill="#9fb6d0" font-size="23" font-family="Arial,sans-serif">SLATE: ${esc(data.slate_date || "UNAVAILABLE")}</text>
    <g font-family="Arial,sans-serif">${body}</g>
    <rect x="${left}" y="${height - 87}" width="${width - 2 * left}" height="2" fill="url(#accent)"/>
    <text x="${left}" y="${height - 44}" fill="#51e8ff" font-size="25" font-weight="800" font-family="Arial,sans-serif">FollowTheAlpha 🐺</text>
    <text x="${width - left}" y="${height - 44}" text-anchor="end" fill="#9fb6d0" font-size="18" font-family="Arial,sans-serif">MODEL PROJECTIONS • NOT FINAL SCORES</text>
  </svg>`;
}
function buildTableSvg(data: Payload, selected: Game[], size: "landscape" | "portrait") {
  const width = size === "landscape" ? 1600 : 1080;
  const margin = 60;
  const rowHeight = size === "landscape" ? 76 : 86;
  const height = Math.max(size === "landscape" ? 900 : 1350, 280 + selected.length * rowHeight + 120);
  const leftWidth = width * .34;
  const body = selected.map((game, index) => {
    const y = 245 + index * rowHeight;
    const model = game.model || {};
    const away = model.away_win_probability, home = model.home_win_probability;
    const winner = typeof away === "number" && typeof home === "number"
      ? (away >= home ? game.away_team : game.home_team) : "—";
    const probability = typeof away === "number" && typeof home === "number"
      ? pct(Math.max(away, home)) : "—";
    const title = esc(game.away_team + "  VS  " + game.home_team);
    return `<g font-family="Arial,sans-serif">
      <rect x="${margin}" y="${y}" width="${width - margin * 2}" height="${rowHeight - 8}" rx="14" fill="#0b1a31" stroke="${index % 2 ? "#f64cc9" : "#1adfff"}" stroke-width="3"/>
      <text x="${margin + 22}" y="${y + 32}" font-size="${size === "landscape" ? 26 : 23}" font-weight="800" fill="white">${title}</text>
      <text x="${margin + 22}" y="${y + 57}" font-size="17" fill="#7eefff">MODEL SCORES: ${score(model.away_score)} – ${score(model.home_score)}</text>
      <text x="${leftWidth + 40}" y="${y + 34}" font-size="24" font-weight="800" fill="#f4a7e8">${esc(winner)} ${probability}</text>
      <text x="${leftWidth + 40}" y="${y + 57}" font-size="16" fill="#a6bfd8">MODEL WIN PROBABILITY</text>
      <text x="${width - margin - 24}" y="${y + 34}" text-anchor="end" font-size="24" font-weight="800" fill="#42eaff">${score(model.projected_total)}</text>
      <text x="${width - margin - 24}" y="${y + 57}" text-anchor="end" font-size="16" fill="#a6bfd8">PROJECTED TOTAL</text>
    </g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#061426"/><stop offset="1" stop-color="#250c39"/></linearGradient><linearGradient id="accent"><stop stop-color="#1ceaff"/><stop offset="1" stop-color="#f34acb"/></linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/><rect width="${width}" height="12" fill="url(#accent)"/>
    <text x="${width / 2}" y="96" text-anchor="middle" fill="#f45acb" font-family="Arial,sans-serif" font-size="55" font-weight="900">ALPHA WAGERZ</text>
    <text x="${width / 2}" y="152" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="37" font-weight="800">NBA GAME PROJECTIONS</text>
    <text x="${width / 2}" y="196" text-anchor="middle" fill="#83eaff" font-family="Arial,sans-serif" font-size="24">SLATE: ${esc(data.slate_date || "UNAVAILABLE")}  •  ${selected.length} MATCHUPS</text>
    ${body}
    <rect x="${margin}" y="${height - 92}" width="${width - margin * 2}" height="3" fill="url(#accent)"/>
    <text x="${margin}" y="${height - 48}" fill="#48eaff" font-family="Arial,sans-serif" font-size="27" font-weight="800">FollowTheAlpha</text>
    <text x="${width - margin}" y="${height - 48}" text-anchor="end" fill="#a6bfd8" font-family="Arial,sans-serif" font-size="18">MODEL PROJECTIONS • NOT FINAL SCORES</text>
  </svg>`;
}

// Keep brand art as separate same-origin layers so PNG export remains reliable.
const branding = ["/alphawolf.png", "/awlogo2.png"];
function brandPlacement(width: number) {
  const imageWidth = width === 1600 ? 180 : 142;
  return [{ x: 24, y: 22, w: imageWidth, h: imageWidth },
    { x: width - imageWidth - 24, y: 22, w: imageWidth, h: imageWidth }];
}
function previewSvg(svg: string) {
  const width = Number(svg.match(/width="(\\d+)"/)?.[1] || 1080);
  const overlays = brandPlacement(width).map((b, i) =>
    `<image href="${branding[i]}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid meet"/>`).join("");
  return svg.replace("</svg>", overlays + "</svg>")
    .replace("<svg ", '<svg style="width:100%;height:auto;display:block" ');
}
async function drawBranding(ctx: CanvasRenderingContext2D, width: number) {
  await Promise.all(branding.map(async (src, i) => {
    const image = new Image();
    image.src = src;
    try {
      await image.decode();
      const { x, y, w, h } = brandPlacement(width)[i];
      ctx.drawImage(image, x, y, w, h);
    } catch { throw new Error(`Unable to load branding asset: ${src}`); }
  }));
}

export default function GraphicsPage() {
  const [slate, setSlate] = useState<"current" | "next">("current");
  const [format, setFormat] = useState<"landscape" | "portrait">("landscape");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true); setError(""); setPayload(null);
    fetch(`/data/nba/${slate === "next" ? "next/" : ""}betting_projections.json`, { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("NBA projection data is unavailable."); return r.json(); })
      .then((data: Payload) => { if (!active) return; setPayload(data); setSelectedIds((data.games || []).map(g => String(g.game_id))); })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [slate]);
  const games = useMemo(() => (payload?.games || []).filter(g => selectedIds.includes(String(g.game_id))), [payload, selectedIds]);
  const limit = games.length <= 6 ? (format === "landscape" ? 6 : 6) : 12;
  const pageCount = Math.max(1, Math.ceil(games.length / limit));
  const currentPage = Math.min(page, pageCount - 1);
  const selected = games.slice(currentPage * limit, (currentPage + 1) * limit);
  const svg = payload && selected.length ? buildSvg(payload, selected, format) : "";
  useEffect(() => { setPage(0); }, [slate, format, selectedIds]);
  const download = async () => {
    if (!svg) return;
    setError("");
    try {
      const image = new Image();
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      try {
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to render PNG.")); image.src = svgUrl; });
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is unavailable.");
        ctx.drawImage(image, 0, 0);
        await drawBranding(ctx, canvas.width);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Unable to export PNG.")), "image/png"));
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url; anchor.download = `alpha-wagerz-nba-projections-${payload?.slate_date || slate}-${currentPage + 1}.png`;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } finally { URL.revokeObjectURL(svgUrl); }
    } catch (e) { setError(e instanceof Error ? e.message : "Download failed."); }
  };
  return <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
    <h1 className="text-center text-4xl font-black text-fuchsia-400">Graphics</h1>
    <p className="mt-2 text-center text-sm text-slate-300">NBA Graphics Studio · Live model-backed graphics</p>
    <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-[#101b30] p-5">
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-bold text-slate-200">Slate <select value={slate} onChange={e => setSlate(e.target.value as "current" | "next")} className="ml-2 rounded-lg border border-white/20 bg-[#071426] px-3 py-2"><option value="current">Current</option><option value="next">Next</option></select></label>
        <label className="text-sm font-bold text-slate-200">Format <select value={format} onChange={e => setFormat(e.target.value as "landscape" | "portrait")} className="ml-2 rounded-lg border border-white/20 bg-[#071426] px-3 py-2"><option value="landscape">Landscape · 1600 × 900</option><option value="portrait">Portrait · 1080 × 1350</option></select></label>
        <button type="button" onClick={download} disabled={!svg} className="rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-2 font-black text-[#071426] disabled:opacity-40">Download PNG</button>
      </div>
      <p className="mt-3 text-xs text-slate-400">NBA Game Projections · Adaptive cards for 1–6 games and a compact table for 7+ games. All selected matchups are included across pages.</p>
      {pageCount > 1 && <div className="mt-4 flex items-center gap-3 text-sm text-slate-200"><button type="button" disabled={currentPage === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="rounded border border-cyan-400/50 px-3 py-2 disabled:opacity-30">Previous</button><span>Graphic {currentPage + 1} of {pageCount}</span><button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} className="rounded border border-cyan-400/50 px-3 py-2 disabled:opacity-30">Next</button></div>}
      {busy && <p className="mt-4 text-cyan-300">Loading current model projections…</p>}
      {error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}
      {payload && <div className="mt-4 flex flex-wrap gap-2">{(payload.games || []).map(g => <label key={String(g.game_id)} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200"><input type="checkbox" checked={selectedIds.includes(String(g.game_id))} onChange={e => setSelectedIds(ids => e.target.checked ? [...ids, String(g.game_id)] : ids.filter(id => id !== String(g.game_id)))} />{g.away_team} @ {g.home_team}</label>)}</div>}
    </div>
    <div ref={preview} className="mt-6 overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[#070f20] p-2">
      {svg ? <div className="w-full" dangerouslySetInnerHTML={{ __html: previewSvg(svg) }} /> : <p className="p-10 text-center text-slate-400">No valid projections selected for this slate.</p>}
    </div>
  </main>;
}
