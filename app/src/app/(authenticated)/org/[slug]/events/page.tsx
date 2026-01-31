import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getOrganization,
  getOrganizationEvents,
  getUserRole,
} from '@/lib/actions';
import { ArrowLeft, Plus, Calendar, ChevronRight, Users } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function EventsPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [events, role] = await Promise.all([
    getOrganizationEvents(org.id),
    getUserRole(org.id),
  ]);

  const canManage = role && ['owner', 'admin', 'pro_shop'].includes(role);

  const upcomingEvents = events.filter(
    (e) => ['draft', 'open', 'closed'].includes(e.status) && new Date(e.event_date) >= new Date()
  );
  const inProgressEvents = events.filter((e) => e.status === 'in_progress');
  const pastEvents = events.filter(
    (e) => e.status === 'completed' || new Date(e.event_date) < new Date()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {org.name}
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Events & Outings</h1>
            <p className="mt-1 text-slate-600">
              Manage tournaments, outings, and special events
            </p>
          </div>
          {canManage && (
            <Link href={`/org/${slug}/events/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No events yet
            </h3>
            <p className="mt-2 text-center text-slate-600">
              Create your first event to start organizing tournaments and outings.
            </p>
            {canManage && (
              <Link href={`/org/${slug}/events/new`} className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* In Progress */}
          {inProgressEvents.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-emerald-700">
                In Progress
              </h2>
              <div className="space-y-4">
                {inProgressEvents.map((event) => (
                  <EventCard key={event.id} event={event} slug={slug} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} slug={slug} />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-500">
                Past Events
              </h2>
              <div className="space-y-4">
                {pastEvents.slice(0, 10).map((event) => (
                  <EventCard key={event.id} event={event} slug={slug} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, slug }: { event: any; slug: string }) {
  return (
    <Link href={`/org/${slug}/events/${event.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-purple-200">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{event.name}</h3>
                <Badge variant={statusColors[event.status]}>{event.status}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-slate-500">
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-sm text-slate-500">
                  {formatLabels[event.format] || event.format}
                </span>
                {event.max_players && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    Max {event.max_players}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </CardContent>
      </Card>
    </Link>
  );
}
