import type { Score, GameConfig, NassauResult } from '@/types/database';

interface PlayerTotals {
  playerId: string;
  frontNine: number;
  backNine: number;
  total: number;
}

interface PressInfo {
  start_hole: number;
  triggered_by: string; // Player who triggered press (the one behind)
  nine: 'front' | 'back';
  winner_id: string | null;
  margin: number;
}

/**
 * Calculate hole-by-hole match status for auto-press logic
 * Returns which player is ahead on each hole (match play style)
 */
function calculateHoleByHoleStatus(
  scores: Score[],
  playerIds: string[],
  startHole: number,
  endHole: number
): { hole: number; leader_id: string | null; holes_up: number }[] {
  const status: { hole: number; leader_id: string | null; holes_up: number }[] = [];

  const holesWon: Record<string, number> = {};
  playerIds.forEach(id => holesWon[id] = 0);

  for (let hole = startHole; hole <= endHole; hole++) {
    const holeScores: { playerId: string; strokes: number }[] = [];

    playerIds.forEach(playerId => {
      const score = scores.find(s => s.player_id === playerId && s.hole_number === hole);
      if (score && score.strokes !== null) {
        holeScores.push({ playerId, strokes: score.strokes });
      }
    });

    // All players must have a score for this hole to count
    if (holeScores.length === playerIds.length) {
      // Find lowest score
      const minStrokes = Math.min(...holeScores.map(s => s.strokes));
      const winners = holeScores.filter(s => s.strokes === minStrokes);

      // If exactly one player has lowest score, they win the hole
      if (winners.length === 1) {
        holesWon[winners[0].playerId]++;
      }
      // If tie, no one wins the hole
    }

    // Calculate current leader
    const holesWonValues = Object.entries(holesWon);
    const maxHolesWon = Math.max(...holesWonValues.map(([, v]) => v));
    const leaders = holesWonValues.filter(([, v]) => v === maxHolesWon);

    if (leaders.length === 1 && maxHolesWon > 0) {
      // Find second place
      const secondPlace = Math.max(...holesWonValues.filter(([id]) => id !== leaders[0][0]).map(([, v]) => v));
      status.push({
        hole,
        leader_id: leaders[0][0],
        holes_up: maxHolesWon - secondPlace
      });
    } else {
      status.push({
        hole,
        leader_id: null,
        holes_up: 0
      });
    }
  }

  return status;
}

/**
 * Determine presses for a 9-hole segment
 */
function calculatePresses(
  scores: Score[],
  config: GameConfig,
  playerIds: string[],
  startHole: number,
  endHole: number,
  nine: 'front' | 'back'
): PressInfo[] {
  if (!config.auto_press || !config.press_after_down) {
    return [];
  }

  const pressThreshold = config.press_after_down;
  const presses: PressInfo[] = [];
  const holeStatus = calculateHoleByHoleStatus(scores, playerIds, startHole, endHole);

  // Track when each player last pressed to prevent duplicate presses at same deficit
  const lastPressDeficit: Record<string, number> = {};
  playerIds.forEach(id => lastPressDeficit[id] = 0);

  for (const status of holeStatus) {
    if (status.leader_id && status.holes_up >= pressThreshold) {
      // Find the player(s) who are behind
      playerIds.forEach(playerId => {
        if (playerId !== status.leader_id) {
          // Check if this player should trigger a new press
          // A new press is triggered when they fall further behind than their last press
          if (status.holes_up > lastPressDeficit[playerId] &&
              status.holes_up >= pressThreshold + lastPressDeficit[playerId]) {
            presses.push({
              start_hole: status.hole + 1, // Press starts on next hole
              triggered_by: playerId,
              nine,
              winner_id: null,
              margin: 0
            });
            lastPressDeficit[playerId] = status.holes_up;
          }
        }
      });
    }
  }

  // Calculate results for each press
  return presses.map(press => {
    if (press.start_hole > endHole) {
      // Press started after last hole, no result
      return press;
    }

    const pressStatus = calculateHoleByHoleStatus(
      scores,
      playerIds,
      press.start_hole,
      endHole
    );

    const lastStatus = pressStatus[pressStatus.length - 1];
    if (lastStatus) {
      return {
        ...press,
        winner_id: lastStatus.leader_id,
        margin: lastStatus.holes_up
      };
    }

    return press;
  });
}

