import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrganization,
  getOrganizationLeagues,
  getUserRole,
} from '@/lib/actions';
import {
  Plus,
  Trophy,
  ChevronRight,
  Users,
  Calendar,
  Clock,
  DollarSign,
} from 'lucide-react';
import type { League } from '@/types/b2b';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const leagueTypeLabels: Record<string, string> = {
  weekly: 'Weekly',
  seasonal: 'Seasonal',
  tournament: 'Tournament',
};

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  best_ball: 'Best Ball',
  scramble: 'Scramble',
  shamble: 'Shamble',
};

const dayOfWeekLabels: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export default async function AdminLeaguesPage({ params }: PageProps) {
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

  const leagues = await getOrganizationLeagues(org.id);

  const activeLeagues = leagues.filter((l) => l.is_active);
  const inactiveLeagues = leagues.filter((l) => !l.is_active);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">Leagues</h1>
          <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">
            Manage recurring golf leagues for {org.name}
          </p>
        </div>
        <Link href={`/admin/${slug}/leagues/new`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create League
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {leagues.length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {activeLeagues.length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35] flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-[#e8f5f0]">
                {inactiveLeagues.length}
              </p>
              <p className="text-xs sm:text-sm text-[#a8d4c0] truncate">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#004d35]">
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-[#c9a962]" />
            </div>
            <h3 className="mt-4 text-base sm:text-lg font-semibold text-[#e8f5f0] text-center">
              No leagues yet
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm sm:text-base text-[#a8d4c0]">
              Create your first league to start organizing recurring golf
              competitions for your members.
            </p>
            <Link href={`/admin/${slug}/leagues/new`} className="mt-6 w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First League
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Active Leagues */}
          {activeLeagues.length > 0 && (
            <section>
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[#e8f5f0]">
                Active Leagues
              </h2>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {activeLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} slug={slug} />
                ))}
              </div>
            </section>
          )}

          {/* Inactive Leagues */}
          {inactiveLeagues.length > 0 && (
            <section>
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[#a8d4c0]">
                Inactive Leagues
              </h2>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {inactiveLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} slug={slug} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LeagueCard({ league, slug }: { league: League; slug: string }) {
  return (
    <Link href={`/admin/${slug}/leagues/${league.id}`}>
      <Card className="h-full cursor-pointer transition-all hover:border-[#c9a962] active:scale-[0.98]">
        <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#004d35]">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-[#c9a962]" />
            </div>
            <Badge variant={league.is_active ? 'success' : 'secondary'}>
              {league.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <CardTitle className="mt-3 text-base sm:text-lg text-[#e8f5f0] line-clamp-1">{league.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {league.description && (
            <p className="mb-3 line-clamp-2 text-xs sm:text-sm text-[#a8d4c0]">
              {league.description}
            </p>
          )}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a8d4c0]">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{leagueTypeLabels[league.league_type] || league.league_type}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a8d4c0]">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{formatLabels[league.format] || league.format}</span>
            </div>
            {league.day_of_week !== null && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a8d4c0]">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {dayOfWeekLabels[league.day_of_week]}
                  {league.start_time && ` at ${league.start_time}`}
                </span>
              </div>
            )}
            {league.max_players && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a8d4c0]">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Max {league.max_players} players</span>
              </div>
            )}
            {league.entry_fee !== null && league.entry_fee > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a8d4c0]">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>${league.entry_fee} entry fee</span>
              </div>
            )}
          </div>
          <div className="mt-3 sm:mt-4 flex items-center justify-end text-[#c9a962]">
            <span className="text-xs sm:text-sm font-medium">View Details</span>
            <ChevronRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
