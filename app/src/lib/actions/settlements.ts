'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getGame } from './games';
import {
  calculateGameSettlements,
  generateSettlementPairs,
  createSettlementSummaries,
} from '@/lib/game-logic';
import type { SettlementSummary } from '@/types/database';

export async function calculateAndSaveSettlements(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const game = await getGame(gameId);
  if (!game) {
    return { error: 'Game not found' };
  }

  // Verify user is the game creator
  if (game.created_by !== user.id) {
    return { error: 'Only the game creator can calculate settlements' };
  }

  if (!game.config) {
    return { error: 'Game config not found' };
  }

  // Calculate settlements
  const winnings = calculateGameSettlements(
    game,
    game.config,
    game.scores,
    game.players
  );

  const pairs = generateSettlementPairs(winnings);

  // Insert new settlements first, then delete old ones.
  // This ordering ensures data is never lost: if insert fails,
  // old settlements remain intact.
  const newSettlements = pairs.map((pair) => ({
    game_id: gameId,
    from_player_id: pair.from,
    to_player_id: pair.to,
    amount: pair.amount,
    reason: game.format,
    is_paid: false,
  }));

  // Get existing settlement IDs before inserting new ones
  const { data: existingSettlements } = await supabase
    .from('settlements')
    .select('id')
    .eq('game_id', gameId);

  const existingIds = (existingSettlements || []).map((s) => s.id);

  // Insert new settlements
  if (newSettlements.length > 0) {
    const { error: insertError } = await supabase.from('settlements').insert(newSettlements);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  // Delete old settlements only after successful insert
  if (existingIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('settlements')
      .delete()
      .in('id', existingIds);

    if (deleteError) {
      // Non-fatal: new settlements exist, old ones are orphaned but not lost
      console.error('Failed to clean up old settlements:', deleteError.message);
    }
  }

  revalidatePath(`/games/${gameId}`);
  revalidatePath(`/games/${gameId}/settlements`);
  return { success: true };
}

export async function getSettlementSummaries(
  gameId: string
): Promise<SettlementSummary[]> {
  const game = await getGame(gameId);
  if (!game || !game.config) return [];

  const winnings = calculateGameSettlements(
    game,
    game.config,
    game.scores,
    game.players
  );

  return createSettlementSummaries(winnings, game.players);
}

export async function markSettlementPaid(settlementId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get the settlement and verify the user is involved
  const { data: settlement } = await supabase
    .from('settlements')
    .select('game_id, from_player_id, to_player_id')
    .eq('id', settlementId)
    .single();

  if (!settlement) {
    return { error: 'Settlement not found' };
  }

  // Check that the current user is a player in the game associated with this settlement
  const { data: player } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', settlement.game_id)
    .eq('user_id', user.id)
    .single();

  if (!player) {
    return { error: 'Not authorized to update this settlement' };
  }

  const { error } = await supabase
    .from('settlements')
    .update({ is_paid: true })
    .eq('id', settlementId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
