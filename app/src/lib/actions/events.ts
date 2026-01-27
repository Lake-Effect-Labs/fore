'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  CreateEventInput,
  UpdateEventOrganizerInput,
  Event,
  EventRegistration,
  EventScore,
  EventLeaderboard,
  Flight,
  EventStatus,
  EventVisibility,
  PaymentStatus,
} from '@/types/b2b';
import { getUserRole } from './organizations';

export async function createEvent(input: CreateEventInput) {
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
    return { error: 'Not authorized to create events' };
  }

  // If organizer email is provided, find the user
  let organizerId: string | null = null;
  if (input.organizer_email) {
    const { data: organizerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', input.organizer_email)
      .single();

    if (organizerProfile) {
      organizerId = organizerProfile.id;
    }
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organization_id: input.organization_id,
      facility_id: input.facility_id || null,
      organizer_id: organizerId,
      name: input.name || 'New Event',
      description: input.description || null,
      event_date: input.event_date,
      start_time: input.start_time || null,
      format: input.format || 'scramble',
      status: 'draft',
      visibility: 'link', // Default to link access
      max_players: input.max_players ?? null,
      entry_fee: input.entry_fee ?? null,
      course_fee: input.course_fee ?? null,
      team_size: input.team_size ?? 4, // Default to foursomes
      handicap_percentage: input.handicap_percentage ?? 100,
      flights_enabled: input.flights_enabled ?? false,
      shotgun_start: input.shotgun_start ?? true, // Default to shotgun for outings
      prize_pool: input.prize_pool ?? null,
      settings: input.settings || {},
      organizer_can_configure: input.organizer_can_configure ?? false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin`);
  return { success: true, event: event as Event };
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  return data as Event | null;
}

export async function getOrganizationEvents(orgId: string): Promise<Event[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', orgId)
    .order('event_date', { ascending: false })
    .limit(100);

  return (data || []) as Event[];
}

export async function getUpcomingEvents(orgId?: string): Promise<Event[]> {
  const supabase = await createClient();

  let query = supabase
    .from('events')
    .select('*')
    .in('status', ['open', 'closed'])
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date');

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const { data } = await query;
  return (data || []) as Event[];
}

export async function getMyEvents(): Promise<(Event & { organization?: { name: string } })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('event_registrations')
    .select(`
      event:events(
        *,
        organization:organizations(name)
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed']);

  if (!data) return [];

  return data
    .map((r: any) => r.event)
    .filter((e: any) => e !== null) as (Event & { organization?: { name: string } })[];
}

export async function getPublicEvents(): Promise<(Event & { organization?: { name: string; slug: string } })[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*, organization:organizations(name, slug)')
    .eq('status', 'open')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date');

  return (data || []) as (Event & { organization?: { name: string; slug: string } })[];
}

export async function updateEvent(
  eventId: string,
  data: Partial<Omit<Event, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get the event to find its organization
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();

  if (!event) {
    return { error: 'Event not found' };
  }

  // Check permission
  const role = await getUserRole(event.organization_id);
  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    return { error: 'Not authorized to update this event' };
  }

  const { error } = await supabase
    .from('events')
    .update(data)
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function updateEventStatus(eventId: string, status: EventStatus) {
  return updateEvent(eventId, { status });
}

// ============================================
// Registrations
// ============================================

export async function registerForEvent(eventId: string, teamName?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check event is open for registration
  const event = await getEvent(eventId);
  if (!event) {
    return { error: 'Event not found' };
  }

  if (event.status !== 'open') {
    return { error: 'Registration is not open for this event' };
  }

  // Get user's handicap
  const { data: profile } = await supabase
    .from('profiles')
    .select('handicap')
    .eq('id', user.id)
    .single();

  // Check if already registered
  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return { error: 'Already registered for this event' };
  }

  // Check max players -- use optimistic insert with re-check to mitigate race condition.
  // We insert first, then count. If over capacity, downgrade to waitlist.
  if (event.max_players) {
    const { count } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .in('status', ['pending', 'confirmed']);

    if (count !== null && count >= event.max_players) {
      // Waitlist
      const { data: registration, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          team_name: teamName || null,
          status: 'waitlisted',
          handicap_at_registration: profile?.handicap ?? null,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { success: true, registration: registration as EventRegistration, waitlisted: true };
    }
  }

  // Insert registration
  const registrationStatus = event.entry_fee ? 'pending' : 'confirmed';
  const { data: registration, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: user.id,
      team_name: teamName || null,
      status: registrationStatus,
      handicap_at_registration: profile?.handicap ?? null,
      payment_status: event.entry_fee ? 'pending' : 'not_required',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Re-check capacity after insert to handle race condition.
  // If another registration slipped in between our count and insert,
  // downgrade this one to waitlisted.
  if (event.max_players) {
    const { count: postInsertCount } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact' })
      .eq('event_id', eventId)
      .in('status', ['pending', 'confirmed']);

    if (postInsertCount !== null && postInsertCount > event.max_players) {
      await supabase
        .from('event_registrations')
        .update({ status: 'waitlisted' })
        .eq('id', registration.id);

      return { success: true, registration: { ...registration, status: 'waitlisted' } as EventRegistration, waitlisted: true };
    }
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, registration: registration as EventRegistration };
}

export async function getEventRegistrations(
  eventId: string
): Promise<(EventRegistration & { profile: { id: string; email: string; full_name: string | null; avatar_url: string | null; handicap: number | null } | null })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('event_registrations')
    .select('*, profile:profiles(id, email, full_name, avatar_url, handicap)')
    .eq('event_id', eventId)
    .order('registered_at');

  // For guest registrations, profile will be null - create a synthetic profile object
  return (data || []).map((reg: any) => ({
    ...reg,
    profile: reg.profile || (reg.guest_email ? {
      id: `guest-${reg.id}`,
      email: reg.guest_email,
      full_name: reg.guest_name,
      avatar_url: null,
      handicap: reg.handicap_at_registration,
    } : null),
  })) as (EventRegistration & { profile: { id: string; email: string; full_name: string | null; avatar_url: string | null; handicap: number | null } | null })[];
}

export async function getMyEventRegistration(
  eventId: string
): Promise<EventRegistration | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  return data as EventRegistration | null;
}

export async function cancelRegistration(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// ============================================
// Flights
// ============================================

export async function createFlight(
  eventId: string,
  name: string,
  minHandicap?: number,
  maxHandicap?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is organizer or admin
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();
    if (!event) return { error: 'Event not found' };
    const role = await getUserRole(event.organization_id);
    if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
      return { error: 'Not authorized to create flights' };
    }
  }

  const { data: flight, error } = await supabase
    .from('flights')
    .insert({
      event_id: eventId,
      name,
      min_handicap: minHandicap ?? null,
      max_handicap: maxHandicap ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, flight: flight as Flight };
}

export async function getEventFlights(eventId: string): Promise<Flight[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('flights')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order');

  return (data || []) as Flight[];
}

export async function assignFlight(registrationId: string, flightId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get registration to find event
  const { data: registration } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('id', registrationId)
    .single();

  if (!registration) {
    return { error: 'Registration not found' };
  }

  // Verify user is organizer or admin
  const isOrg = await isEventOrganizer(registration.event_id);
  if (!isOrg) {
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', registration.event_id)
      .single();
    if (!event) return { error: 'Event not found' };
    const role = await getUserRole(event.organization_id);
    if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
      return { error: 'Not authorized to assign flights' };
    }
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ flight_id: flightId })
    .eq('id', registrationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ============================================
// Event Scores
// ============================================

export async function submitEventScore(
  eventId: string,
  registrationId: string,
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

  // Verify registration belongs to user
  const { data: registration } = await supabase
    .from('event_registrations')
    .select('user_id')
    .eq('id', registrationId)
    .single();

  if (!registration || registration.user_id !== user.id) {
    return { error: 'Not authorized' };
  }

  // Upsert score
  const { error } = await supabase
    .from('event_scores')
    .upsert(
      {
        event_id: eventId,
        registration_id: registrationId,
        hole_number: holeNumber,
        strokes,
      },
      {
        onConflict: 'event_id,registration_id,hole_number',
      }
    );

  if (error) {
    return { error: error.message };
  }

  // Update leaderboard
  await updateEventLeaderboard(eventId, registrationId);

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function getEventScores(eventId: string): Promise<EventScore[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('event_scores')
    .select('*')
    .eq('event_id', eventId)
    .order('hole_number');

  return (data || []) as EventScore[];
}

export async function getPlayerEventScores(
  eventId: string,
  registrationId: string
): Promise<EventScore[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('event_scores')
    .select('*')
    .eq('event_id', eventId)
    .eq('registration_id', registrationId)
    .order('hole_number');

  return (data || []) as EventScore[];
}

export async function getMyEventScoresRecord(
  eventId: string,
  registrationId: string
): Promise<Record<number, number>> {
  const scores = await getPlayerEventScores(eventId, registrationId);
  const scoreRecord: Record<number, number> = {};
  for (const score of scores) {
    if (score.strokes !== null) {
      scoreRecord[score.hole_number] = score.strokes;
    }
  }
  return scoreRecord;
}

export async function getEventWithDetails(eventId: string): Promise<(Event & {
  facility?: { id: string; name: string; holes: number };
  organization?: { name: string; slug: string };
}) | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select(`
      *,
      facility:facilities(id, name, holes),
      organization:organizations(name, slug)
    `)
    .eq('id', eventId)
    .single();

  return data as (Event & {
    facility?: { id: string; name: string; holes: number };
    organization?: { name: string; slug: string };
  }) | null;
}

// ============================================
// Leaderboard
// ============================================

export async function getEventLeaderboard(
  eventId: string
): Promise<(EventLeaderboard & { profile: { id: string; full_name: string | null; avatar_url: string | null } })[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('event_leaderboard')
    .select(`
      *,
      registration:event_registrations(
        user_id,
        profile:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('event_id', eventId)
    .order('position');

  if (!data) return [];

  return data.map((entry: any) => ({
    ...entry,
    profile: entry.registration?.profile,
  })) as (EventLeaderboard & { profile: { id: string; full_name: string | null; avatar_url: string | null } })[];
}

async function updateEventLeaderboard(eventId: string, registrationId: string) {
  const supabase = await createClient();

  // Get all scores for this player
  const { data: scores } = await supabase
    .from('event_scores')
    .select('strokes')
    .eq('event_id', eventId)
    .eq('registration_id', registrationId);

  const holesCompleted = scores?.length || 0;
  const totalGross = scores?.reduce((sum, s) => sum + (s.strokes || 0), 0) || 0;

  // Upsert leaderboard entry
  await supabase
    .from('event_leaderboard')
    .upsert(
      {
        event_id: eventId,
        registration_id: registrationId,
        holes_completed: holesCompleted,
        total_gross: totalGross,
        thru: holesCompleted,
      },
      {
        onConflict: 'event_id,registration_id',
      }
    );

  // Update positions - batch update using Promise.all instead of sequential N+1
  const { data: leaderboard } = await supabase
    .from('event_leaderboard')
    .select('id, total_gross')
    .eq('event_id', eventId)
    .order('total_gross');

  if (leaderboard && leaderboard.length > 0) {
    await Promise.all(
      leaderboard.map((entry, i) =>
        supabase
          .from('event_leaderboard')
          .update({ position: i + 1 })
          .eq('id', entry.id)
      )
    );
  }
}

export async function recalculateLeaderboard(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is organizer or org admin
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();
    if (!event) return { error: 'Event not found' };
    const role = await getUserRole(event.organization_id);
    if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
      return { error: 'Not authorized to recalculate leaderboard' };
    }
  }

  const registrations = await getEventRegistrations(eventId);

  // Process all registrations in parallel instead of sequential N+1
  await Promise.all(
    registrations.map((reg) => updateEventLeaderboard(eventId, reg.id))
  );

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// ============================================
// Organizer Functions
// ============================================

export async function isEventOrganizer(eventId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single();

  return event?.organizer_id === user.id;
}

export async function getOrganizerEvents(): Promise<(Event & { organization?: { name: string; slug: string } })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('events')
    .select('*, organization:organizations(name, slug)')
    .eq('organizer_id', user.id)
    .order('event_date', { ascending: true });

  return (data || []) as (Event & { organization?: { name: string; slug: string } })[];
}

export async function getEventBySlug(
  orgSlug: string,
  eventSlug: string
): Promise<(Event & { organization?: { name: string; slug: string }; facility?: { name: string; holes: number } }) | null> {
  const supabase = await createClient();

  // First get the org by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single();

  if (!org) return null;

  const { data: event } = await supabase
    .from('events')
    .select('*, facility:facilities(name, holes)')
    .eq('organization_id', org.id)
    .eq('slug', eventSlug)
    .single();

  if (!event) return null;

  return {
    ...event,
    organization: { name: org.name, slug: org.slug },
  } as Event & { organization?: { name: string; slug: string }; facility?: { name: string; holes: number } };
}

export async function updateEventAsOrganizer(eventId: string, data: UpdateEventOrganizerInput) {
  const supabase = await createClient();

  // Verify user is the organizer
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    return { error: 'Not authorized - you are not the organizer of this event' };
  }

  // Generate slug from name if not provided
  const updateData: Record<string, unknown> = { ...data };
  if (data.name && !data.slug) {
    updateData.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function assignOrganizer(eventId: string, organizerEmail: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get event's organization
  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();

  if (!event) {
    return { error: 'Event not found' };
  }

  // Check if user is course admin
  const role = await getUserRole(event.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to assign organizers' };
  }

  // Find organizer by email
  const { data: organizerProfile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', organizerEmail)
    .single();

  if (!organizerProfile) {
    return { error: 'No user found with that email' };
  }

  // Assign organizer
  const { error } = await supabase
    .from('events')
    .update({ organizer_id: organizerProfile.id })
    .eq('id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, organizer: organizerProfile };
}

export async function openEventRegistration(eventId: string) {
  // Check if user is organizer OR has admin role on the org
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    // Fall back to updateEvent which checks org-level admin role
    const supabase = await createClient();
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();
    if (!event) return { error: 'Event not found' };
    const role = await getUserRole(event.organization_id);
    if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
      return { error: 'Not authorized' };
    }
  }

  return updateEvent(eventId, { status: 'open' as EventStatus });
}

export async function closeEventRegistration(eventId: string) {
  // Check if user is organizer OR has admin role on the org
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    // Fall back to updateEvent which checks org-level admin role
    const supabase = await createClient();
    const { data: event } = await supabase
      .from('events')
      .select('organization_id')
      .eq('id', eventId)
      .single();
    if (!event) return { error: 'Event not found' };
    const role = await getUserRole(event.organization_id);
    if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
      return { error: 'Not authorized' };
    }
  }

  return updateEvent(eventId, { status: 'closed' as EventStatus });
}

// ============================================
// Registration Management (Organizer)
// ============================================

export async function updateRegistrationPayment(
  registrationId: string,
  paymentStatus: PaymentStatus
) {
  const supabase = await createClient();

  // Get registration to find event
  const { data: registration } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('id', registrationId)
    .single();

  if (!registration) {
    return { error: 'Registration not found' };
  }

  // Verify user is organizer
  const isOrganizer = await isEventOrganizer(registration.event_id);
  if (!isOrganizer) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ payment_status: paymentStatus })
    .eq('id', registrationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${registration.event_id}`);
  return { success: true };
}

export async function updateRegistrationGroup(
  registrationId: string,
  groupNumber: number | null
) {
  const supabase = await createClient();

  const { data: registration } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('id', registrationId)
    .single();

  if (!registration) {
    return { error: 'Registration not found' };
  }

  const isOrganizer = await isEventOrganizer(registration.event_id);
  if (!isOrganizer) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ group_number: groupNumber })
    .eq('id', registrationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${registration.event_id}`);
  return { success: true };
}

export async function assignGroupStartingHole(
  eventId: string,
  groupNumber: number,
  startingHole: number
) {
  const supabase = await createClient();

  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    return { error: 'Not authorized' };
  }

  // Update all registrations in this group with the starting hole
  const { error } = await supabase
    .from('event_registrations')
    .update({ starting_hole: startingHole })
    .eq('event_id', eventId)
    .eq('group_number', groupNumber);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function getEventGroups(eventId: string): Promise<{
  groupNumber: number;
  startingHole: number | null;
  players: { id: string; name: string; handicap: number | null; paymentStatus: string }[];
}[]> {
  const supabase = await createClient();

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('id, group_number, starting_hole, payment_status, profile:profiles(id, full_name, handicap)')
    .eq('event_id', eventId)
    .in('status', ['pending', 'confirmed'])
    .order('group_number');

  if (!registrations) return [];

  // Group by group_number
  const groupsMap = new Map<number, {
    groupNumber: number;
    startingHole: number | null;
    players: { id: string; name: string; handicap: number | null; paymentStatus: string }[];
  }>();

  for (const reg of registrations as any[]) {
    const groupNum = reg.group_number || 0; // Ungrouped = 0

    if (!groupsMap.has(groupNum)) {
      groupsMap.set(groupNum, {
        groupNumber: groupNum,
        startingHole: reg.starting_hole,
        players: [],
      });
    }

    groupsMap.get(groupNum)!.players.push({
      id: reg.id,
      name: reg.profile?.full_name || 'Unknown',
      handicap: reg.profile?.handicap,
      paymentStatus: reg.payment_status,
    });
  }

  return Array.from(groupsMap.values()).sort((a, b) => a.groupNumber - b.groupNumber);
}

// ============================================
// Player Registration with Foursome/Group
// ============================================

interface Teammate {
  name: string;
  email: string;
  handicap?: number;
}

export async function registerWithFoursome(
  eventId: string,
  teammates?: Teammate[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // First register the current user
  const result = await registerForEvent(eventId);
  if (result.error) {
    return result;
  }

  // If teammates provided, create registrations for them
  if (teammates && teammates.length > 0) {
    // Find the next available group number
    const { data: existingRegs } = await supabase
      .from('event_registrations')
      .select('group_number')
      .eq('event_id', eventId)
      .not('group_number', 'is', null)
      .order('group_number', { ascending: false })
      .limit(1);

    const nextGroupNumber = (existingRegs?.[0]?.group_number || 0) + 1;

    // Update current user's registration with group number
    await supabase
      .from('event_registrations')
      .update({ group_number: nextGroupNumber })
      .eq('id', result.registration?.id);

    // Batch-fetch all teammate profiles in one query instead of N individual lookups
    const emails = teammates.map((t) => t.email.toLowerCase().trim());
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, email, handicap')
      .in('email', emails);

    const profileByEmail = new Map(
      (existingProfiles || []).map((p) => [p.email.toLowerCase(), p])
    );

    // Batch-fetch existing registrations for this event
    const profileIds = (existingProfiles || []).map((p) => p.id);
    const orFilters = [
      ...profileIds.map((id) => `user_id.eq.${id}`),
      ...emails.map((e) => `guest_email.eq.${e}`),
    ];
    const { data: existingEventRegs } = orFilters.length > 0
      ? await supabase
          .from('event_registrations')
          .select('id, user_id, guest_email')
          .eq('event_id', eventId)
          .or(orFilters.join(','))
      : { data: [] };

    // Index existing registrations
    const regByUserId = new Map<string, string>();
    const regByEmail = new Map<string, string>();
    for (const reg of existingEventRegs || []) {
      if (reg.user_id) regByUserId.set(reg.user_id, reg.id);
      if (reg.guest_email) regByEmail.set(reg.guest_email.toLowerCase(), reg.id);
    }

    // Process each teammate with pre-fetched data (no more N+1)
    const updatePromises: PromiseLike<unknown>[] = [];
    const newRegistrations: Record<string, unknown>[] = [];

    for (const teammate of teammates) {
      const email = teammate.email.toLowerCase().trim();
      const existingProfile = profileByEmail.get(email);
      const existingRegId = existingProfile
        ? regByUserId.get(existingProfile.id) || regByEmail.get(email)
        : regByEmail.get(email);

      if (existingRegId) {
        // Already registered, just update their group
        updatePromises.push(
          supabase
            .from('event_registrations')
            .update({ group_number: nextGroupNumber })
            .eq('id', existingRegId)
        );
      } else if (existingProfile) {
        newRegistrations.push({
          event_id: eventId,
          user_id: existingProfile.id,
          status: 'pending',
          group_number: nextGroupNumber,
          handicap_at_registration: teammate.handicap ?? existingProfile.handicap,
          payment_status: 'pending',
          invited_by: user.id,
        });
      } else {
        newRegistrations.push({
          event_id: eventId,
          user_id: null,
          guest_name: teammate.name,
          guest_email: email,
          status: 'pending',
          group_number: nextGroupNumber,
          handicap_at_registration: teammate.handicap ?? null,
          payment_status: 'pending',
          invited_by: user.id,
        });
      }
    }

    // Execute updates and inserts in parallel batches
    const batchOps: PromiseLike<unknown>[] = [...updatePromises];
    if (newRegistrations.length > 0) {
      batchOps.push(
        supabase.from('event_registrations').insert(newRegistrations)
      );
    }
    await Promise.all(batchOps);
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true, groupNumber: teammates?.length ? undefined : null };
}

// Claim a guest registration when user creates an account
export async function claimGuestRegistrations(userEmail: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify the authenticated user matches the claimed userId and email
  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (user.id !== userId || user.email?.toLowerCase() !== userEmail.toLowerCase()) {
    return { error: 'Not authorized to claim these registrations' };
  }

  // Find any guest registrations with this email
  const { data: guestRegs } = await supabase
    .from('event_registrations')
    .select('id, event_id')
    .eq('guest_email', userEmail.toLowerCase())
    .is('user_id', null);

  if (!guestRegs || guestRegs.length === 0) {
    return { success: true, claimed: 0 };
  }

  // Batch update all guest registrations in a single query instead of N+1
  const regIds = guestRegs.map((r) => r.id);
  await supabase
    .from('event_registrations')
    .update({
      user_id: userId,
      guest_name: null,
      guest_email: null,
    })
    .in('id', regIds);

  return { success: true, claimed: guestRegs.length };
}

// Legacy function - redirects to new one
export async function registerWithGroup(
  eventId: string,
  inviteEmails?: string[]
) {
  const teammates = inviteEmails?.map(email => ({
    name: email.split('@')[0], // Use email prefix as name
    email,
  }));
  return registerWithFoursome(eventId, teammates);
}

// ============================================
// Check-in Functions
// ============================================

export async function checkInRegistration(registrationId: string, checkedIn: boolean) {
  const supabase = await createClient();

  // Get registration to find event
  const { data: registration } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('id', registrationId)
    .single();

  if (!registration) {
    return { error: 'Registration not found' };
  }

  // Verify user is organizer
  const isOrganizer = await isEventOrganizer(registration.event_id);
  if (!isOrganizer) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq('id', registrationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${registration.event_id}`);
  return { success: true };
}

export async function bulkCheckIn(eventId: string, registrationIds: string[], checkedIn: boolean) {
  const supabase = await createClient();

  // Verify user is organizer
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .in('id', registrationIds)
    .eq('event_id', eventId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