/**
 * Calculate Nassau game results
 *
 * Nassau is three separate bets:
 * 1. Front 9 (holes 1-9) - lowest total wins
 * 2. Back 9 (holes 10-18) - lowest total wins
 * 3. Overall 18 - lowest total wins
 *
 * With auto-press: when a player falls behind by X holes (match play style),
 * a new bet (press) automatically starts from the next hole
 */
export function calculateNassau(
  scores: Score[],
  config: GameConfig,
  playerIds: string[],
  holes: 9 | 18
): NassauResult {
  // Calculate totals for each player
  const playerTotals: PlayerTotals[] = playerIds.map((playerId) => {
    const playerScores = scores.filter((s) => s.player_id === playerId);

    const frontNine = playerScores
      .filter((s) => s.hole_number <= 9 && s.strokes !== null)
      .reduce((sum, s) => sum + (s.strokes || 0), 0);

    const backNine = playerScores
      .filter((s) => s.hole_number > 9 && s.strokes !== null)
      .reduce((sum, s) => sum + (s.strokes || 0), 0);

    return {
      playerId,
      frontNine,
      backNine,
      total: frontNine + backNine,
    };
  });

  // Determine front 9 winner (lowest score wins)
  const frontNineResult = determineWinner(
    playerTotals.map((p) => ({ playerId: p.playerId, score: p.frontNine }))
  );

  // Determine back 9 winner (only for 18 hole games)
  const backNineResult =
    holes === 18
      ? determineWinner(
          playerTotals.map((p) => ({ playerId: p.playerId, score: p.backNine }))
        )
      : { winner_id: null, margin: 0 };

  // Determine overall winner
  const overallResult = determineWinner(
    playerTotals.map((p) => ({ playerId: p.playerId, score: p.total }))
  );

  // Calculate auto-presses
  const frontNinePresses = calculatePresses(scores, config, playerIds, 1, 9, 'front');
  const backNinePresses = holes === 18
    ? calculatePresses(scores, config, playerIds, 10, 18, 'back')
    : [];

  const allPresses = [...frontNinePresses, ...backNinePresses];

  return {
    front_nine: {
      winner_id: frontNineResult.winner_id,
      margin: frontNineResult.margin,
    },
    back_nine: {
      winner_id: backNineResult.winner_id,
      margin: backNineResult.margin,
    },
    overall: {
      winner_id: overallResult.winner_id,
      margin: overallResult.margin,
    },
    presses: allPresses.map(p => ({
      start_hole: p.start_hole,
      winner_id: p.winner_id,
      margin: p.margin,
    })),
  };
}

function determineWinner(
  players: { playerId: string; score: number }[]
): { winner_id: string | null; margin: number } {
  if (players.length < 2) {
    return { winner_id: null, margin: 0 };
  }

  // Filter out players with 0 score (haven't played yet)
  const playersWithScores = players.filter((p) => p.score > 0);

  if (playersWithScores.length < 2) {
    return { winner_id: null, margin: 0 };
  }

  // Sort by score (ascending - lower is better in golf)
  const sorted = [...playersWithScores].sort((a, b) => a.score - b.score);

  // Check for tie
  if (sorted[0].score === sorted[1].score) {
    return { winner_id: null, margin: 0 };
  }

  return {
    winner_id: sorted[0].playerId,
    margin: sorted[1].score - sorted[0].score,
  };
}

/**
 * Calculate settlements for Nassau including presses
 */
