import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  getOrganization,
  getLeague,
  getSeasonParticipants,
  getSeasons,
  getSeasonStandings,
  getUserRole,
} from '@/lib/actions';
import { ArrowLeft, Trophy, Users, Calendar, Settings, Play } from 'lucide-react';
import { JoinLeagueButton } from '@/components/league/join-league-button';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  best_ball: 'Best Ball',
  scramble: 'Scramble',
};

const leagueTypeLabels: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  season: 'Seasonal',
};

export default async function LeagueDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [league, seasons, role] = await Promise.all([
    getLeague(id),
    getSeasons(id),
    getUserRole(org.id),
  ]);

  if (!league) {
    notFound();
  }

  const canManage = role && ['owner', 'admin', 'pro_shop'].includes(role);
  const currentSeason = seasons.find((s) => s.is_active);

  // Get participants and standings for current season
  const [participants, standings] = currentSeason
    ? await Promise.all([
        getSeasonParticipants(currentSeason.id),
        getSeasonStandings(currentSeason.id),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}/leagues`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leagues
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
              <Trophy className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{league.name}</h1>
                <Badge variant={league.is_active ? 'success' : 'secondary'}>
                  {league.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  {leagueTypeLabels[league.league_type]}
                </span>
                <Badge variant="secondary">{formatLabels[league.format]}</Badge>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  {participants.length} participants
                </span>
              </div>
              {league.description && (
                <p className="mt-3 text-slate-600">{league.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {league.is_active && currentSeason && (
              <JoinLeagueButton seasonId={currentSeason.id} />
            )}
            {canManage && (
              <Link href={`/org/${slug}/leagues/${id}/settings`}>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Season */}
          {currentSeason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-600" />
                  Current Season: {currentSeason.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>
                    Started:{' '}
                    {new Date(currentSeason.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {currentSeason.end_date && (
                    <span>
                      Ends:{' '}
                      {new Date(currentSeason.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {standings.length === 0 ? (
                <p className="text-center py-8 text-slate-500">
                  No standings yet. Start playing rounds to see the leaderboard!
                </p>
              ) : (
                <div className="space-y-2">
                  {standings.slice(0, 10).map((standing, index) => (
                    <div
                      key={standing.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-amber-100 text-amber-700'
                              : index === 1
                              ? 'bg-slate-200 text-slate-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {standing.rank}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">
                            {standing.profile?.full_name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {standing.rounds_played} rounds
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{standing.total_gross || 0}</p>
                        {standing.average_gross && (
                          <p className="text-sm text-slate-500">
                            Avg: {standing.average_gross.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seasons History */}
          {seasons.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Seasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seasons
                    .filter((s) => !s.is_active)
                    .map((season) => (
                      <div
                        key={season.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{season.name}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(season.start_date).toLocaleDateString()} -{' '}
                            {season.end_date
                              ? new Date(season.end_date).toLocaleDateString()
                              : 'Ongoing'}
                          </p>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* League Info */}
          <Card>
            <CardHeader>
              <CardTitle>League Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {league.entry_fee && (
                <div>
                  <p className="text-sm text-slate-500">Entry Fee</p>
                  <p className="font-medium text-slate-900">
                    ${league.entry_fee.toFixed(2)}
                  </p>
                </div>
              )}
              {league.max_players && (
                <div>
                  <p className="text-sm text-slate-500">Max Players</p>
                  <p className="font-medium text-slate-900">
                    {participants.length} / {league.max_players}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Handicap</p>
                <p className="font-medium text-slate-900">
                  {league.handicap_percentage}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-center py-4 text-slate-500">
                  No participants yet
                </p>
              ) : (
                <div className="space-y-2">
                  {participants.slice(0, 10).map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 py-2"
                    >
                      <Avatar
                        src={participant.profile?.avatar_url}
                        name={participant.profile?.full_name || participant.profile?.email}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {participant.profile?.full_name || participant.profile?.email}
                        </p>
                      </div>
                      <Badge variant={participant.is_active ? 'success' : 'secondary'} className="text-xs">
                        {participant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  {participants.length > 10 && (
                    <p className="text-center text-sm text-slate-500">
                      +{participants.length - 10} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
