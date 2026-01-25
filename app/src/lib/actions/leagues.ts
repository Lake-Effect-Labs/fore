'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  CreateLeagueInput,
  League,
  Season,
  LeagueParticipant,
  Round,
  RoundScore,
  LeagueStanding,
} from '@/types/b2b';
import { getUserRole } from './organizations';

export async function createLeague(input: CreateLeagueInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check permission
  const role = await getUserRole(input.organization_id);
  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    return { error: 'Not authorized to create leagues' };
  }

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      description: input.description || null,
      league_type: input.league_type,
      format: input.format,
      day_of_week: input.day_of_week ?? null,
      start_time: input.start_time || null,
      max_players: input.max_players || null,
      entry_fee: input.entry_fee || null,
      handicap_percentage: input.handicap_percentage ?? 100,
      settings: input.settings || {},
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/org/${input.organization_id}/leagues`);
  return { success: true, league: league as League };
}

export async function getLeague(leagueId: string): Promise<League | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single();

  return data as League | null;
}

export async function getOrganizationLeagues(orgId: string): Promise<League[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('leagues')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false })
    .order('name');

  return (data || []) as League[];
}

export async function getMyLeagues(): Promise<(League & {
  organization?: { name: string };
  activeSeason?: { id: string; name: string };
})[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get leagues where user is a participant in any active season
  const { data: participations } = await supabase
    .from('league_participants')
    .select(`
      season:seasons(
        id,
        name,
        is_active,
        league:leagues(
          *,
          organization:organizations(name)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!participations) return [];

  // Extract unique leagues with their active season
  const leaguesMap = new Map<string, League & {
    organization?: { name: string };
    activeSeason?: { id: string; name: string };
  }>();
  for (const p of participations) {
    const season = (p as any).season;
    const league = season?.league;
    if (league && !leaguesMap.has(league.id)) {
      leaguesMap.set(league.id, {
        ...league,
        activeSeason: season.is_active
          ? { id: season.id, name: season.name }
          : undefined,
      });
    }
  }

  return Array.from(leaguesMap.values());
}

export async function getPublicLeagues(): Promise<(League & {
  organization?: { name: string; slug: string };
  activeSeason?: { id: string; name: string };
})[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('leagues')
    .select(`
      *,
      organization:organizations(name, slug),
      seasons(id, name, is_active)
    `)
    .eq('is_active', true)
    .order('name');

  if (!data) return [];

  // Extract active season for each league
  return data.map((league: any) => {
    const activeSeason = league.seasons?.find((s: any) => s.is_active);
    return {
      ...league,
      activeSeason: activeSeason ? { id: activeSeason.id, name: activeSeason.name } : undefined,
      seasons: undefined, // Remove the raw seasons array
    };
  }) as (League & {
    organization?: { name: string; slug: string };
    activeSeason?: { id: string; name: string };
  })[];
}

export async function updateLeague(
  leagueId: string,
  data: Partial<Omit<League, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get the league to find its organization
  const { data: league } = await supabase
    .from('leagues')
    .select('organization_id')
    .eq('id', leagueId)
    .single();

  if (!league) {
    return { error: 'League not found' };
  }

  // Check permission
  const role = await getUserRole(league.organization_id);
  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    return { error: 'Not authorized to update this league' };
  }

  const { error } = await supabase
    .from('leagues')
    .update(data)
    .eq('id', leagueId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/leagues/${leagueId}`);
  return { success: true };
}

// ============================================
// Seasons
// ============================================

export async function createSeason(
  leagueId: string,
  name: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();

  const { data: season, error } = await supabase
    .from('seasons')
    .insert({
      league_id: leagueId,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/leagues/${leagueId}`);
  return { success: true, season: season as Season };
}

export async function getSeasons(leagueId: string): Promise<Season[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('league_id', leagueId)
    .order('start_date', { ascending: false });

  return (data || []) as Season[];
}

export async function getSeason(seasonId: string): Promise<Season | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single();

  return data as Season | null;
}

// ============================================
// Participants
// ============================================

export async function joinLeague(seasonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get user's handicap
  const { data: profile } = await supabase
    .from('profiles')
    .select('handicap')
    .eq('id', user.id)
    .single();

  const { data: participant, error } = await supabase
    .from('league_participants')
    .insert({
      season_id: seasonId,
      user_id: user.id,
      handicap_at_start: profile?.handicap || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Already joined this league' };
    }
    return { error: error.message };
  }

  revalidatePath(`/seasons/${seasonId}`);
  return { success: true, participant: participant as LeagueParticipant };
}

export async function getSeasonParticipants(
  seasonId: string
): Promise<(LeagueParticipant & { profile: { id: string; email: string; full_name: string | null; avatar_url: string | null; handicap: number | null } })[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('league_participants')
    .select('*, profile:profiles(id, email, full_name, avatar_url, handicap)')
    .eq('season_id', seasonId)
    .eq('is_active', true);

  return (data || []) as (LeagueParticipant & { profile: { id: string; email: string; full_name: string | null; avatar_url: string | null; handicap: number | null } })[];
}

