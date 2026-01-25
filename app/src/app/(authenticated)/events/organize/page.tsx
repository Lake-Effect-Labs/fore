'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOrganizerEvents } from '@/lib/actions/events';
import type { Event } from '@/types/b2b';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';

type OrganizerEvent = Event & { organization?: { name: string; slug: string } };

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const data = await getOrganizerEvents();
      setEvents(data);
      setIsLoading(false);
    }
    loadEvents();
  }, []);

  const upcomingEvents = events.filter(
    (e) => new Date(e.event_date) >= new Date() && e.status !== 'cancelled'
  );
  const pastEvents = events.filter(
    (e) => new Date(e.event_date) < new Date() || e.status === 'completed'
  );
  const draftEvents = events.filter((e) => e.status === 'draft');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-900/30 text-green-400 border-green-800';
      case 'draft':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      case 'closed':
        return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'in_progress':
        return 'bg-purple-900/30 text-purple-400 border-purple-800';
      case 'completed':
        return 'bg-gray-900/30 text-gray-400 border-gray-800';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-800';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-800';
    }
  };

  const EventCard = ({ event }: { event: OrganizerEvent }) => {
    const eventDate = new Date(event.event_date);
    const isUpcoming = eventDate >= new Date();
    const eventUrl = event.slug && event.organization
      ? `/${event.organization.slug}/${event.slug}`
      : null;

    return (
      <Card className="hover:border-[#006747] transition-colors">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Event Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35] text-[#c9a962] flex-shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-[#e8f5f0] truncate">
                      {event.name}
                    </h3>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#a8d4c0] mt-1">
                    {event.organization?.name}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 text-[#a8d4c0]">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {eventDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {event.start_time && (
                  <div className="flex items-center gap-2 text-[#a8d4c0]">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{event.start_time}</span>
                  </div>
                )}
                {event.max_players && (
                  <div className="flex items-center gap-2 text-[#a8d4c0]">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>{event.max_players} max</span>
                  </div>
                )}
                {event.entry_fee && (
                  <div className="flex items-center gap-2 text-[#a8d4c0]">
                    <DollarSign className="h-4 w-4 flex-shrink-0" />
                    <span>${event.entry_fee}</span>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {event.status === 'draft' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Open registration to allow players to sign up</span>
                </div>
              )}
              {event.status === 'open' && !event.slug && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Set a URL slug to share your event page</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-row sm:flex-col gap-2">
              <Link href={`/events/${event.id}/manage`} className="flex-1 sm:flex-none">
                <Button className="w-full" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </Link>
              {eventUrl && (
                <Link href={eventUrl} target="_blank" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[#004d35] rounded" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#004d35] rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#004d35] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">
          My Events
        </h1>
        <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">
          Manage the events you're organizing
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[#c9a962]">
              {upcomingEvents.length}
            </p>
            <p className="text-xs sm:text-sm text-[#a8d4c0]">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
              {draftEvents.length}
            </p>
            <p className="text-xs sm:text-sm text-[#a8d4c0]">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[#a8d4c0]">
              {pastEvents.length}
            </p>
            <p className="text-xs sm:text-sm text-[#a8d4c0]">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-[#004d35] mb-4" />
            <h3 className="text-lg font-medium text-[#e8f5f0]">
              No events yet
            </h3>
            <p className="text-sm text-[#a8d4c0] mt-2 max-w-sm mx-auto">
              You haven't been assigned as an organizer for any events yet.
              Contact a course to get started organizing an outing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Draft Events */}
          {draftEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#e8f5f0] mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Needs Setup ({draftEvents.length})
              </h2>
              <div className="space-y-4">
                {draftEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.filter((e) => e.status !== 'draft').length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#e8f5f0] mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#c9a962]" />
                Upcoming ({upcomingEvents.filter((e) => e.status !== 'draft').length})
              </h2>
              <div className="space-y-4">
                {upcomingEvents
                  .filter((e) => e.status !== 'draft')
                  .map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#e8f5f0] mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#a8d4c0]" />
                Past Events ({pastEvents.length})
              </h2>
              <div className="space-y-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
