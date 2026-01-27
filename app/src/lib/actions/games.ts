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
    // Skins
    skin_value: input.config.skin_value ?? null,
    carry_over: input.config.carry_over ?? true,
    // Nassau
    front_nine_bet: input.config.front_nine_bet ?? null,
    back_nine_bet: input.config.back_nine_bet ?? null,
    overall_bet: input.config.overall_bet ?? null,
    auto_press: input.config.auto_press ?? false,
    press_after_down: input.config.press_after_down ?? 2,
    // Match Play
    match_bet: input.config.match_bet ?? null,
    // Wolf
    wolf_value: input.config.wolf_value ?? null,
    lone_wolf_multiplier: input.config.lone_wolf_multiplier ?? 2,
    blind_wolf_multiplier: input.config.blind_wolf_multiplier ?? 3,
    // Best Ball
    best_ball_bet: input.config.best_ball_bet ?? null,
    // Bingo Bango Bongo
    bingo_value: input.config.bingo_value ?? null,
    bango_value: input.config.bango_value ?? null,
    bongo_value: input.config.bongo_value ?? null,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Verify user is a participant and fetch game in parallel
  const [{ data: game, error }, { data: participant }] = await Promise.all([
    supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single(),
    supabase
      .from('game_players')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .single(),
  ]);

  if (error || !game) return null;
  if (!participant) return null;

  // Batch-fetch config, players, scores, and settlements in parallel
  const [{ data: config }, { data: players }, { data: scores }, { data: settlements }] = await Promise.all([
    supabase
      .from('game_configs')
      .select('*')
      .eq('game_id', gameId)
      .single(),
    supabase
      .from('game_players')
      .select('*, profile:profiles(id, email, full_name, display_name, avatar_url, handicap)')
      .eq('game_id', gameId),
    supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .order('hole_number', { ascending: true }),
    supabase
      .from('settlements')
      .select('*')
      .eq('game_id', gameId),
  ]);

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

  // Get games where user is a player (limit to most recent 100 games)
  const { data: gameIds } = await supabase
    .from('game_players')
    .select('game_id')
    .eq('user_id', user.id)
    .limit(100);

  if (!gameIds || gameIds.length === 0) return [];

  const ids = gameIds.map((g) => g.game_id);

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!games || games.length === 0) return [];

  // Batch-fetch configs and players for all games to avoid N+1 queries
  const [{ data: allConfigs }, { data: allPlayers }] = await Promise.all([
    supabase.from('game_configs').select('*').in('game_id', ids),
    supabase.from('game_players').select('*, profile:profiles(*)').in('game_id', ids),
  ]);

  const configsByGameId = new Map(
    (allConfigs || []).map((c) => [c.game_id, c])
  );
  const playersByGameId = new Map<string, typeof allPlayers>();
  for (const player of allPlayers || []) {
    const existing = playersByGameId.get(player.game_id) || [];
    existing.push(player);
    playersByGameId.set(player.game_id, existing);
  }

  return games.map((game) => ({
    ...game,
    config: configsByGameId.get(game.id) || null,
    players: (playersByGameId.get(game.id) || []).map((p: any) => ({
      ...p,
      profile: p.profile,
    })),
  })) as GameWithPlayers[];
}

export async function startGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify game exists and is in pending status before transitioning
  const { data: game } = await supabase
    .from('games')
    .select('status, created_by')
    .eq('id', gameId)
    .single();

  if (!game) {
    return { error: 'Game not found' };
  }

  if (game.status !== 'pending') {
    return { error: `Cannot start a game that is ${game.status}` };
  }

  if (game.created_by !== user.id) {
    return { error: 'Only the game creator can start the game' };
  }

  const { error } = await supabase
    .from('games')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .eq('status', 'pending'); // Guard against race condition

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/games/${gameId}`);
  return { success: true };
}

export async function completeGame(gameId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify game exists and is in active status before transitioning
  const { data: game } = await supabase
    .from('games')
    .select('status, created_by')
    .eq('id', gameId)
    .single();

  if (!game) {
    return { error: 'Game not found' };
  }

  if (game.status !== 'active') {
    return { error: `Cannot complete a game that is ${game.status}` };
  }

  if (game.created_by !== user.id) {
    return { error: 'Only the game creator can complete the game' };
  }

  const { error } = await supabase
    .from('games')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .eq('status', 'active'); // Guard against race condition

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
