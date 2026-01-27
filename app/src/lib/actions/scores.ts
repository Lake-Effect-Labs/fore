'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UpdateScoreInput } from '@/types/database';

export async function updateScore(input: UpdateScoreInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a player in this game
  const { data: player } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', input.game_id)
    .eq('user_id', user.id)
    .single();

  if (!player) {
    return { error: 'Not a player in this game' };
  }

  // Verify the player_id being scored belongs to the authenticated user
  // This prevents IDOR where a player could modify another player's score
  const { data: targetPlayer } = await supabase
    .from('game_players')
    .select('user_id')
    .eq('game_id', input.game_id)
    .eq('id', input.player_id)
    .single();

  if (!targetPlayer || targetPlayer.user_id !== user.id) {
    return { error: 'You can only update your own scores' };
  }

  // TODO: This requires a unique constraint on (game_id, player_id, hole_number) in the DB.
  // Using upsert to avoid check-then-act race condition where two concurrent
  // requests could both see "no existing score" and both insert.
  const { error } = await supabase
    .from('scores')
    .upsert(
      {
        game_id: input.game_id,
        player_id: input.player_id,
        hole_number: input.hole_number,
        strokes: input.strokes,
      },
      {
        onConflict: 'game_id,player_id,hole_number',
      }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/games/${input.game_id}`);
  return { success: true };
}

export async function updateMultipleScores(
  gameId: string,
  scores: { playerId: string; holeNumber: number; strokes: number }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a player in this game
  const { data: player } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .single();

  if (!player) {
    return { error: 'Not a player in this game' };
  }

  // Batch upsert all scores in a single query instead of N+1 individual calls
  const upsertData = scores.map((score) => ({
    game_id: gameId,
    player_id: score.playerId,
    hole_number: score.holeNumber,
    strokes: score.strokes,
  }));

  const { error } = await supabase
    .from('scores')
    .upsert(upsertData, {
      onConflict: 'game_id,player_id,hole_number',
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function getScoresForGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a player in this game
  const { data: player } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .single();

  if (!player) {
    return { error: 'Not a player in this game' };
  }

  const { data: scores, error } = await supabase
    .from('scores')
    .select('*')
    .eq('game_id', gameId)
    .order('hole_number', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { scores: scores || [] };
}

export async function deleteScore(gameId: string, playerId: string, holeNumber: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is a player in this game
  const { data: player } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .single();

  if (!player) {
    return { error: 'Not a player in this game' };
  }

  // Verify the player_id being deleted belongs to the authenticated user
  // This prevents IDOR where a player could delete another player's score
  const { data: targetPlayer } = await supabase
    .from('game_players')
    .select('user_id')
    .eq('game_id', gameId)
    .eq('id', playerId)
    .single();

  if (!targetPlayer || targetPlayer.user_id !== user.id) {
    return { error: 'You can only delete your own scores' };
  }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('game_id', gameId)
    .eq('player_id', playerId)
    .eq('hole_number', holeNumber);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}
