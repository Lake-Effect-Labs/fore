import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrganization,
  getOrganizationFacilities,
  getOrganizationLeagues,
  getOrganizationEvents,
  getOrganizationMembers,
  getUserRole,
} from '@/lib/actions';
import {
  Building2,
  MapPin,
  Users,
  Trophy,
  Calendar,
  ChevronRight,
  Plus,
  Settings,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganizationDashboard({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [facilities, leagues, events, members, role] = await Promise.all([
    getOrganizationFacilities(org.id),
    getOrganizationLeagues(org.id),
    getOrganizationEvents(org.id),
    getOrganizationMembers(org.id),
    getUserRole(org.id),
  ]);

  const isAdmin = role && ['owner', 'admin'].includes(role);
  const canManage = role && ['owner', 'admin', 'pro_shop'].includes(role);

  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date())
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#004d35]">
              <Building2 className="h-8 w-8 text-[#c9a962]" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#e8f5f0]">{org.name}</h1>
            {org.city && org.state && (
              <p className="mt-1 flex items-center gap-1 text-[#a8d4c0]">
                <MapPin className="h-4 w-4" />
                {org.city}, {org.state}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">{org.subscription_tier}</Badge>
              {role && <Badge>{role}</Badge>}
            </div>
          </div>
        </div>
        {isAdmin && (
          <Link href={`/org/${slug}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <MapPin className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {facilities.length}
              </p>
              <p className="text-sm text-[#a8d4c0]">Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Trophy className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {leagues.length}
              </p>
              <p className="text-sm text-[#a8d4c0]">Active Leagues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Calendar className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {upcomingEvents.length}
              </p>
              <p className="text-sm text-[#a8d4c0]">Upcoming Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Users className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {members.length}
              </p>
              <p className="text-sm text-[#a8d4c0]">Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {canManage && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link href={`/org/${slug}/leagues/new`}>
            <Card className="cursor-pointer transition-all hover:border-[#c9a962]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#004d35]">
                    <Plus className="h-5 w-5 text-[#c9a962]" />
                  </div>
                  <span className="font-medium text-[#e8f5f0]">Create League</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
              </CardContent>
            </Card>
          </Link>
          <Link href={`/org/${slug}/events/new`}>
            <Card className="cursor-pointer transition-all hover:border-[#c9a962]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#004d35]">
                    <Plus className="h-5 w-5 text-[#c9a962]" />
                  </div>
                  <span className="font-medium text-[#e8f5f0]">Create Event</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
              </CardContent>
            </Card>
          </Link>
          <Link href={`/org/${slug}/courses/new`}>
            <Card className="cursor-pointer transition-all hover:border-[#c9a962]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#004d35]">
                    <Plus className="h-5 w-5 text-[#c9a962]" />
                  </div>
                  <span className="font-medium text-[#e8f5f0]">Add Course</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leagues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#c9a962]" />
              Leagues
            </CardTitle>
            <Link href={`/org/${slug}/leagues`}>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {leagues.length === 0 ? (
              <p className="text-center py-8 text-[#a8d4c0]">
                No leagues yet. Create your first league to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {leagues.slice(0, 5).map((league) => (
                  <Link
                    key={league.id}
                    href={`/org/${slug}/leagues/${league.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#004d35] p-3 hover:bg-[#004d35]"
                  >
                    <div>
                      <p className="font-medium text-[#e8f5f0]">{league.name}</p>
                      <p className="text-sm text-[#a8d4c0]">
                        {league.league_type} • {league.format.replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#c9a962]" />
              Upcoming Events
            </CardTitle>
            <Link href={`/org/${slug}/events`}>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-center py-8 text-[#a8d4c0]">
                No upcoming events scheduled.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/org/${slug}/events/${event.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#004d35] p-3 hover:bg-[#004d35]"
                  >
                    <div>
                      <p className="font-medium text-[#e8f5f0]">{event.name}</p>
                      <p className="text-sm text-[#a8d4c0]">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
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
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#c9a962]" />
              Courses
            </CardTitle>
            <Link href={`/org/${slug}/courses`}>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {facilities.length === 0 ? (
              <p className="text-center py-8 text-[#a8d4c0]">
                No courses added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {facilities.map((facility) => (
                  <Link
                    key={facility.id}
                    href={`/org/${slug}/courses/${facility.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#004d35] p-3 hover:bg-[#004d35]"
                  >
                    <div>
                      <p className="font-medium text-[#e8f5f0]">
                        {facility.name}
                      </p>
                      <p className="text-sm text-[#a8d4c0]">
                        {facility.holes} holes
                        {facility.par && ` • Par ${facility.par}`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" />
              Team Members
            </CardTitle>
            {isAdmin && (
              <Link href={`/org/${slug}/members`}>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d35] text-sm font-medium text-[#c9a962]">
                      {member.profile.full_name?.[0] ||
                        member.profile.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#e8f5f0]">
                        {member.profile.full_name || member.profile.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
