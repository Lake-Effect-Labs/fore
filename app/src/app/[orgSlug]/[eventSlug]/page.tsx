import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  getEventBySlug,
  getEventRegistrations,
  getMyEventRegistration,
} from '@/lib/actions/events';
import { getProfile } from '@/lib/actions';
import { Calendar, MapPin, Users, Clock, DollarSign } from 'lucide-react';
import { EventRegistrationForm } from './registration-form';

interface PageProps {
  params: Promise<{ orgSlug: string; eventSlug: string }>;
}

export default async function PublicEventPage({ params }: PageProps) {
  const { orgSlug, eventSlug } = await params;

  const event = await getEventBySlug(orgSlug, eventSlug);

  if (!event) {
    notFound();
  }

  // Check visibility
  if (event.visibility === 'private') {
    // For private events, could add invite code check here
    // For now, just show the page (organizer controls who gets the link)
  }

  const registrations = await getEventRegistrations(event.id);
  const confirmedCount = registrations.filter(r =>
    r.status === 'confirmed' || r.status === 'pending'
  ).length;
  const spotsLeft = event.max_players ? event.max_players - confirmedCount : null;

  const profile = await getProfile();
  const myRegistration = profile ? await getMyEventRegistration(event.id) : null;
  const isRegistered = myRegistration && myRegistration.status !== 'cancelled';

  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate >= new Date();
  const registrationOpen = event.status === 'open' && isUpcoming;

  // Check registration deadline
  const deadlinePassed = event.registration_closes_at
    ? new Date(event.registration_closes_at) < new Date()
    : false;

  return (
    <div className="min-h-screen bg-[#002418]">
      {/* Hero Section */}
      {event.cover_image_url ? (
        <div
          className="h-48 sm:h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${event.cover_image_url})` }}
        />
      ) : (
        <div className="h-32 sm:h-48 bg-gradient-to-br from-[#004d35] to-[#002418]" />
      )}

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 -mt-16 relative">
        {/* Event Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{event.name}</CardTitle>
                {event.organization && (
                  <CardDescription className="mt-1">
                    Hosted at {event.organization.name}
                  </CardDescription>
                )}
              </div>
              <Badge variant={
                event.status === 'open' ? 'success' :
                event.status === 'completed' ? 'secondary' :
                event.status === 'cancelled' ? 'destructive' : 'default'
              }>
                {event.status === 'open' ? 'Registration Open' :
                 event.status === 'closed' ? 'Registration Closed' :
                 event.status === 'in_progress' ? 'In Progress' :
                 event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-[#a8d4c0]">
                <Calendar className="h-5 w-5 text-[#c9a962]" />
                <div>
                  <p className="text-[#e8f5f0] font-medium">
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {event.start_time && (
                    <p className="text-sm">Starting at {event.start_time}</p>
                  )}
                </div>
              </div>

              {event.facility && (
                <div className="flex items-center gap-3 text-[#a8d4c0]">
                  <MapPin className="h-5 w-5 text-[#c9a962]" />
                  <div>
                    <p className="text-[#e8f5f0] font-medium">{event.facility.name}</p>
                    <p className="text-sm">{event.facility.holes} holes</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-[#a8d4c0]">
                <Users className="h-5 w-5 text-[#c9a962]" />
                <div>
                  <p className="text-[#e8f5f0] font-medium">
                    {confirmedCount} registered
                    {spotsLeft !== null && spotsLeft > 0 && ` • ${spotsLeft} spots left`}
                    {spotsLeft === 0 && ' • Waitlist only'}
                  </p>
                  <p className="text-sm">
                    {event.format.replace('_', ' ')} • Teams of {event.team_size}
                  </p>
                </div>
              </div>

              {event.entry_fee && event.entry_fee > 0 && (
                <div className="flex items-center gap-3 text-[#a8d4c0]">
                  <DollarSign className="h-5 w-5 text-[#c9a962]" />
                  <div>
                    <p className="text-[#e8f5f0] font-medium">
                      ${event.entry_fee} per player
                    </p>
                    <p className="text-sm">Pay organizer directly</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="border-t border-[#004d35] pt-4">
                <p className="text-[#a8d4c0] whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Registration Deadline */}
            {event.registration_closes_at && (
              <div className="flex items-center gap-2 text-sm text-[#a8d4c0]">
                <Clock className="h-4 w-4" />
                Registration closes: {new Date(event.registration_closes_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Registration</CardTitle>
          </CardHeader>
          <CardContent>
            {isRegistered ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#004d35] mb-3">
                  <Users className="h-6 w-6 text-[#c9a962]" />
                </div>
                <p className="text-[#e8f5f0] font-medium">You&apos;re registered!</p>
                <p className="text-sm text-[#a8d4c0] mt-1">
                  Status: {myRegistration?.status}
                  {myRegistration?.group_number && ` • Group ${myRegistration.group_number}`}
                  {myRegistration?.starting_hole && ` • Starting hole ${myRegistration.starting_hole}`}
                </p>
                <Link href={`/events/${event.id}`}>
                  <Button variant="outline" className="mt-4">
                    View Event Details
                  </Button>
                </Link>
              </div>
            ) : !profile ? (
              <div className="text-center py-4">
                <p className="text-[#a8d4c0] mb-4">Sign in to register for this event</p>
                <Link href={`/auth?redirect=/${orgSlug}/${eventSlug}`}>
                  <Button>Sign In to Register</Button>
                </Link>
              </div>
            ) : !registrationOpen ? (
              <div className="text-center py-4">
                <p className="text-[#a8d4c0]">
                  {deadlinePassed ? 'Registration deadline has passed' :
                   event.status === 'completed' ? 'This event has ended' :
                   event.status === 'cancelled' ? 'This event was cancelled' :
                   'Registration is not currently open'}
                </p>
              </div>
            ) : spotsLeft === 0 ? (
              <div className="text-center py-4">
                <p className="text-[#a8d4c0] mb-4">This event is full. Join the waitlist?</p>
                <EventRegistrationForm
                  eventId={event.id}
                  teamSize={event.team_size}
                  waitlist
                />
              </div>
            ) : (
              <EventRegistrationForm
                eventId={event.id}
                teamSize={event.team_size}
              />
            )}
          </CardContent>
        </Card>

        {/* Who's Playing */}
        {registrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who&apos;s Playing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {registrations
                  .filter(r => r.status === 'confirmed' || r.status === 'pending')
                  .map((reg) => {
                    const name = reg.profile?.full_name || reg.guest_name || 'Player';
                    const isGuest = !reg.user_id;
                    return (
                      <div key={reg.id} className="flex items-center gap-3">
                        <Avatar
                          src={reg.profile?.avatar_url}
                          name={name}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm text-[#e8f5f0]">
                            {name}
                            {isGuest && <span className="text-xs text-blue-400 ml-2">(Guest)</span>}
                          </p>
                          {reg.group_number && (
                            <p className="text-xs text-[#a8d4c0]">Group {reg.group_number}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
