"use client";

import { useEffect, useMemo, useState } from "react";

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
type Market = { game_id: string; away_team?: string; home_team?: string; full_game?: { moneyline?: { home?: number; away?: number }; spread?: { home_line?: number; away_line?: number }; total?: { line?: number } } };
type Selection = { label: string; confidence: number };
const numeric = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
function choices(game: Game, market?: Market): Selection[] {
  const m = game.model || {};
  const lines = market?.full_game;
  const results: Selection[] = [];
  const home = m.home_win_probability, away = m.away_win_probability;
  const normalized = (n: number) => n <= 1 ? n * 100 : n;
  if (numeric(home) && numeric(away) && lines?.moneyline) {
    const side = normalized(home) >= normalized(away) ? "home" : "away";
    const odds = lines.moneyline[side];
    if (numeric(odds)) results.push({ label: `${side === "home" ? game.home_team : game.away_team} ML (${odds > 0 ? "+" : ""}${odds})`, confidence: normalized(side === "home" ? home : away) });
  }
  // Do not assign model confidence to spreads or totals without a corresponding market probability.
  return results;
}
const marketSummary = (game: Game, market?: Market) => {
  const lines = market?.full_game;
  const m = game.model || {};
  const winner = numeric(m.home_win_probability) && numeric(m.away_win_probability)
    ? (m.home_win_probability >= m.away_win_probability ? "home" : "away") : null;
  const spread = winner && lines?.spread ? lines.spread[winner + "_line" as "home_line" | "away_line"] : undefined;
  return {
    ml: choices(game, market)[0]?.label || "N/A",
    spread: numeric(spread) ? `${winner === "home" ? game.home_team : game.away_team} ${spread > 0 ? "+" : ""}${spread}` : "N/A",
    total: numeric(lines?.total?.line) ? `O/U ${lines!.total!.line}` : "N/A",
  };
};
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


