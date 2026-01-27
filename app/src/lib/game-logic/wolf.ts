import type { Score, GameConfig } from '@/types/database';

interface WolfResult {
  playerId: string;
  points: number;
}

/**
 * Calculate Wolf game results
 *
 * Simplified Wolf settlement logic:
 * - Each hole has a "wolf" (rotates among players)
 * - Wolf picks a partner or goes alone after seeing tee shots
 * - Best ball of wolf's team vs. best ball of other team
 * - Points awarded based on wolf_value config
 * - Lone wolf: wolf goes alone, multiplied by lone_wolf_multiplier
 *
 * Since wolf partner selection and lone wolf decisions aren't tracked in scores,
 * this uses a simplified stroke-play-based point system:
 * lowest score on each hole wins points equal to wolf_value.
 */
export function calculateWolf(
  scores: Score[],
  config: GameConfig,
  holes: number
): WolfResult[] {
  const wolfValue = config.wolf_value ?? 1;
  const pointsMap = new Map<string, number>();

  for (let hole = 1; hole <= holes; hole++) {
    const holeScores = scores.filter(
      (s) => s.hole_number === hole && s.strokes !== null
    );

    if (holeScores.length === 0) continue;

    // Initialize players
    for (const s of holeScores) {
      if (!pointsMap.has(s.player_id)) {
        pointsMap.set(s.player_id, 0);
      }
    }

    const minStrokes = Math.min(...holeScores.map((s) => s.strokes!));
    const winners = holeScores.filter((s) => s.strokes === minStrokes);

    // If single winner, they earn points from each other player
    if (winners.length === 1) {
      const winnerId = winners[0].player_id;
      const losers = holeScores.filter((s) => s.player_id !== winnerId);
      pointsMap.set(
        winnerId,
        (pointsMap.get(winnerId) ?? 0) + losers.length * wolfValue
      );
      for (const loser of losers) {
        pointsMap.set(
          loser.player_id,
          (pointsMap.get(loser.player_id) ?? 0) - wolfValue
        );
      }
    }
    // Ties: no points awarded
  }

  const results: WolfResult[] = [];
  pointsMap.forEach((points, playerId) => {
    results.push({ playerId, points });
  });

  return results;
}

export function calculateWolfSettlements(
  results: WolfResult[],
  playerIds: string[]
): Map<string, number> {
  const settlements = new Map<string, number>();

  for (const id of playerIds) {
    const result = results.find((r) => r.playerId === id);
    settlements.set(id, result?.points ?? 0);
  }

  return settlements;
}
