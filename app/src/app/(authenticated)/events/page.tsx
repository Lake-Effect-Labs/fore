import { getPublicEvents, getMyEvents } from '@/lib/actions';
import { EventsClient } from './events-client';

export default async function EventsPage() {
  const [publicEvents, myEvents] = await Promise.all([
    getPublicEvents(),
    getMyEvents().catch(() => []),
  ]);

  return (
    <EventsClient
      publicEvents={publicEvents}
      myEvents={myEvents}
    />
  );
}
