import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrganization,
  getOrganizationEvents,
  getUserRole,
} from '@/lib/actions';
import {
  Calendar,
  Plus,
  Clock,
  Users,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type { Event, EventStatus } from '@/types/b2b';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getStatusBadgeVariant(
  status: EventStatus
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'open':
      return 'success';
    case 'closed':
      return 'warning';
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(timeString: string | null): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function isUpcoming(event: Event): boolean {
  const eventDate = new Date(event.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

function EventCard({ event, slug }: { event: Event; slug: string }) {
  return (
    <Link href={`/admin/${slug}/events/${event.id}`}>
      <Card className="cursor-pointer transition-all hover:border-[#c9a962] active:scale-[0.98]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0] truncate max-w-[200px] sm:max-w-none">
                  {event.name}
                </h3>
                <Badge variant={getStatusBadgeVariant(event.status)} className="flex-shrink-0">
                  {event.status.replace('_', ' ')}
                </Badge>
              </div>

              {event.description && (
                <p className="text-xs sm:text-sm text-[#a8d4c0] mb-3 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-[#a8d4c0]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962] flex-shrink-0" />
                  <span className="hidden sm:inline">{formatEventDate(event.event_date)}</span>
                  <span className="sm:hidden">{formatEventDateShort(event.event_date)}</span>
                </div>

                {event.start_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962] flex-shrink-0" />
                    <span>{formatEventTime(event.start_time)}</span>
                  </div>
                )}

                {event.max_players && (
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962] flex-shrink-0" />
                    <span>Max {event.max_players}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962] flex-shrink-0" />
                  <span className="capitalize truncate">
                    {event.format.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                {event.entry_fee && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-[#004d35] text-[#c9a962]">
                    ${event.entry_fee} entry
                  </span>
                )}
                {event.shotgun_start && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-[#004d35] text-[#a8d4c0]">
                    Shotgun
                  </span>
                )}
                {event.flights_enabled && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-[#004d35] text-[#a8d4c0]">
                    Flights
                  </span>
                )}
                {event.team_size > 1 && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-[#004d35] text-[#a8d4c0]">
                    Teams of {event.team_size}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#a8d4c0] flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function AdminEventsPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);

  // Only allow admin roles to access
  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    notFound();
  }

  const events = await getOrganizationEvents(org.id);

  // Separate upcoming and past events
  const upcomingEvents = events.filter((event) => isUpcoming(event));
  const pastEvents = events.filter((event) => !isUpcoming(event));

  // Sort upcoming events by date (ascending - soonest first)
  upcomingEvents.sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  // Sort past events by date (descending - most recent first)
  pastEvents.sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">Events</h1>
          <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">
            Manage tournaments and outings for {org.name}
          </p>
        </div>
        <Link href={`/admin/${slug}/events/new`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats summary */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {events.length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {upcomingEvents.length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {events.filter((e) => e.status === 'open').length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#a8d4c0]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {pastEvents.length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Past</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Section */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#c9a962]" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#004d35] mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-[#e8f5f0] mb-2">
                No upcoming events
              </h3>
              <p className="text-sm sm:text-base text-[#a8d4c0] mb-4">
                Create your first event to get started.
              </p>
              <Link href={`/admin/${slug}/events/new`} className="inline-block">
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} slug={slug} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Events Section */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#a8d4c0]" />
              Past Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} slug={slug} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
