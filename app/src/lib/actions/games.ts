'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  CreateGameInput,
  GameFormat,
  GameWithDetails,
  GameWithPlayers,
} from '@/types/database';

export async function createGame(input: CreateGameInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Create the game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      created_by: user.id,
      format: input.format,
      status: 'pending',
      course_name: input.course_name || null,
      holes: input.holes,
    })
    .select()
    .single();

  if (gameError) {
    return { error: gameError.message };
  }

  // Create game config
  const { error: configError } = await supabase.from('game_configs').insert({
    game_id: game.id,
    skin_value: input.config.skin_value || null,
    carry_over: input.config.carry_over ?? true,
    front_nine_bet: input.config.front_nine_bet || null,
    back_nine_bet: input.config.back_nine_bet || null,
    overall_bet: input.config.overall_bet || null,
    auto_press: input.config.auto_press ?? false,
    press_after_down: input.config.press_after_down || 2,
    match_bet: input.config.match_bet || null,
  });

  if (configError) {
    // Rollback game creation
    await supabase.from('games').delete().eq('id', game.id);
    return { error: configError.message };
  }

  // Add creator as first player (auto-accepted)
  const { error: creatorError } = await supabase.from('game_players').insert({
    game_id: game.id,
    user_id: user.id,
    invite_status: 'accepted',
  });

  if (creatorError) {
    await supabase.from('games').delete().eq('id', game.id);
    return { error: creatorError.message };
  }

  // Add invited players
  if (input.player_ids.length > 0) {
    const playerInserts = input.player_ids
      .filter((id) => id !== user.id) // Don't re-add creator
      .map((userId) => ({
        game_id: game.id,
        user_id: userId,
        invite_status: 'pending' as const,
      }));

    if (playerInserts.length > 0) {
      const { error: playersError } = await supabase
        .from('game_players')
        .insert(playerInserts);

      if (playersError) {
        await supabase.from('games').delete().eq('id', game.id);
        return { error: playersError.message };
      }
    }
  }

  revalidatePath('/dashboard');
  return { success: true, gameId: game.id };
}

export async function getGame(gameId: string): Promise<GameWithDetails | null> {
  const supabase = await createClient();

  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !game) return null;

  // Get config
  const { data: config } = await supabase
    .from('game_configs')
    .select('*')
    .eq('game_id', gameId)
    .single();

  // Get players with profiles
  const { data: players } = await supabase
    .from('game_players')
    .select('*, profile:profiles(*)')
    .eq('game_id', gameId);

  // Get scores
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('game_id', gameId)
    .order('hole_number', { ascending: true });

  // Get settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('game_id', gameId);

  return {
    ...game,
    config: config || null,
    players: (players || []).map((p) => ({
      ...p,
      profile: p.profile,
    })),
    scores: scores || [],
    settlements: settlements || [],
  } as GameWithDetails;
}

export async function getMyGames(): Promise<GameWithPlayers[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get games where user is a player
  const { data: gameIds } = await supabase
    .from('game_players')
    .select('game_id')
    .eq('user_id', user.id);

  if (!gameIds || gameIds.length === 0) return [];

  const ids = gameIds.map((g) => g.game_id);

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (!games) return [];

  // Get configs and players for each game
  const result: GameWithPlayers[] = [];

  for (const game of games) {
    const { data: config } = await supabase
      .from('game_configs')
      .select('*')
      .eq('game_id', game.id)
      .single();

    const { data: players } = await supabase
      .from('game_players')
      .select('*, profile:profiles(*)')
      .eq('game_id', game.id);

    result.push({
      ...game,
      config: config || null,
      players: (players || []).map((p) => ({
        ...p,
        profile: p.profile,
      })),
    } as GameWithPlayers);
  }

  return result;
}

export async function startGame(gameId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('games')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function completeGame(gameId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('games')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function respondToInvite(
  gameId: string,
  response: 'accepted' | 'declined'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('game_players')
    .update({ invite_status: response })
    .eq('game_id', gameId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function deleteGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is the creator
  const { data: game } = await supabase
    .from('games')
    .select('created_by')
    .eq('id', gameId)
    .single();

  if (!game || game.created_by !== user.id) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase.from('games').delete().eq('id', gameId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
