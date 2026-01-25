import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  getOrganization,
  getEvent,
  getEventRegistrations,
  getEventLeaderboard,
  getMyEventRegistration,
  getUserRole,
  getFacility,
} from '@/lib/actions';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Settings,
  DollarSign,
} from 'lucide-react';
import { RegisterEventButton } from '@/components/event/register-event-button';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  best_ball: 'Best Ball',
  scramble: 'Scramble',
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  open: 'success',
  closed: 'warning',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'secondary',
};

export default async function EventDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [event, registrations, leaderboard, myRegistration, role] = await Promise.all([
    getEvent(id),
    getEventRegistrations(id),
    getEventLeaderboard(id),
    getMyEventRegistration(id),
    getUserRole(org.id),
  ]);

  if (!event) {
    notFound();
  }

  const facility = event.facility_id ? await getFacility(event.facility_id) : null;
  const canManage = role && ['owner', 'admin', 'pro_shop'].includes(role);

  const confirmedRegistrations = registrations.filter((r) =>
    ['pending', 'confirmed'].includes(r.status)
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}/events`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">
              <Calendar className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
                <Badge variant={statusColors[event.status]}>{event.status}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
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
              {facility && (
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {facility.name}
                </p>
              )}
              {event.description && (
                <p className="mt-3 text-slate-600">{event.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {event.status === 'open' && !myRegistration && (
              <RegisterEventButton eventId={event.id} entryFee={event.entry_fee} />
            )}
            {myRegistration && (
              <Badge variant="success" className="h-9 px-4">
                Registered
              </Badge>
            )}
            {canManage && (
              <Link href={`/org/${slug}/events/${id}/manage`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  {event.status === 'in_progress'
                    ? 'Scores will appear here as players submit them.'
                    : 'The leaderboard will be available once the event starts.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-amber-100 text-amber-700'
                              : index === 1
                              ? 'bg-slate-200 text-slate-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.position}
                        </span>
                        <Avatar
                          src={entry.profile?.avatar_url}
                          name={entry.profile?.full_name}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            {entry.profile?.full_name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-slate-500">
                            Thru {entry.thru || entry.holes_completed}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {entry.total_gross && entry.total_gross > 0
                            ? `${entry.total_gross > 72 ? '+' : ''}${entry.total_gross - 72}`
                            : 'E'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {entry.total_gross || '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registered Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                Registered Players ({confirmedRegistrations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {confirmedRegistrations.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  No players registered yet. Be the first to sign up!
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {confirmedRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <Avatar
                        src={reg.profile?.avatar_url}
                        name={reg.profile?.full_name || reg.profile?.email}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {reg.profile?.full_name || reg.profile?.email}
                        </p>
                        {reg.handicap_at_registration !== null && (
                          <p className="text-sm text-slate-500">
                            Hdcp: {reg.handicap_at_registration}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={reg.status === 'confirmed' ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {reg.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Format</p>
                <p className="font-medium text-slate-900">
                  {formatLabels[event.format]}
                </p>
              </div>
              {event.team_size > 1 && (
                <div>
                  <p className="text-sm text-slate-500">Team Size</p>
                  <p className="font-medium text-slate-900">
                    {event.team_size}-Person Teams
                  </p>
                </div>
              )}
              {event.entry_fee && (
                <div>
                  <p className="text-sm text-slate-500">Entry Fee</p>
                  <p className="flex items-center gap-1 font-medium text-slate-900">
                    <DollarSign className="h-4 w-4" />
                    {event.entry_fee.toFixed(2)}
                  </p>
                </div>
              )}
              {event.max_players && (
                <div>
                  <p className="text-sm text-slate-500">Spots</p>
                  <p className="font-medium text-slate-900">
                    {confirmedRegistrations.length} / {event.max_players}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Handicap</p>
                <p className="font-medium text-slate-900">
                  {event.handicap_percentage}%
                </p>
              </div>
              {event.shotgun_start && (
                <Badge variant="secondary">Shotgun Start</Badge>
              )}
              {event.flights_enabled && (
                <Badge variant="secondary">Flights Enabled</Badge>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/org/${slug}/events/${id}/manage`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
