import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getOrganization,
  getUserRole,
  getLeague,
  getSeasons,
  getSeasonParticipants,
  getSeasonStandings,
  getSeasonRounds,
  getOrganizationFacilities,
} from '@/lib/actions';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Settings,
  Plus,
  ChevronRight,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react';
import { EditLeagueForm } from './edit-league-form';
import { CreateSeasonForm } from './create-season-form';
import { LeagueParticipantsSection } from './league-participants-section';
import { RoundManagement } from './round-management';
import { UpdateStandingsButton } from './update-standings-button';

interface PageProps {
  params: Promise<{ slug: string; leagueId: string }>;
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

function formatTime(time: string | null): string {
  if (!time) return 'Not set';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default async function AdminLeagueDetailPage({ params }: PageProps) {
  const { slug, leagueId } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);
  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    notFound();
  }

  const league = await getLeague(leagueId);
  if (!league || league.organization_id !== org.id) {
    notFound();
  }

  const [seasons, facilities] = await Promise.all([
    getSeasons(leagueId),
    getOrganizationFacilities(org.id),
  ]);
  const activeSeason = seasons.find((s) => s.is_active);

  // Get participants and standings for active season
  let participants: Awaited<ReturnType<typeof getSeasonParticipants>> = [];
  let standings: Awaited<ReturnType<typeof getSeasonStandings>> = [];
  let rounds: Awaited<ReturnType<typeof getSeasonRounds>> = [];
  
