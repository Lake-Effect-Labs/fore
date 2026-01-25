import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrganization,
  getOrganizationLeagues,
  getOrganizationEvents,
  getUserRole,
} from '@/lib/actions';
import {
  Trophy,
  Calendar,
  ChevronRight,
  Plus,
  TrendingUp,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);

  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    notFound();
  }

  const [leagues, events] = await Promise.all([
    getOrganizationLeagues(org.id),
    getOrganizationEvents(org.id),
  ]);

  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5);

  const activeLeagues = leagues.filter((l) => l.is_active);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">Dashboard</h1>
        <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">Welcome back to {org.name}</p>
      </div>

      {/* Stats */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">{activeLeagues.length}</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Leagues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">{upcomingEvents.length}</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">--</p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Players</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[#e8f5f0]">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href={`/admin/${slug}/leagues/new`} className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create League
            </Button>
          </Link>
          <Link href={`/admin/${slug}/events/new`} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Active Leagues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#c9a962]" />
              Active Leagues
            </CardTitle>
            <Link href={`/admin/${slug}/leagues`}>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {activeLeagues.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <p className="text-sm text-[#a8d4c0]">No active leagues</p>
                <Link href={`/admin/${slug}/leagues/new`} className="mt-2 inline-block">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Create League
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeLeagues.slice(0, 5).map((league) => (
                  <Link
                    key={league.id}
                    href={`/admin/${slug}/leagues/${league.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#004d35] p-2.5 sm:p-3 transition-colors hover:bg-[#004d35] active:scale-[0.98]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-[#e8f5f0] truncate">{league.name}</p>
                      <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">
                        {league.league_type} &bull; {league.format.replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#a8d4c0] flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#c9a962]" />
              Upcoming Events
            </CardTitle>
            <Link href={`/admin/${slug}/events`}>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {upcomingEvents.length === 0 ? (
              <div className="py-6 sm:py-8 text-center">
                <p className="text-sm text-[#a8d4c0]">No upcoming events</p>
                <Link href={`/admin/${slug}/events/new`} className="mt-2 inline-block">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Create Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/${slug}/events/${event.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#004d35] p-2.5 sm:p-3 transition-colors hover:bg-[#004d35] active:scale-[0.98]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-[#e8f5f0] truncate">{event.name}</p>
                      <p className="text-xs sm:text-sm text-[#a8d4c0]">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        event.status === 'open' ? 'success' :
                        event.status === 'draft' ? 'secondary' : 'default'
                      }
                      className="flex-shrink-0 ml-2"
                    >
                      {event.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