export function calculateNassauSettlements(
  result: NassauResult,
  config: GameConfig,
  playerIds: string[]
): Map<string, number> {
  const winnings = new Map<string, number>();
  playerIds.forEach((id) => winnings.set(id, 0));

  const frontBet = config.front_nine_bet || 0;
  const backBet = config.back_nine_bet || 0;
  const overallBetValue = config.overall_bet || 0;
  // Press bets default to front nine bet if not specified
  const pressBet = frontBet;

  // For 2-player Nassau, winner takes the bet from loser
  // For multi-player, each loser pays the winner

  if (result.front_nine.winner_id) {
    const winnerId = result.front_nine.winner_id;
    playerIds.forEach((id) => {
      if (id === winnerId) {
        const current = winnings.get(id) || 0;
        winnings.set(id, current + frontBet * (playerIds.length - 1));
      } else {
        const current = winnings.get(id) || 0;
        winnings.set(id, current - frontBet);
      }
    });
  }

  if (result.back_nine.winner_id) {
    const winnerId = result.back_nine.winner_id;
    playerIds.forEach((id) => {
      if (id === winnerId) {
        const current = winnings.get(id) || 0;
        winnings.set(id, current + backBet * (playerIds.length - 1));
      } else {
        const current = winnings.get(id) || 0;
        winnings.set(id, current - backBet);
      }
    });
  }

  if (result.overall.winner_id) {
    const winnerId = result.overall.winner_id;
    playerIds.forEach((id) => {
      if (id === winnerId) {
        const current = winnings.get(id) || 0;
        winnings.set(id, current + overallBetValue * (playerIds.length - 1));
      } else {
        const current = winnings.get(id) || 0;
        winnings.set(id, current - overallBetValue);
      }
    });
  }

  // Settle presses
  for (const press of result.presses) {
    if (press.winner_id) {
      const winnerId = press.winner_id;
      playerIds.forEach((id) => {
        if (id === winnerId) {
          const current = winnings.get(id) || 0;
          winnings.set(id, current + pressBet * (playerIds.length - 1));
        } else {
          const current = winnings.get(id) || 0;
          winnings.set(id, current - pressBet);
        }
      });
    }
  }

  return winnings;
}

/**
 * Get current standings during a Nassau game
 */
export function getNassauStandings(
  scores: Score[],
  playerIds: string[]
): {
  playerId: string;
  frontNine: number;
  backNine: number;
  total: number;
  frontNineHolesPlayed: number;
  backNineHolesPlayed: number;
}[] {
  return playerIds.map((playerId) => {
    const playerScores = scores.filter((s) => s.player_id === playerId);

    const frontNineScores = playerScores.filter(
      (s) => s.hole_number <= 9 && s.strokes !== null
    );
    const backNineScores = playerScores.filter(
      (s) => s.hole_number > 9 && s.strokes !== null
    );

    const frontNine = frontNineScores.reduce(
      (sum, s) => sum + (s.strokes || 0),
      0
    );
    const backNine = backNineScores.reduce(
      (sum, s) => sum + (s.strokes || 0),
      0
    );

    return {
      playerId,
      frontNine,
      backNine,
      total: frontNine + backNine,
      frontNineHolesPlayed: frontNineScores.length,
      backNineHolesPlayed: backNineScores.length,
    };
  });
}

/**
 * Get active presses for display during the game
 */
export function getActivePresses(
  scores: Score[],
  config: GameConfig,
  playerIds: string[],
  holes: 9 | 18
): {
  nine: 'front' | 'back';
  start_hole: number;
  triggered_by: string;
  current_leader: string | null;
  leader_by: number;
}[] {
  if (!config.auto_press || !config.press_after_down) {
    return [];
  }

  const frontNinePresses = calculatePresses(scores, config, playerIds, 1, 9, 'front');
  const backNinePresses = holes === 18
    ? calculatePresses(scores, config, playerIds, 10, 18, 'back')
    : [];

  return [...frontNinePresses, ...backNinePresses].map(p => ({
    nine: p.nine,
    start_hole: p.start_hole,
    triggered_by: p.triggered_by,
    current_leader: p.winner_id,
    leader_by: p.margin,
  }));
}
