import type { Score, GameConfig, GamePlayerWithProfile } from '@/types/database';

interface BestBallResult {
  teamScores: Map<number, number>; // team number -> total best ball score
  winningTeam: number | null;
}

/**
 * Calculate Best Ball game results
 *
 * Rules:
 * - Players are divided into teams (using player.team field)
 * - On each hole, the best (lowest) score from each team counts
 * - Team with the lower total best-ball score wins the bet
 */
export function calculateBestBall(
  scores: Score[],
  config: GameConfig,
  players: GamePlayerWithProfile[],
  holes: number
): BestBallResult {
  const teamScores = new Map<number, number>();

  // Group players by team
  const playerTeams = new Map<string, number>();
  const teams = new Set<number>();
  for (const p of players) {
    const team = p.team ?? 0;
    playerTeams.set(p.id, team);
    teams.add(team);
  }

  // For each team, calculate best ball total
  for (const team of teams) {
    const teamPlayerIds = players
      .filter((p) => (p.team ?? 0) === team)
      .map((p) => p.id);

    let total = 0;
    for (let hole = 1; hole <= holes; hole++) {
      const holeScores = scores.filter(
        (s) =>
          s.hole_number === hole &&
          s.strokes !== null &&
          teamPlayerIds.includes(s.player_id)
      );

      if (holeScores.length > 0) {
        total += Math.min(...holeScores.map((s) => s.strokes!));
      }
    }

    teamScores.set(team, total);
  }

  // Determine winning team (lowest total)
  let winningTeam: number | null = null;
  let lowestScore = Infinity;
  for (const [team, score] of teamScores) {
    if (score < lowestScore) {
      lowestScore = score;
      winningTeam = team;
    } else if (score === lowestScore) {
      winningTeam = null; // tie
    }
  }

  return { teamScores, winningTeam };
}

export function calculateBestBallSettlements(
  result: BestBallResult,
  config: GameConfig,
  players: GamePlayerWithProfile[]
): Map<string, number> {
  const settlements = new Map<string, number>();
  const bet = config.best_ball_bet ?? 0;

  if (bet === 0 || result.winningTeam === null) {
    // No bet or tie - everyone at zero
    for (const p of players) {
      settlements.set(p.id, 0);
    }
    return settlements;
  }

  const winningTeam = result.winningTeam;
  const winners = players.filter((p) => (p.team ?? 0) === winningTeam);
  const losers = players.filter((p) => (p.team ?? 0) !== winningTeam);

  if (winners.length === 0 || losers.length === 0) {
    for (const p of players) {
      settlements.set(p.id, 0);
    }
    return settlements;
  }

  // Each loser pays the bet, split among winners
  const totalPool = losers.length * bet;
  const winnerShare = totalPool / winners.length;
  const loserShare = -bet;

  for (const w of winners) {
    settlements.set(w.id, winnerShare);
  }
  for (const l of losers) {
    settlements.set(l.id, loserShare);
  }

  return settlements;
}
