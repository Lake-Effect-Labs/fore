import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getEventWithDetails,
  getMyEventRegistration,
  getMyEventScoresRecord,
  getEventLeaderboard,
} from '@/lib/actions/events';
import { getFacilityHoles } from '@/lib/actions/facilities';
import { ArrowLeft, Calendar, MapPin, Trophy } from 'lucide-react';
import { EventScoring } from '@/components/event/event-scoring';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventScoringPage({ params }: PageProps) {
  const { id: eventId } = await params;

  const event = await getEventWithDetails(eventId);

  if (!event) {
    notFound();
  }

  // Only allow scoring for in-progress or open events
  if (event.status !== 'in_progress' && event.status !== 'open') {
    redirect(`/events/${eventId}`);
  }

  // Check if user is registered
  const registration = await getMyEventRegistration(eventId);

  if (!registration || registration.status === 'cancelled') {
    redirect(`/events/${eventId}`);
  }

  // Get hole data (if facility is set)
  let holes: {
    hole_number: number;
    par: number;
    yardage?: number | null;
    handicap_index?: number | null;
    pin_placement?: 'front' | 'middle' | 'back' | null;
    notes?: string | null;
  }[] = [];

  if (event.facility_id) {
    const facilityHoles = await getFacilityHoles(event.facility_id);
    holes = facilityHoles.map(h => ({
      hole_number: h.hole_number,
      par: h.par,
      yardage: h.yardage,
      handicap_index: h.handicap_index,
      pin_placement: h.pin_placement,
      notes: h.notes,
    }));
  } else {
    // Default holes based on event settings or 18
    const numHoles = event.facility?.holes || 18;
    holes = Array.from({ length: numHoles }, (_, i) => ({
      hole_number: i + 1,
      par: 4,
    }));
  }

  // Get existing scores
  const scores = await getMyEventScoresRecord(eventId, registration.id);

  // Get leaderboard
  const leaderboard = await getEventLeaderboard(eventId);

  const eventDate = new Date(event.event_date);
  const isToday = eventDate.toDateString() === new Date().toDateString();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        href={`/events/${eventId}`}
        className="mb-4 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Event
      </Link>

      {/* Event Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e8f5f0]">
              {event.name}
            </h1>
            {event.organization && (
              <p className="text-[#a8d4c0]">{event.organization.name}</p>
            )}
          </div>
          {isToday && (
            <Badge variant="success">Today</Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#a8d4c0]">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {event.start_time && ` at ${event.start_time}`}
          </div>
          {event.facility && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.facility.name}
            </div>
          )}
        </div>
      </div>

      {/* Scoring Component */}
      <EventScoring
        eventId={eventId}
        registrationId={registration.id}
        holes={holes}
        initialScores={scores}
      />

      {/* Live Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#c9a962]" />
              Live Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-center font-bold ${
                      index === 0 ? 'text-[#c9a962]' : 'text-[#a8d4c0]'
                    }`}>
                      {entry.position}
                    </span>
                    <span className="text-[#e8f5f0]">
                      {entry.profile?.full_name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#a8d4c0] text-xs">
                      thru {entry.thru}
                    </span>
                    <span className="font-medium text-[#e8f5f0]">
                      {entry.total_gross || '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
