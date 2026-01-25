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

  // Check if score already exists
  const { data: existingScore } = await supabase
    .from('scores')
    .select('id')
    .eq('game_id', input.game_id)
    .eq('player_id', input.player_id)
    .eq('hole_number', input.hole_number)
    .single();

  if (existingScore) {
    // Update existing score
    const { error } = await supabase
      .from('scores')
      .update({ strokes: input.strokes })
      .eq('id', existingScore.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Insert new score
    const { error } = await supabase.from('scores').insert({
      game_id: input.game_id,
      player_id: input.player_id,
      hole_number: input.hole_number,
      strokes: input.strokes,
    });

    if (error) {
      return { error: error.message };
    }
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

  // Process each score
  for (const score of scores) {
    const result = await updateScore({
      game_id: gameId,
      player_id: score.playerId,
      hole_number: score.holeNumber,
      strokes: score.strokes,
    });

    if (result.error) {
      return { error: result.error };
    }
  }

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function getScoresForGame(gameId: string) {
  const supabase = await createClient();

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