const logo = (abbr: string, x: number, y: number, size: number) =>
  `<image href="/api/graphics/team-logo/${esc(abbr)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
const background = (w: number, h: number) => `<defs>
  <linearGradient id="bg" x2="1" y2="1"><stop stop-color="#030a1b"/><stop offset=".55" stop-color="#07142a"/><stop offset="1" stop-color="#230a33"/></linearGradient>
  <linearGradient id="neon"><stop stop-color="#08dfff"/><stop offset=".52" stop-color="#3277ff"/><stop offset="1" stop-color="#ff35c7"/></linearGradient>
  <filter id="glow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#24568a" stroke-opacity=".12"/></pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#grid)"/>
  <path d="M0 10 L${w} 10 M0 ${h-10} L${w} ${h-10}" stroke="url(#neon)" stroke-width="8" filter="url(#glow)"/>
  <path d="M0 ${h*.8} Q${w*.2} ${h*.68} ${w*.4} ${h*.85} T${w} ${h*.76}" fill="none" stroke="#ff26d0" stroke-opacity=".17" stroke-width="5"/>
  <path d="M0 ${h*.18} Q${w*.3} ${h*.3} ${w*.5} ${h*.12} T${w} ${h*.22}" fill="none" stroke="#09e8ff" stroke-opacity=".13" stroke-width="5"/>`;
function header(w: number, date: string, total: number) {
  return `<g font-family="Arial,sans-serif">
    <text x="${w/2}" y="82" text-anchor="middle" font-size="52" font-weight="900" fill="#f958d9">ALPHA WAGERZ</text>
    <text x="${w/2}" y="136" text-anchor="middle" font-size="36" font-weight="900" fill="white">NBA GAME PROJECTIONS</text>
    <text x="${w/2}" y="183" text-anchor="middle" font-size="23" font-weight="700" fill="#36eaff">${esc(date)}  •  ${total} GAMES</text>
    <path d="M65 202 H${w-65}" stroke="url(#neon)" stroke-width="3" filter="url(#glow)"/>
  </g>`;
}
function footer(w: number, h: number, top?: Selection) {
  const line = top ? `MOST CONFIDENT AVAILABLE ML: ${esc(top.label)}  •  ${top.confidence.toFixed(1)}%` : "NO VERIFIED MONEYLINE SELECTION AVAILABLE";
  return `<g font-family="Arial,sans-serif">
    <rect x="64" y="${h-154}" width="${w-128}" height="74" rx="18" fill="#110b2d" stroke="#f34acb" stroke-width="3" filter="url(#glow)"/>
    <text x="${w/2}" y="${h-111}" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">${line}</text>
    <text x="65" y="${h-36}" font-size="27" font-weight="900" fill="#42eaff">FollowTheAlpha</text>
    <text x="${w-65}" y="${h-36}" text-anchor="end" font-size="17" fill="#b8c5db">MODEL PROJECTIONS · NOT FINAL SCORES</text>
  </g>`;
}
function buildSvg(data: Payload, selected: Game[], size: "landscape" | "portrait", markets: Market[]) {
  const w = size === "landscape" ? 1600 : 1080;
  const compact = selected.length >= 7;
  const cols = compact ? 1 : 2;
  const gap = 24, left = 56, top = 228;
  const cardH = compact ? 118 : 338;
  const rows = Math.ceil(selected.length / cols);
  const minHeight = size === "landscape" ? 900 : 1350;
  const h = Math.max(minHeight, top + rows * (cardH + gap) + 200);
  const cardW = (w - left * 2 - gap * (cols-1)) / cols;
  const best = selected.flatMap(g => choices(g, markets.find(m => m.game_id === g.game_id && m.away_team === g.away_team && m.home_team === g.home_team))).sort((a,b) => b.confidence-a.confidence)[0];
  const body = selected.map((game, i) => {
    const x = left + (i%cols)*(cardW+gap), y = top + Math.floor(i/cols)*(cardH+gap);
    const m = game.model || {}, market = markets.find(k => k.game_id === game.game_id);
    const lines = marketSummary(game, market);
    const topPick = choices(game, market)[0];
    const awayPct = pct(m.away_win_probability), homePct = pct(m.home_win_probability);
    const winning = numeric(m.away_win_probability) && numeric(m.home_win_probability)
      ? (m.away_win_probability >= m.home_win_probability ? game.away_team : game.home_team) : "—";
    const frame = `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="18" fill="#071327" stroke="${i%2 ? "#ff49d4" : "#1fe9ff"}" stroke-width="3" filter="url(#glow)"/>`;
    if (compact) return `<g font-family="Arial,sans-serif">${frame}
      ${logo(game.away_team,x+16,y+13,65)} ${logo(game.home_team,x+93,y+13,65)}
      <text x="${x+170}" y="${y+38}" font-size="23" font-weight="900" fill="#fff">${esc(game.away_team)} VS ${esc(game.home_team)}</text>
      <text x="${x+170}" y="${y+72}" font-size="20" fill="#49eaff">SCORE ${score(m.away_score)} – ${score(m.home_score)}</text>
      <text x="${x+cardW*.52}" y="${y+38}" font-size="23" font-weight="900" fill="#fff">${esc(winning)} ${pct(Math.max(m.away_win_probability ?? NaN,m.home_win_probability ?? NaN))}</text>
      <text x="${x+cardW*.52}" y="${y+72}" font-size="18" fill="#ef92df">ML: ${esc(lines.ml)}</text>
      <text x="${x+cardW-18}" y="${y+38}" text-anchor="end" font-size="20" fill="#fff">SPREAD ${esc(lines.spread)}</text>
      <text x="${x+cardW-18}" y="${y+72}" text-anchor="end" font-size="20" fill="#49eaff">${esc(lines.total)}</text>
    </g>`;
    const half = cardW / 2;
    const label = (value: string, max = 25) => esc(value.length > max ? value.slice(0, max - 1) + "…" : value);
    return `<g font-family="Arial,sans-serif">${frame}
      <rect x="${x+14}" y="${y+14}" width="${cardW-28}" height="136" rx="12" fill="#0c1d35"/>
      ${logo(game.away_team,x+28,y+24,74)} ${logo(game.home_team,x+cardW-102,y+24,74)}
      <text x="${x+65}" y="${y+121}" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">${esc(game.away_team)}</text>
      <text x="${x+cardW-65}" y="${y+121}" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">${esc(game.home_team)}</text>
      <text x="${x+half}" y="${y+57}" text-anchor="middle" font-size="22" font-weight="900" fill="#3beaff">VS</text>
      <text x="${x+half}" y="${y+90}" text-anchor="middle" font-size="23" font-weight="900" fill="#fff">${score(m.away_score)} – ${score(m.home_score)}</text>
      <text x="${x+half}" y="${y+115}" text-anchor="middle" font-size="14" fill="#91aecf">PROJECTED SCORE</text>
      <text x="${x+24}" y="${y+179}" font-size="17" font-weight="800" fill="#40e9ff">MODEL WIN PROBABILITY</text>
      <text x="${x+cardW-24}" y="${y+179}" text-anchor="end" font-size="18" font-weight="900" fill="#fff">${awayPct} / ${homePct}</text>
      <rect x="${x+24}" y="${y+192}" width="${cardW-48}" height="6" rx="3" fill="#213c60"/>
      <rect x="${x+24}" y="${y+192}" width="${numeric(m.away_win_probability) ? (cardW-48)*Math.min(1,Math.max(0,m.away_win_probability > 1 ? m.away_win_probability/100 : m.away_win_probability)) : 0}" height="6" rx="3" fill="#30dfff"/>
      <path d="M${x+20} ${y+212} H${x+cardW-20}" stroke="#2d537a" stroke-width="1.5"/>
      <text x="${x+24}" y="${y+235}" font-size="14" font-weight="800" fill="#42eaff">MONEYLINE</text>
      <text x="${x+cardW-24}" y="${y+235}" text-anchor="end" font-size="17" font-weight="800" fill="#fff">${label(lines.ml,29)}</text>
      <text x="${x+24}" y="${y+269}" font-size="14" font-weight="800" fill="#42eaff">SPREAD</text>
      <text x="${x+cardW-24}" y="${y+269}" text-anchor="end" font-size="17" font-weight="800" fill="#fff">${label(lines.spread,24)}</text>
      <text x="${x+24}" y="${y+303}" font-size="14" font-weight="800" fill="#42eaff">OVER / UNDER</text>
      <text x="${x+cardW-24}" y="${y+303}" text-anchor="end" font-size="17" font-weight="800" fill="#fff">${esc(lines.total)}</text>
    </g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${background(w,h)}${header(w,data.slate_date || "DATE UNAVAILABLE",selected.length)}
    ${body}${footer(w,h,best)}
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
async function inlineTeamLogos(svg: string) {
  const urls = [...new Set([...svg.matchAll(/href="(\/api\/graphics\/team-logo\/[A-Z]+)"/g)].map(match => match[1]))];
  let output = svg;
  for (const url of urls) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Team logo unavailable: ${url.split("/").pop()}`);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to embed team logo"));
      reader.readAsDataURL(blob);
    });
    output = output.split(`href="${url}"`).join(`href="${dataUrl}"`);
  }
  return output;
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
  const [format, setFormat] = useState<"landscape" | "portrait">("portrait");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true); setError(""); setPayload(null); setMarkets([]);
    fetch(`/data/nba/${slate === "next" ? "next/" : ""}live_team_markets.json`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(d => { if (active) setMarkets(d?.games || []); }).catch(() => { if (active) setMarkets([]); });
    fetch(`/data/nba/${slate === "next" ? "next/" : ""}betting_projections.json`, { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("NBA projection data is unavailable."); return r.json(); })
      .then((data: Payload) => { if (!active) return; setPayload(data); setSelectedIds((data.games || []).map(g => String(g.game_id))); })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [slate]);
  const games = useMemo(() => (payload?.games || []).filter(g => selectedIds.includes(String(g.game_id))), [payload, selectedIds]);
  const limit = games.length <= 6 ? 6 : 12;
  const pageCount = Math.max(1, Math.ceil(games.length / limit));
  const currentPage = Math.min(page, pageCount - 1);
  const selected = games.slice(currentPage * limit, (currentPage + 1) * limit);
  const svg = payload && selected.length ? buildSvg(payload, selected, format, markets) : "";
  useEffect(() => { setPage(0); }, [slate, format, selectedIds]);
  const best = games.flatMap(g => choices(g, markets.find(m => m.game_id === g.game_id)).map(p => ({ ...p, game: g }))).sort((a,b) => b.confidence - a.confidence)[0];
  const download = async () => {
    if (!svg) return;
    setError("");
    try {
      const image = new Image();
      const exportSvg = await inlineTeamLogos(svg);
      const svgUrl = URL.createObjectURL(new Blob([exportSvg], { type: "image/svg+xml;charset=utf-8" }));
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
      <p className="mt-3 text-xs text-slate-400">NBA Game Projections · Adaptive cards for 1–6 games and a compact table for 7+ games. All selected matchups are included across pages. Spreads/totals show available market lines, not unverified model probabilities.</p>
      {pageCount > 1 && <div className="mt-4 flex items-center gap-3 text-sm text-slate-200"><button type="button" disabled={currentPage === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="rounded border border-cyan-400/50 px-3 py-2 disabled:opacity-30">Previous</button><span>Graphic {currentPage + 1} of {pageCount}</span><button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} className="rounded border border-cyan-400/50 px-3 py-2 disabled:opacity-30">Next</button></div>}
      {best && <p className="mt-3 text-sm font-bold text-cyan-300">Most Confident Available Moneyline: {best.label} · {best.confidence.toFixed(1)}% model win probability</p>}
      {busy && <p className="mt-4 text-cyan-300">Loading current model projections…</p>}
      {error && <p role="alert" className="mt-4 text-rose-300">{error}</p>}
      {payload && <div className="mt-4 flex flex-wrap gap-2">{(payload.games || []).map(g => <label key={String(g.game_id)} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200"><input type="checkbox" checked={selectedIds.includes(String(g.game_id))} onChange={e => setSelectedIds(ids => e.target.checked ? [...ids, String(g.game_id)] : ids.filter(id => id !== String(g.game_id)))} />{g.away_team} @ {g.home_team}</label>)}</div>}
    </div>
    <div className="mt-6 overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-[#070f20] p-2">
      {svg ? <div className="w-full" dangerouslySetInnerHTML={{ __html: previewSvg(svg) }} /> : <p className="p-10 text-center text-slate-400">No valid projections selected for this slate.</p>}
    </div>
  </main>;
}
