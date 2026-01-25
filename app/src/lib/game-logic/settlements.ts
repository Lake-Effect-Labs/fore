import type {
  Game,
  GameConfig,
  Score,
  GamePlayerWithProfile,
  SettlementSummary,
} from '@/types/database';
import { calculateSkins, calculateSkinsSettlements } from './skins';
import { calculateNassau, calculateNassauSettlements } from './nassau';
import { calculateMatchPlay, calculateMatchPlaySettlements } from './match-play';

/**
 * Calculate final settlements for a game based on format
 * Returns a map of player_id -> net amount (positive = won, negative = owed)
 */
export function calculateGameSettlements(
  game: Game,
  config: GameConfig,
  scores: Score[],
  players: GamePlayerWithProfile[]
): Map<string, number> {
  const playerIds = players.map((p) => p.id);

  switch (game.format) {
    case 'skins': {
      const results = calculateSkins(scores, config, game.holes);
      return calculateSkinsSettlements(results, playerIds);
    }

    case 'nassau': {
      const results = calculateNassau(scores, config, playerIds, game.holes as 9 | 18);
      return calculateNassauSettlements(results, config, playerIds);
    }

    case 'match_play': {
      if (players.length !== 2) {
        throw new Error('Match play requires exactly 2 players');
      }
      const results = calculateMatchPlay(
        scores,
        config,
        playerIds[0],
        playerIds[1],
        game.holes as 9 | 18
      );
      return calculateMatchPlaySettlements(results, config, playerIds[0], playerIds[1]);
    }

    default:
      return new Map();
  }
}

/**
 * Generate "who owes who" settlement pairs
 * Simplifies debts so each pair only has one direction of payment
 */
export function generateSettlementPairs(
  winnings: Map<string, number>
): { from: string; to: string; amount: number }[] {
  const pairs: { from: string; to: string; amount: number }[] = [];

  // Separate winners and losers
  const winners: { id: string; amount: number }[] = [];
  const losers: { id: string; amount: number }[] = [];

  winnings.forEach((amount, id) => {
    if (amount > 0) {
      winners.push({ id, amount });
    } else if (amount < 0) {
      losers.push({ id, amount: Math.abs(amount) });
    }
  });

  // Sort by amount (descending)
  winners.sort((a, b) => b.amount - a.amount);
  losers.sort((a, b) => b.amount - a.amount);

  // Match losers to winners
  let winnerIdx = 0;
  let loserIdx = 0;

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const winner = winners[winnerIdx];
    const loser = losers[loserIdx];

    const transferAmount = Math.min(winner.amount, loser.amount);

    if (transferAmount > 0) {
      pairs.push({
        from: loser.id,
        to: winner.id,
        amount: transferAmount,
      });
    }

    winner.amount -= transferAmount;
    loser.amount -= transferAmount;

    if (winner.amount <= 0) winnerIdx++;
    if (loser.amount <= 0) loserIdx++;
  }

  return pairs;
}

/**
 * Create detailed settlement summaries for each player
 */
export function createSettlementSummaries(
  winnings: Map<string, number>,
  players: GamePlayerWithProfile[]
): SettlementSummary[] {
  const pairs = generateSettlementPairs(winnings);

  return players.map((player) => {
    const net = winnings.get(player.id) || 0;

    const owes = pairs
      .filter((p) => p.from === player.id)
      .map((p) => ({ to_player_id: p.to, amount: p.amount }));

    const owed_by = pairs
      .filter((p) => p.to === player.id)
      .map((p) => ({ from_player_id: p.from, amount: p.amount }));

    return {
      player_id: player.id,
      profile: player.profile,
      total_won: net > 0 ? net : 0,
      total_lost: net < 0 ? Math.abs(net) : 0,
      net,
      owes,
      owed_by,
    };
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get a summary text of the game results
 */
export function getGameResultsSummary(
  game: Game,
  summaries: SettlementSummary[]
): string {
  const sortedByNet = [...summaries].sort((a, b) => b.net - a.net);

  if (sortedByNet[0].net === 0) {
    return 'All Square - no money changes hands';
  }

  const winner = sortedByNet[0];
  const winnerName = winner.profile.display_name || winner.profile.full_name || 'Player';

  return `${winnerName} wins ${formatCurrency(winner.net)}`;
}
