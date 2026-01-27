import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOrganization, getUserRole, getProfile } from '@/lib/actions';
import { getEvent, getEventRegistrations } from '@/lib/actions/events';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  UserCog,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { AssignOrganizerForm } from './assign-organizer-form';

interface PageProps {
  params: Promise<{ slug: string; eventId: string }>;
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { slug, eventId } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);
  if (!role || !['owner', 'admin'].includes(role)) {
    notFound();
  }

  const event = await getEvent(eventId);
  if (!event || event.organization_id !== org.id) {
    notFound();
  }

  const registrations = await getEventRegistrations(eventId);
  const confirmedCount = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  ).length;

  // Get organizer profile if assigned
  let organizerProfile = null;
  if (event.organizer_id) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', event.organizer_id)
      .single();
    organizerProfile = data;
  }

  const eventDate = new Date(event.event_date);
  const eventUrl = event.slug ? `/${slug}/${event.slug}` : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href={`/admin/${slug}/events`}
        className="mb-6 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f5f0]">{event.name}</h1>
            <p className="mt-1 text-[#a8d4c0]">{org.name}</p>
          </div>
          <Badge
            variant={
              event.status === 'open'
                ? 'success'
                : event.status === 'draft'
                ? 'secondary'
                : 'default'
            }
          >
            {event.status}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-[#c9a962]" />
            <div>
              <p className="text-sm text-[#a8d4c0]">Date</p>
              <p className="font-medium text-[#e8f5f0]">
                {eventDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-[#c9a962]" />
            <div>
              <p className="text-sm text-[#a8d4c0]">Time</p>
              <p className="font-medium text-[#e8f5f0]">
                {event.start_time || 'TBD'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-[#c9a962]" />
            <div>
              <p className="text-sm text-[#a8d4c0]">Registered</p>
              <p className="font-medium text-[#e8f5f0]">
                {confirmedCount}
                {event.max_players && ` / ${event.max_players}`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-5 w-5 text-[#c9a962]" />
            <div>
              <p className="text-sm text-[#a8d4c0]">Course Fee</p>
              <p className="font-medium text-[#e8f5f0]">
                {event.course_fee ? `$${event.course_fee}` : 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event URL */}
      {eventUrl && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-[#a8d4c0]" />
                <span className="text-sm text-[#a8d4c0]">Public event page:</span>
                <code className="rounded bg-[#002418] px-2 py-1 text-sm text-[#e8f5f0]">
                  {eventUrl}
                </code>
              </div>
              <Link href={eventUrl} target="_blank">
                <Button variant="outline" size="sm">
                  View Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Organizer */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-[#c9a962]" />
              <CardTitle>Event Organizer</CardTitle>
            </div>
            <CardDescription>
              The organizer manages registrations, groups, and shotgun assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organizerProfile ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#002418] border border-[#004d35] p-4">
                  <p className="font-medium text-[#e8f5f0]">
                    {organizerProfile.full_name || 'No name set'}
                  </p>
                  <p className="text-sm text-[#a8d4c0]">{organizerProfile.email}</p>
                </div>
                <p className="text-xs text-[#a8d4c0]">
                  This person can manage all aspects of the event except the date, time, and course fee.
                </p>
                <AssignOrganizerForm eventId={eventId} currentOrganizer={organizerProfile} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#002418] border border-dashed border-[#004d35] p-4 text-center">
                  <UserCog className="mx-auto h-8 w-8 text-[#004d35] mb-2" />
                  <p className="text-sm text-[#a8d4c0]">No organizer assigned yet</p>
                </div>
                <AssignOrganizerForm eventId={eventId} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#c9a962]" />
              <CardTitle>Event Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[#a8d4c0]">Format</p>
                <p className="font-medium text-[#e8f5f0] capitalize">
                  {event.format.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#a8d4c0]">Team Size</p>
                <p className="font-medium text-[#e8f5f0]">
                  {event.team_size === 1 ? 'Individual' : `Teams of ${event.team_size}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#a8d4c0]">Start Type</p>
                <p className="font-medium text-[#e8f5f0]">
                  {event.shotgun_start ? 'Shotgun' : 'Tee Times'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#a8d4c0]">Entry Fee</p>
                <p className="font-medium text-[#e8f5f0]">
                  {event.entry_fee ? `$${event.entry_fee}` : 'Free / TBD'}
                </p>
              </div>
            </div>

            {event.description && (
              <div>
                <p className="text-sm text-[#a8d4c0]">Description</p>
                <p className="text-[#e8f5f0] whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registrations Preview */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" />
              <CardTitle>Registrations ({confirmedCount})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {registrations.length > 0 ? (
            <div className="space-y-2">
              {registrations.slice(0, 10).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-lg bg-[#002418] px-3 py-2"
                >
                  <span className="text-sm text-[#e8f5f0]">
                    {reg.profile?.full_name || reg.profile?.email || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={reg.status === 'confirmed' ? 'success' : 'secondary'}>
                      {reg.status}
                    </Badge>
                    <Badge variant={reg.payment_status === 'paid' ? 'success' : 'secondary'}>
                      {reg.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
              {registrations.length > 10 && (
                <p className="text-sm text-[#a8d4c0] text-center pt-2">
                  And {registrations.length - 10} more...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#a8d4c0]">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No registrations yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
