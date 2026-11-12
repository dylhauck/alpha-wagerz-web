import { NextRequest, NextResponse } from "next/server";
import { POST as getExistingPlayerProps } from "../player-props/route";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecordValue = Record<string, unknown>;
type PlayerRow = RecordValue & {
  player?: string;
  player_name?: string;
  player_id?: string;
  team?: string;
  position?: string;
  game_id?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: unknown): string {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function readData(relativePath: string): Promise<unknown> {
  const file = path.join(process.cwd(), "public", "data", "nfl", relativePath);
  return JSON.parse(await fs.readFile(file, "utf8"));
}

/**
 * Read-only graphics adapter for the EXISTING player-props POST endpoint.
 * Does not change the player modal, model, or odds retrieval logic.
 *
 * GET /api/nfl/graphics-player-props?game_id=...&players=Name%201,Name%202
 *
 * Each player is validated against current projections. To avoid silently
 * hammering the live odds provider, callers may request at most 6 players.
 * Ranking is by absolute projection-vs-line percentage difference; it is
 * NOT a calibrated probability of winning.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const gameId = clean(params.get("game_id"));
    const requested = (params.get("players") ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    if (!gameId || requested.length === 0 || requested.length > 6) {
      return NextResponse.json(
        { ok: false, error: "Provide game_id and 1–6 comma-separated player names." },
        { status: 400 }
      );
    }

    const [projectionData, oddsData] = await Promise.all([
      readData("player_projections.json"),
      readData("odds.json"),
    ]);

    const projectionRows = (projectionData as { players?: PlayerRow[] }).players ?? [];
    const games = (oddsData as { games?: RecordValue[] }).games ?? [];
    const game = games.find((entry) => clean(entry.game_id) === gameId);

    if (!game || !game.event_id) {
      return NextResponse.json(
        { ok: false, error: "Game is not linked to a current sportsbook event." },
        { status: 404 }
      );
    }

    const available = projectionRows.filter((row) => clean(row.game_id) === gameId);
    const selected: PlayerRow[] = [];

    for (const name of requested) {
      const match = available.find(
        (row) => normalize(row.player_name ?? row.player) === normalize(name)
      );
      if (!match) {
        return NextResponse.json(
          { ok: false, error: `Player not found in this game's projections: ${name}` },
          { status: 400 }
        );
      }
      if (!selected.some((row) => row.player_id === match.player_id)) {
        selected.push(match);
      }
    }

    // Reuse the exact POST handler powering the existing player modal.
    // Sequential requests avoid a burst of simultaneous upstream odds calls.
    const results: RecordValue[] = [];
    for (const player of selected) {
      const playerName = clean(player.player_name ?? player.player);
      const internalRequest = new NextRequest(
        new URL("/api/nfl/player-props", request.url),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player: playerName,
            player_id: player.player_id,
            team: player.team,
            position: player.position,
            event_id: String(game.event_id),
            game_id: gameId,
            slate: "current",
          }),
        }
      );
      const response = await getExistingPlayerProps(internalRequest);
      const payload = (await response.json()) as RecordValue;
      if (!response.ok || payload.ok !== true) {
        return NextResponse.json(
          { ok: false, error: `Could not retrieve live props for ${playerName}.` },
          { status: 502 }
        );
      }
      const props = Array.isArray(payload.props) ? payload.props : [];
      for (const item of props) {
        if (item && typeof item === "object") {
          results.push(item as RecordValue);
        }
      }
    }

    const ranked = results
      .filter(
        (prop) =>
          (prop.pick === "OVER" || prop.pick === "UNDER") &&
          typeof prop.line === "number" &&
          typeof prop.projection === "number" &&
          typeof prop.edge_percent === "number"
      )
      .sort(
        (a, b) =>
          Math.abs(Number(b.edge_percent)) - Math.abs(Number(a.edge_percent))
      );

    return NextResponse.json(
      {
        ok: true,
        game_id: gameId,
        event_id: String(game.event_id),
        ranking_method: "absolute_projection_vs_line_percentage_difference",
        ranking_note: "Ranking is a projection gap, not a win probability or validated betting confidence.",
        players_requested: selected.length,
        props_found: results.length,
        ranked_props: ranked,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to retrieve graphics player props." },
      { status: 500 }
    );
  }
}
