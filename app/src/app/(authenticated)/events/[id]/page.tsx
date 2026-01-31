import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { getEvent, getEventRegistrations, getEventLeaderboard, getMyEventRegistration, isEventOrganizer } from '@/lib/actions';
import { RegisterEventButton } from '@/components/event/register-event-button';
import { ArrowLeft, Trophy, Users, Calendar, Clock, Play, Settings } from 'lucide-react';

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  scramble: 'Scramble',
  best_ball: 'Best Ball',
  shamble: 'Shamble',
};

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  open: 'success',
  closed: 'warning',
  completed: 'default',
  cancelled: 'secondary',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const [registrations, leaderboard, myRegistration, isOrganizer] = await Promise.all([
    getEventRegistrations(id),
    getEventLeaderboard(id),
    getMyEventRegistration(id),
    isEventOrganizer(id),
  ]);

  const isRegistered = !!myRegistration;
  const isPast = new Date(event.event_date) < new Date();
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/events"
        className="mb-4 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#e8f5f0]">{event.name}</h1>
              <Badge variant={statusVariants[event.status]}>{event.status}</Badge>
            </div>
            {event.description && (
              <p className="mt-2 text-[#a8d4c0]">{event.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#a8d4c0]">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(event.event_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {event.start_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.start_time}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {formatLabels[event.format] || event.format}
              </Badge>
              {event.team_size > 1 && (
                <Badge variant="secondary">Teams of {event.team_size}</Badge>
              )}
              {event.shotgun_start && (
                <Badge variant="secondary">Shotgun Start</Badge>
              )}
              {event.flights_enabled && (
                <Badge variant="secondary">Flights</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {isOrganizer && (
              <Link href={`/events/${id}/manage`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Event
                </Button>
              </Link>
            )}
            {event.status === 'open' && !isRegistered && !isPast && (
              <RegisterEventButton eventId={id} entryFee={event.entry_fee} />
            )}
            {isRegistered && (
              <>
                <Badge variant="success">Registered</Badge>
                {(event.status === 'in_progress' || event.status === 'open') && (
                  <Link href={`/events/${id}/score`}>
                    <Button size="lg" className="mt-2">
                      <Play className="mr-2 h-4 w-4" />
                      Enter Scores
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Info */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Users className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {confirmedCount}
                {event.max_players && `/${event.max_players}`}
              </p>
              <p className="text-sm text-[#a8d4c0]">Registered</p>
            </div>
          </CardContent>
        </Card>
        {event.entry_fee && (
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Trophy className="h-6 w-6 text-[#c9a962]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#e8f5f0]">
                  ${event.entry_fee}
                </p>
                <p className="text-sm text-[#a8d4c0]">Entry Fee</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Trophy className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {event.handicap_percentage}%
              </p>
              <p className="text-sm text-[#a8d4c0]">Handicap</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#c9a962]" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      index === 0 ? 'bg-[#c9a962] text-[#002418]' : 'bg-[#004d35] text-[#a8d4c0]'
                    }`}>
                      {entry.position}
                    </div>
                    <Avatar
                      src={entry.profile?.avatar_url}
                      name={entry.profile?.full_name || 'Player'}
                      size="sm"
                    />
                    <span className="font-medium text-[#e8f5f0]">
                      {entry.profile?.full_name || 'Unknown Player'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#e8f5f0]">
                      {entry.total_gross || 0}
                    </p>
                    <p className="text-xs text-[#a8d4c0]">
                      Thru {entry.thru || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" />
              Registered Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {registrations
                .filter((r) => r.status === 'confirmed' || r.status === 'pending')
                .map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={registration.profile?.avatar_url}
                      name={registration.profile?.full_name || registration.profile?.email}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-[#e8f5f0]">
                        {registration.profile?.full_name || registration.profile?.email}
                      </p>
                      {registration.team_name && (
                        <p className="text-xs text-[#a8d4c0]">
                          Team: {registration.team_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={registration.status === 'confirmed' ? 'success' : 'warning'}>
                    {registration.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {registrations.length === 0 && event.status === 'open' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#004d35]">
              <Users className="h-8 w-8 text-[#c9a962]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
              Be the First to Register
            </h3>
            <p className="mt-2 text-center text-[#a8d4c0]">
              No one has registered for this event yet. Sign up now!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