// ============================================
// Rounds
// ============================================

export async function createRound(
  seasonId: string,
  roundNumber: number,
  scheduledDate: string,
  facilityId?: string,
  teeTime?: string
) {
  const supabase = await createClient();

  const { data: round, error } = await supabase
    .from('rounds')
    .insert({
      season_id: seasonId,
      facility_id: facilityId || null,
      round_number: roundNumber,
      scheduled_date: scheduledDate,
      tee_time: teeTime || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/seasons/${seasonId}`);
  return { success: true, round: round as Round };
}

export async function getSeasonRounds(seasonId: string): Promise<Round[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('rounds')
    .select('*')
    .eq('season_id', seasonId)
    .order('round_number');

  return (data || []) as Round[];
}

export async function getRound(roundId: string): Promise<Round | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  return data as Round | null;
}

export async function getRoundWithDetails(roundId: string): Promise<(Round & {
  season: { id: string; league_id: string; name: string };
  facility?: { id: string; name: string; holes: number };
}) | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('rounds')
    .select(`
      *,
      season:seasons(id, league_id, name),
      facility:facilities(id, name, holes)
    `)
    .eq('id', roundId)
    .single();

  return data as (Round & {
    season: { id: string; league_id: string; name: string };
    facility?: { id: string; name: string; holes: number };
  }) | null;
}

export async function getMyParticipant(seasonId: string): Promise<{ id: string; user_id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('league_participants')
    .select('id, user_id')
    .eq('season_id', seasonId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  return data as { id: string; user_id: string } | null;
}

export async function getMyRoundScores(roundId: string, participantId: string): Promise<Record<number, number>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('round_scores')
    .select('hole_number, strokes')
    .eq('round_id', roundId)
    .eq('participant_id', participantId);

  const scores: Record<number, number> = {};
  if (data) {
    for (const score of data) {
      scores[score.hole_number] = score.strokes;
    }
  }
  return scores;
}

// ============================================
// Round Scores
// ============================================

export async function submitRoundScore(
  roundId: string,
  participantId: string,
  holeNumber: number,
  strokes: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify participant belongs to user
  const { data: participant } = await supabase
    .from('league_participants')
    .select('user_id')
    .eq('id', participantId)
    .single();

  if (!participant || participant.user_id !== user.id) {
    return { error: 'Not authorized' };
  }

  // Upsert score
  const { error } = await supabase
    .from('round_scores')
    .upsert(
      {
        round_id: roundId,
        participant_id: participantId,
        hole_number: holeNumber,
        strokes,
      },
      {
        onConflict: 'round_id,participant_id,hole_number',
      }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/rounds/${roundId}`);
  return { success: true };
}

export async function getRoundScores(roundId: string): Promise<RoundScore[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('round_scores')
    .select('*')
    .eq('round_id', roundId)
    .order('hole_number');

  return (data || []) as RoundScore[];
}

// ============================================
// Standings
// ============================================

export async function getSeasonStandings(
  seasonId: string
): Promise<(LeagueStanding & { profile: { id: string; full_name: string | null; avatar_url: string | null } })[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('league_standings')
    .select(`
      *,
      participant:league_participants(
        user_id,
        profile:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('season_id', seasonId)
    .order('rank');

  if (!data) return [];

  return data.map((standing: any) => ({
    ...standing,
    profile: standing.participant?.profile,
  })) as (LeagueStanding & { profile: { id: string; full_name: string | null; avatar_url: string | null } })[];
}

export async function updateStandings(seasonId: string) {
  const supabase = await createClient();

  // Get all participants
  const participants = await getSeasonParticipants(seasonId);
  const rounds = await getSeasonRounds(seasonId);

  for (const participant of participants) {
    let totalGross = 0;
    let roundsPlayed = 0;

    for (const round of rounds) {
      const { data: scores } = await supabase
        .from('round_scores')
        .select('strokes')
        .eq('round_id', round.id)
        .eq('participant_id', participant.id);

      if (scores && scores.length > 0) {
        const roundTotal = scores.reduce((sum, s) => sum + (s.strokes || 0), 0);
        if (roundTotal > 0) {
          totalGross += roundTotal;
          roundsPlayed++;
        }
      }
    }

    // Upsert standing
    await supabase
      .from('league_standings')
      .upsert(
        {
          season_id: seasonId,
          participant_id: participant.id,
          rounds_played: roundsPlayed,
          total_gross: totalGross,
          average_gross: roundsPlayed > 0 ? totalGross / roundsPlayed : null,
        },
        {
          onConflict: 'season_id,participant_id',
        }
      );
  }

  // Update ranks
  const { data: standings } = await supabase
    .from('league_standings')
    .select('id, total_gross')
    .eq('season_id', seasonId)
    .order('total_gross');

  if (standings) {
    for (let i = 0; i < standings.length; i++) {
      await supabase
        .from('league_standings')
        .update({ rank: i + 1 })
        .eq('id', standings[i].id);
    }
  }

  revalidatePath(`/seasons/${seasonId}`);
  return { success: true };
}