  if (activeSeason) {
    [participants, standings, rounds] = await Promise.all([
      getSeasonParticipants(activeSeason.id),
      getSeasonStandings(activeSeason.id),
      getSeasonRounds(activeSeason.id),
    ]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 sm:px-6">
      <Link
        href={`/admin/${slug}/leagues`}
        className="mb-4 sm:mb-6 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Leagues
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">{league.name}</h1>
              <p className="text-sm text-[#a8d4c0]">{org.name}</p>
            </div>
          </div>
        </div>
        <Badge variant={league.is_active ? 'success' : 'secondary'} className="w-fit">
          {league.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <Calendar className="h-5 w-5 text-[#c9a962] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Type</p>
              <p className="font-medium text-sm sm:text-base text-[#e8f5f0] truncate">
                {leagueTypeLabels[league.league_type]}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <Trophy className="h-5 w-5 text-[#c9a962] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Format</p>
              <p className="font-medium text-sm sm:text-base text-[#e8f5f0] truncate">
                {formatLabels[league.format]}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <Users className="h-5 w-5 text-[#c9a962] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Players</p>
              <p className="font-medium text-sm sm:text-base text-[#e8f5f0]">
                {participants.length}
                {league.max_players && ` / ${league.max_players}`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <DollarSign className="h-5 w-5 text-[#c9a962] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-[#a8d4c0]">Entry Fee</p>
              <p className="font-medium text-sm sm:text-base text-[#e8f5f0]">
                {league.entry_fee ? `$${league.entry_fee}` : 'Free'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Season */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-[#c9a962]" />
                  <CardTitle className="text-base sm:text-lg">Active Season</CardTitle>
                </div>
                {!activeSeason && (
                  <CreateSeasonForm leagueId={leagueId} />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {activeSeason ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#002418] border border-[#004d35] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-[#e8f5f0]">{activeSeason.name}</h4>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-sm text-[#a8d4c0]">
                      {new Date(activeSeason.start_date).toLocaleDateString()} - {new Date(activeSeason.end_date).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#a8d4c0]">
                      <span>{participants.length} players</span>
                      <span>{rounds.length} rounds scheduled</span>
                    </div>
                  </div>

                  {/* Quick Standings */}
                  {standings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-[#e8f5f0] mb-2">Top 5 Standings</h4>
                      <div className="space-y-1.5">
                        {standings.slice(0, 5).map((standing, i) => (
                          <div
                            key={standing.id}
                            className="flex items-center justify-between rounded bg-[#002418] px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-5 text-center font-medium text-[#c9a962]">
                                {i + 1}
                              </span>
                              <span className="text-[#e8f5f0]">
                                {standing.profile?.full_name || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-[#a8d4c0]">
                              {standing.total_gross} ({standing.rounds_played} rds)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Rounds */}
                  {rounds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-[#e8f5f0] mb-2">Upcoming Rounds</h4>
                      <div className="space-y-1.5">
                        {rounds
                          .filter((r) => new Date(r.scheduled_date) >= new Date())
                          .slice(0, 3)
                          .map((round) => (
                            <div
                              key={round.id}
                              className="flex items-center justify-between rounded bg-[#002418] px-3 py-2 text-sm"
                            >
                              <span className="text-[#e8f5f0]">Round {round.round_number}</span>
                              <span className="text-[#a8d4c0]">
                                {new Date(round.scheduled_date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="mx-auto h-10 w-10 text-[#004d35] mb-3" />
                  <p className="text-sm text-[#a8d4c0] mb-4">
                    No active season. Create one to start accepting registrations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <LeagueParticipantsSection 
            seasonId={activeSeason?.id || null}
            participants={participants}
            leagueName={league.name}
          />

          {/* Round Management */}
          {activeSeason && (
            <RoundManagement
              seasonId={activeSeason.id}
              rounds={rounds}
              facilities={facilities}
              seasonName={activeSeason.name}
            />
          )}

          {/* Past Seasons */}
          {seasons.filter((s) => !s.is_active).length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Pause className="h-5 w-5 text-[#a8d4c0]" />
                  <CardTitle className="text-base sm:text-lg text-[#a8d4c0]">Past Seasons</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  {seasons
                    .filter((s) => !s.is_active)
                    .map((season) => (
                      <div
                        key={season.id}
                        className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                      >
                        <div>
                          <p className="font-medium text-[#e8f5f0]">{season.name}</p>
                          <p className="text-xs text-[#a8d4c0]">
                            {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* League Details */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#c9a962]" />
                  <CardTitle className="text-base sm:text-lg">League Settings</CardTitle>
                </div>
                <EditLeagueForm league={league} slug={slug} />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              {league.description && (
                <div>
                  <p className="text-xs text-[#a8d4c0] mb-1">Description</p>
                  <p className="text-sm text-[#e8f5f0]">{league.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {league.day_of_week !== null && (
                  <div>
                    <p className="text-xs text-[#a8d4c0]">Day</p>
                    <p className="text-[#e8f5f0]">{dayOfWeekLabels[league.day_of_week]}</p>
                  </div>
                )}
                {league.start_time && (
                  <div>
                    <p className="text-xs text-[#a8d4c0]">Time</p>
                    <p className="text-[#e8f5f0]">{formatTime(league.start_time)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#a8d4c0]">Handicap %</p>
                  <p className="text-[#e8f5f0]">{league.handicap_percentage}%</p>
                </div>
                {league.max_players && (
                  <div>
                    <p className="text-xs text-[#a8d4c0]">Max Players</p>
                    <p className="text-[#e8f5f0]">{league.max_players}</p>
                  </div>
                )}
              </div>

              {/* Settings from JSON */}
              {league.settings && Object.keys(league.settings).length > 0 && (
                <div className="border-t border-[#004d35] pt-4">
                  <p className="text-xs text-[#a8d4c0] mb-2">Advanced Settings</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {league.settings.handicap_mode && (
                      <div>
                        <span className="text-[#a8d4c0]">Handicap: </span>
                        <span className="text-[#e8f5f0] capitalize">{league.settings.handicap_mode.replace('_', ' ')}</span>
                      </div>
                    )}
                    {league.settings.team_format && (
                      <div>
                        <span className="text-[#a8d4c0]">Teams: </span>
                        <span className="text-[#e8f5f0] capitalize">{league.settings.team_format.replace('_', ' ')}</span>
                      </div>
                    )}
                    {league.settings.scoring_type && (
                      <div>
                        <span className="text-[#a8d4c0]">Scoring: </span>
                        <span className="text-[#e8f5f0] capitalize">{league.settings.scoring_type}</span>
                      </div>
                    )}
                    {league.settings.points_system && league.settings.points_system !== 'none' && (
                      <div>
                        <span className="text-[#a8d4c0]">Points: </span>
                        <span className="text-[#e8f5f0] capitalize">{league.settings.points_system}</span>
                      </div>
                    )}
                    {league.settings.track_skins && (
                      <div className="col-span-2">
                        <span className="text-[#c9a962]">✓ Skins</span>
                        {league.settings.skin_value && (
                          <span className="text-[#a8d4c0]"> (${league.settings.skin_value})</span>
                        )}
                      </div>
                    )}
                    {league.settings.track_closest_to_pin && (
                      <span className="text-[#c9a962]">✓ CTP</span>
                    )}
                    {league.settings.track_long_drive && (
                      <span className="text-[#c9a962]">✓ Long Drive</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-2">
              {activeSeason && (
                <>
                  <Link href={`/leagues/${leagueId}`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Public Page
                    </Button>
                  </Link>
                  <UpdateStandingsButton seasonId={activeSeason.id} />
                </>
              )}
              <Button
                variant={league.is_active ? 'outline' : 'default'}
                className="w-full justify-start"
                disabled
              >
                {league.is_active ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Deactivate League
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Activate League
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
