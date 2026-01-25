import type { Score, GameConfig, MatchPlayResult } from '@/types/database';

interface HoleResult {
  hole: number;
  winner_id: string | null; // null = halved
  player1Score: number | null;
  player2Score: number | null;
}

/**
 * Calculate Match Play game results
 *
 * Match Play Rules:
 * - Hole-by-hole competition between two players
 * - Lower score on a hole wins that hole
 * - Equal scores = hole is "halved" (tied)
 * - Match status expressed as holes up/down
 * - Match can end early if lead is greater than remaining holes
 * - Final result: "3&2" (won 3 up with 2 holes to play), "1 up", "All Square"
 */
export function calculateMatchPlay(
  scores: Score[],
  config: GameConfig,
  player1Id: string,
  player2Id: string,
  holes: 9 | 18
): MatchPlayResult {
  const holeResults: HoleResult[] = [];
  let player1Up = 0;

  for (let hole = 1; hole <= holes; hole++) {
    const p1Score = scores.find(
      (s) => s.player_id === player1Id && s.hole_number === hole
    )?.strokes;
    const p2Score = scores.find(
      (s) => s.player_id === player2Id && s.hole_number === hole
    )?.strokes;

    let winner_id: string | null = null;

    if (p1Score !== null && p1Score !== undefined && p2Score !== null && p2Score !== undefined) {
      if (p1Score < p2Score) {
        winner_id = player1Id;
        player1Up++;
      } else if (p2Score < p1Score) {
        winner_id = player2Id;
        player1Up--;
      }
      // Equal scores = halved, player1Up stays the same
    }

    holeResults.push({
      hole,
      winner_id,
      player1Score: p1Score ?? null,
      player2Score: p2Score ?? null,
    });
  }

  // Count holes played (both players have scores)
  const holesPlayed = holeResults.filter(
    (h) => h.player1Score !== null && h.player2Score !== null
  ).length;

  const holesRemaining = holes - holesPlayed;
  const absLead = Math.abs(player1Up);

  // Check if match is dormie or finished
  const isFinished = holesPlayed === holes || absLead > holesRemaining;

  let leader_id: string | null = null;
  if (player1Up > 0) {
    leader_id = player1Id;
  } else if (player1Up < 0) {
    leader_id = player2Id;
  }

  let final_result: string | null = null;
  if (isFinished) {
    if (player1Up === 0) {
      final_result = 'All Square';
    } else if (holesRemaining > 0) {
      // Match ended early
      final_result = `${absLead}&${holesRemaining}`;
    } else {
      // Went to final hole
      final_result = `${absLead} up`;
    }
  }

  return {
    status: isFinished ? 'finished' : 'in_progress',
    leader_id,
    holes_up: absLead,
    holes_remaining: holesRemaining,
    final_result,
  };
}

/**
 * Get match play status string for display
 * e.g., "Player 1 is 2 up with 5 to play"
 */
export function getMatchPlayStatusText(
  result: MatchPlayResult,
  player1Name: string,
  player2Name: string
): string {
  if (result.status === 'finished') {
    if (result.final_result === 'All Square') {
      return 'Match ended All Square';
    }
    const winnerName = result.leader_id ? player1Name : player2Name;
    return `${winnerName} wins ${result.final_result}`;
  }

  if (result.leader_id === null) {
    return `All Square, ${result.holes_remaining} to play`;
  }

  const leaderName = result.leader_id === player1Name ? player1Name : player2Name;
  return `${leaderName} is ${result.holes_up} up with ${result.holes_remaining} to play`;
}

/**
 * Calculate settlements for Match Play
 */
export function calculateMatchPlaySettlements(
  result: MatchPlayResult,
  config: GameConfig,
  player1Id: string,
  player2Id: string
): Map<string, number> {
  const winnings = new Map<string, number>();
  const matchBet = config.match_bet || 0;

  winnings.set(player1Id, 0);
  winnings.set(player2Id, 0);

  if (result.status === 'finished' && result.leader_id) {
    const loserId = result.leader_id === player1Id ? player2Id : player1Id;
    winnings.set(result.leader_id, matchBet);
    winnings.set(loserId, -matchBet);
  }

  return winnings;
}

/**
 * Get hole-by-hole match play details
 */
export function getMatchPlayHoleDetails(
  scores: Score[],
  player1Id: string,
  player2Id: string,
  holes: 9 | 18
): {
  hole: number;
  player1Score: number | null;
  player2Score: number | null;
  winner_id: string | null;
  matchStatus: number; // positive = player1 up, negative = player2 up
}[] {
  const details: {
    hole: number;
    player1Score: number | null;
    player2Score: number | null;
    winner_id: string | null;
    matchStatus: number;
  }[] = [];

  let runningStatus = 0;

  for (let hole = 1; hole <= holes; hole++) {
    const p1Score = scores.find(
      (s) => s.player_id === player1Id && s.hole_number === hole
    )?.strokes;
    const p2Score = scores.find(
      (s) => s.player_id === player2Id && s.hole_number === hole
    )?.strokes;

    let winner_id: string | null = null;

    if (p1Score !== null && p1Score !== undefined && p2Score !== null && p2Score !== undefined) {
      if (p1Score < p2Score) {
        winner_id = player1Id;
        runningStatus++;
      } else if (p2Score < p1Score) {
        winner_id = player2Id;
        runningStatus--;
      }
    }

    details.push({
      hole,
      player1Score: p1Score ?? null,
      player2Score: p2Score ?? null,
      winner_id,
      matchStatus: runningStatus,
    });
  }

  return details;
}
