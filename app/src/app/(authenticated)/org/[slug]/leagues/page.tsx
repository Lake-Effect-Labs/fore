import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getOrganization,
  getOrganizationLeagues,
  getUserRole,
} from '@/lib/actions';
import { ArrowLeft, Plus, Trophy, ChevronRight, Users, Calendar } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const leagueTypeLabels: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  season: 'Seasonal',
};

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  best_ball: 'Best Ball',
  scramble: 'Scramble',
};

export default async function LeaguesPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [leagues, role] = await Promise.all([
    getOrganizationLeagues(org.id),
    getUserRole(org.id),
  ]);

  const canManage = role && ['owner', 'admin', 'pro_shop'].includes(role);

  const activeLeagues = leagues.filter((l) => l.is_active);
  const inactiveLeagues = leagues.filter((l) => !l.is_active);

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
            <h1 className="text-2xl font-bold text-slate-900">Leagues</h1>
            <p className="mt-1 text-slate-600">
              Manage your recurring golf leagues and seasons
            </p>
          </div>
          {canManage && (
            <Link href={`/org/${slug}/leagues/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create League
              </Button>
            </Link>
          )}
        </div>
      </div>

      {leagues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Trophy className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No leagues yet
            </h3>
            <p className="mt-2 text-center text-slate-600">
              Create your first league to start organizing recurring golf competitions.
            </p>
            {canManage && (
              <Link href={`/org/${slug}/leagues/new`} className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First League
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Leagues */}
          {activeLeagues.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Active Leagues
              </h2>
              <div className="space-y-4">
                {activeLeagues.map((league) => (
                  <LeagueCard key={league.id} league={league} slug={slug} />
                ))}
              </div>
            </section>
          )}

          {/* Inactive Leagues */}
          {inactiveLeagues.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-500">
                Inactive Leagues
              </h2>
              <div className="space-y-4">
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

function LeagueCard({ league, slug }: { league: any; slug: string }) {
  return (
    <Link href={`/org/${slug}/leagues/${league.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-emerald-200">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Trophy className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{league.name}</h3>
                <Badge variant={league.is_active ? 'success' : 'secondary'}>
                  {league.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {leagueTypeLabels[league.league_type] || league.league_type}
                </span>
                <span className="text-sm text-slate-500">
                  {formatLabels[league.format] || league.format}
                </span>
                {league.max_players && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    Max {league.max_players}
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
