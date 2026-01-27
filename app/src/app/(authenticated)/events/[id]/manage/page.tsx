import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getEventWithDetails,
  getEventRegistrations,
  getEventGroups,
  isEventOrganizer,
} from '@/lib/actions/events';
import { ArrowLeft } from 'lucide-react';
import { ManageTabs } from './manage-tabs';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function EventManagePage({ params, searchParams }: PageProps) {
  const { id: eventId } = await params;
  const { tab } = await searchParams;

  // Check if user is organizer
  const isOrganizer = await isEventOrganizer(eventId);
  if (!isOrganizer) {
    redirect(`/events/${eventId}`);
  }

  const event = await getEventWithDetails(eventId);
  if (!event) {
    notFound();
  }

  const registrations = await getEventRegistrations(eventId);
  const groups = await getEventGroups(eventId);

  const confirmedCount = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  ).length;

  const paidCount = registrations.filter(
    (r) => r.payment_status === 'paid'
  ).length;

  const checkedInCount = registrations.filter(
    (r) => r.checked_in
  ).length;

  const eventUrl = event.slug && event.organization
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/${event.organization.slug}/${event.slug}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/events/organize"
          className="inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          My Events
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0] truncate">
                {event.name}
              </h1>
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
            <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">
              {event.organization?.name} •{' '}
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="py-3 sm:py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#c9a962]">{confirmedCount}</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 sm:py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-400">{paidCount}</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 sm:py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{checkedInCount}</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Checked In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 sm:py-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#a8d4c0]">{groups.length}</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Groups</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Content */}
      <ManageTabs
        event={event}
        eventUrl={eventUrl}
        registrations={registrations.filter(
          (r): r is typeof r & { profile: NonNullable<typeof r.profile> } => r.profile !== null
        )}
        groups={groups}
        initialTab={tab || 'overview'}
      />
    </div>
  );
}
