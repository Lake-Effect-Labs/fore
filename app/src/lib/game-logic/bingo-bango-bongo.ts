import type { Score, GameConfig } from '@/types/database';

interface BingoBangoBongoResult {
  playerId: string;
  bingos: number; // first on green (lowest score proxy: fewest strokes)
  bangos: number; // closest to pin (not trackable from scores - use lowest score)
  bongos: number; // first in hole (lowest score proxy)
  totalPoints: number;
}

/**
 * Calculate Bingo Bango Bongo game results
 *
 * Traditional rules (3 points per hole):
 * - Bingo: First player on the green
 * - Bango: Closest to the pin once all on the green
 * - Bongo: First player in the hole
 *
 * Since we only have stroke counts (not shot-by-shot data),
 * we approximate by awarding all three points to the lowest
 * scorer on each hole. On ties, no points are awarded.
 *
 * Each point type has its own configurable value.
 */
export function calculateBingoBangoBongo(
  scores: Score[],
  _config: GameConfig,
  holes: number
): BingoBangoBongoResult[] {
  // Note: Point values in config are used in settlements, not here
  const pointsMap = new Map<string, { bingos: number; bangos: number; bongos: number }>();

  for (let hole = 1; hole <= holes; hole++) {
    const holeScores = scores.filter(
      (s) => s.hole_number === hole && s.strokes !== null
    );

    if (holeScores.length === 0) continue;

    // Initialize players
    for (const s of holeScores) {
      if (!pointsMap.has(s.player_id)) {
        pointsMap.set(s.player_id, { bingos: 0, bangos: 0, bongos: 0 });
      }
    }

    const minStrokes = Math.min(...holeScores.map((s) => s.strokes!));
    const winners = holeScores.filter((s) => s.strokes === minStrokes);

    // Award points only on clear winner (no ties)
    if (winners.length === 1) {
      const winnerId = winners[0].player_id;
      const pts = pointsMap.get(winnerId)!;
      pts.bingos += 1;
      pts.bangos += 1;
      pts.bongos += 1;
    }
  }

  const results: BingoBangoBongoResult[] = [];
  pointsMap.forEach((pts, playerId) => {
    results.push({
      playerId,
      bingos: pts.bingos,
      bangos: pts.bangos,
      bongos: pts.bongos,
      totalPoints: pts.bingos + pts.bangos + pts.bongos,
    });
  });

  return results;
}

export function calculateBingoBangoBongoSettlements(
  results: BingoBangoBongoResult[],
  config: GameConfig,
  playerIds: string[]
): Map<string, number> {
  const bingoValue = config.bingo_value ?? 1;
  const bangoValue = config.bango_value ?? 1;
  const bongoValue = config.bongo_value ?? 1;

  const settlements = new Map<string, number>();

  // Calculate each player's earnings from points
  const earnings = new Map<string, number>();
  let totalEarnings = 0;

  for (const id of playerIds) {
    const result = results.find((r) => r.playerId === id);
    const earned = result
      ? result.bingos * bingoValue +
        result.bangos * bangoValue +
        result.bongos * bongoValue
      : 0;
    earnings.set(id, earned);
    totalEarnings += earned;
  }

  // Net settlement: each player pays equal share of total pot, earns what they won
  const perPlayerCost = totalEarnings / playerIds.length;

  for (const id of playerIds) {
    const earned = earnings.get(id) ?? 0;
    settlements.set(id, earned - perPlayerCost);
  }

  return settlements;
}
