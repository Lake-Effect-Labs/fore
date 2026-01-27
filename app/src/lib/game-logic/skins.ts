import type { Score, GameConfig, SkinsResult } from '@/types/database';

interface PlayerScore {
  playerId: string;
  strokes: number | null;
}

interface HoleScores {
  [holeNumber: number]: PlayerScore[];
}

/**
 * Calculate Skins game results
 *
 * Rules:
 * - Lowest score on a hole wins the skin
 * - If multiple players tie for lowest, no one wins (or carries over if enabled)
 * - Carryovers accumulate until someone wins outright
 */
export function calculateSkins(
  scores: Score[],
  config: GameConfig,
  holes: number
): SkinsResult[] {
  const skinValue = config.skin_value || 1;
  const carryOver = config.carry_over ?? true;

  // Group scores by hole
  const holeScores: HoleScores = {};
  for (let i = 1; i <= holes; i++) {
    holeScores[i] = [];
  }

  scores.forEach((score) => {
    if (score.strokes !== null) {
      holeScores[score.hole_number].push({
        playerId: score.player_id,
        strokes: score.strokes,
      });
    }
  });

  const results: SkinsResult[] = [];
  let carryoverValue = 0;

  for (let hole = 1; hole <= holes; hole++) {
    const holeData = holeScores[hole];
    const currentValue = skinValue + carryoverValue;

    // Not all players have scored this hole yet
    if (holeData.length === 0) {
      results.push({
        hole,
        winner_id: null,
        value: currentValue,
        carried: false,
      });
      continue;
    }

    // Find lowest score
    const validScores = holeData.filter((s) => s.strokes !== null);
    if (validScores.length === 0) {
      // All scores are null for this hole
      results.push({
        hole,
        winner_id: null,
        value: currentValue,
        carried: false,
      });
      continue;
    }

    const lowestScore = Math.min(...validScores.map((s) => s.strokes!));

    // Find players with lowest score
    const winners = holeData.filter((s) => s.strokes === lowestScore);

    if (winners.length === 1) {
      // Single winner takes the skin
      results.push({
        hole,
        winner_id: winners[0].playerId,
        value: currentValue,
        carried: false,
      });
      carryoverValue = 0;
    } else {
      // Tie - no winner
      if (carryOver) {
        carryoverValue = currentValue;
        results.push({
          hole,
          winner_id: null,
          value: currentValue,
          carried: true,
        });
      } else {
        results.push({
          hole,
          winner_id: null,
          value: 0,
          carried: false,
        });
      }
    }
  }

  return results;
}

/**
 * Calculate total winnings per player from skins results
 */
export function calculateSkinsSettlements(
  results: SkinsResult[],
  playerIds: string[]
): Map<string, number> {
  const winnings = new Map<string, number>();

  // Initialize all players with 0
  playerIds.forEach((id) => winnings.set(id, 0));

  // Count winnings
  results.forEach((result) => {
    if (result.winner_id && !result.carried) {
      const current = winnings.get(result.winner_id) || 0;
      winnings.set(result.winner_id, current + result.value);
    }
  });

  return winnings;
}

/**
 * Get skins standing for display
 */
export function getSkinsStandings(
  results: SkinsResult[],
  playerIds: string[]
): { playerId: string; skinsWon: number; totalValue: number }[] {
  const standings = playerIds.map((playerId) => {
    const playerResults = results.filter(
      (r) => r.winner_id === playerId && !r.carried
    );
    return {
      playerId,
      skinsWon: playerResults.length,
      totalValue: playerResults.reduce((sum, r) => sum + r.value, 0),
    };
  });

  return standings.sort((a, b) => b.totalValue - a.totalValue);
}
