'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { registerForEvent } from '@/lib/actions';
import {
  Search,
  Calendar,
  ChevronRight,
  Users,
  Loader2,
  Check,
  UserPlus,
  Trophy,
} from 'lucide-react';
import type { Event } from '@/types/b2b';

type EventWithDetails = Event & {
  organization?: { name: string; slug?: string };
};

interface EventsClientProps {
  publicEvents: EventWithDetails[];
  myEvents: EventWithDetails[];
}

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  scramble: 'Scramble',
  best_ball: 'Best Ball',
  shamble: 'Shamble',
};

export function EventsClient({ publicEvents, myEvents }: EventsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Get IDs of events user is already registered for
  const myEventIds = useMemo(
    () => new Set(myEvents.map((e) => e.id)),
    [myEvents]
  );

  // Filter upcoming events user is registered for
  const upcomingMyEvents = useMemo(
    () => myEvents.filter((e) => new Date(e.event_date) >= new Date()),
    [myEvents]
  );

  // Filter available events (ones user hasn't joined)
  const availableEvents = useMemo(
    () => publicEvents.filter((e) => !myEventIds.has(e.id)),
    [publicEvents, myEventIds]
  );

  // Filter by search
  const filteredMyEvents = useMemo(() => {
    if (!search.trim()) return upcomingMyEvents;
    const query = search.toLowerCase();
    return upcomingMyEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.organization?.name?.toLowerCase().includes(query)
    );
  }, [upcomingMyEvents, search]);

  const filteredAvailableEvents = useMemo(() => {
    if (!search.trim()) return availableEvents;
    const query = search.toLowerCase();
    return availableEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.organization?.name?.toLowerCase().includes(query)
    );
  }, [availableEvents, search]);

  const handleRegister = (eventId: string) => {
    setError('');
    setRegisteringEventId(eventId);
    startTransition(async () => {
      const result = await registerForEvent(eventId);
      if (result.error) {
        setError(result.error);
      } else {
        setRegisteredEventIds((prev) => new Set([...prev, eventId]));
        router.refresh();
      }
      setRegisteringEventId(null);
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e8f5f0]">Events</h1>
        <p className="text-[#a8d4c0]">Find and register for golf events</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a8d4c0]" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* My Upcoming Events */}
      {filteredMyEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Calendar className="h-5 w-5 text-[#c9a962]" />
            My Upcoming Events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMyEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="h-full transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Badge variant="success">Registered</Badge>
                        <h3 className="mt-2 font-semibold text-[#e8f5f0] truncate">
                          {event.name}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {event.organization?.name}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0] flex-shrink-0" />
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-[#a8d4c0]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Available Events */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
          <Users className="h-5 w-5 text-[#c9a962]" />
          Open Events
        </h2>
        {filteredAvailableEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAvailableEvents.map((event) => {
              const isRegistering = registeringEventId === event.id;
              const hasRegistered = registeredEventIds.has(event.id);

              return (
                <Card key={event.id} className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#e8f5f0] truncate">
                          {event.name}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {event.organization?.name}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-sm text-[#a8d4c0] line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-[#a8d4c0]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          {event.team_size > 1 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Teams of {event.team_size}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatLabels[event.format] || event.format}
                          </Badge>
                          {event.shotgun_start && (
                            <Badge variant="secondary" className="text-xs">
                              Shotgun
                            </Badge>
                          )}
                          {event.entry_fee && (
                            <Badge variant="outline" className="text-xs">
                              ${event.entry_fee}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      {hasRegistered ? (
                        <Button variant="outline" size="sm" disabled className="w-full">
                          <Check className="mr-2 h-4 w-4 text-emerald-500" />
                          Registered
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRegister(event.id)}
                          disabled={isPending}
                          className="w-full"
                        >
                          {isRegistering ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                          )}
                          Register
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#004d35]">
                <Trophy className="h-6 w-6 text-[#c9a962]" />
              </div>
              <p className="mt-4 text-center text-[#a8d4c0]">
                {search
                  ? 'No events match your search'
                  : 'No open events at the moment'}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
