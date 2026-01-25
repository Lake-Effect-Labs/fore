import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { getLeague, getSeasons, getSeasonParticipants, getSeasonStandings, getSeasonRounds, getProfile } from '@/lib/actions';
import { JoinLeagueButton } from '@/components/league/join-league-button';
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Play, CheckCircle } from 'lucide-react';

const dayLabels: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  scramble: 'Scramble',
  best_ball: 'Best Ball',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeagueDetailPage({ params }: PageProps) {
  const { id } = await params;
  const league = await getLeague(id);

  if (!league) {
    notFound();
  }

  const [seasons, profile] = await Promise.all([
    getSeasons(id),
    getProfile(),
  ]);

  const activeSeason = seasons.find((s) => s.is_active);

  let participants: Awaited<ReturnType<typeof getSeasonParticipants>> = [];
  let standings: Awaited<ReturnType<typeof getSeasonStandings>> = [];
  let rounds: Awaited<ReturnType<typeof getSeasonRounds>> = [];
  let isParticipant = false;

  if (activeSeason) {
    [participants, standings, rounds] = await Promise.all([
      getSeasonParticipants(activeSeason.id),
      getSeasonStandings(activeSeason.id),
      getSeasonRounds(activeSeason.id),
    ]);
    isParticipant = participants.some((p) => p.user_id === profile?.id);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/leagues"
        className="mb-4 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Leagues
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f5f0]">{league.name}</h1>
            {league.description && (
              <p className="mt-2 text-[#a8d4c0]">{league.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {formatLabels[league.format] || league.format}
              </Badge>
              <Badge variant="secondary">{league.league_type}</Badge>
              {league.day_of_week !== null && (
                <Badge variant="secondary">
                  {dayLabels[league.day_of_week]}s
                </Badge>
              )}
              {league.start_time && (
                <Badge variant="secondary">{league.start_time}</Badge>
              )}
            </div>
          </div>
          {activeSeason && !isParticipant && (
            <JoinLeagueButton seasonId={activeSeason.id} />
          )}
          {isParticipant && (
            <Badge variant="success">Joined</Badge>
          )}
        </div>
      </div>

      {/* League Info */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
              <Users className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8f5f0]">
                {participants.length}
              </p>
              <p className="text-sm text-[#a8d4c0]">Players</p>
            </div>
          </CardContent>
        </Card>
        {league.entry_fee && (
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Trophy className="h-6 w-6 text-[#c9a962]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#e8f5f0]">
                  ${league.entry_fee}
                </p>
                <p className="text-sm text-[#a8d4c0]">Entry Fee</p>
              </div>
            </CardContent>
          </Card>
        )}
        {league.max_players && (
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Users className="h-6 w-6 text-[#c9a962]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#e8f5f0]">
                  {participants.length}/{league.max_players}
                </p>
                <p className="text-sm text-[#a8d4c0]">Spots Filled</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rounds - Show if participant */}
      {isParticipant && rounds.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#c9a962]" />
              Rounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rounds.map((round) => {
                const roundDate = new Date(round.scheduled_date);
                const isToday = roundDate.toDateString() === new Date().toDateString();
                const isPast = roundDate < new Date() && !isToday;

                return (
                  <Link
                    key={round.id}
                    href={`/leagues/${id}/rounds/${round.id}`}
                    className="flex items-center justify-between rounded-lg border border-[#004d35] p-4 hover:border-[#c9a962] hover:bg-[#003d2a]/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                        isToday ? 'bg-[#c9a962] text-[#002418]' : 'bg-[#004d35] text-[#a8d4c0]'
                      }`}>
                        {round.round_number}
                      </div>
                      <div>
                        <p className="font-medium text-[#e8f5f0]">
                          Round {round.round_number}
                        </p>
                        <p className="text-sm text-[#a8d4c0]">
                          {roundDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {round.tee_time && ` at ${round.tee_time}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <Badge variant="success">Today</Badge>
                      )}
                      {isPast ? (
                        <CheckCircle className="h-5 w-5 text-[#a8d4c0]" />
                      ) : (
                        <Play className="h-5 w-5 text-[#c9a962]" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standings */}
      {standings.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#c9a962]" />
              Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {standings.map((standing, index) => (
                <div
                  key={standing.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      index === 0 ? 'bg-[#c9a962] text-[#002418]' : 'bg-[#004d35] text-[#a8d4c0]'
                    }`}>
                      {standing.rank}
                    </div>
                    <Avatar
                      src={standing.profile?.avatar_url}
                      name={standing.profile?.full_name || 'Player'}
                      size="sm"
                    />
                    <span className="font-medium text-[#e8f5f0]">
                      {standing.profile?.full_name || 'Unknown Player'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#e8f5f0]">
                      {standing.total_gross || 0}
                    </p>
                    <p className="text-xs text-[#a8d4c0]">
                      {standing.rounds_played} rounds
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      {participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-lg border border-[#004d35] p-3"
                >
                  <Avatar
                    src={participant.profile?.avatar_url}
                    name={participant.profile?.full_name || participant.profile?.email}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-[#e8f5f0]">
                      {participant.profile?.full_name || participant.profile?.email}
                    </p>
                    {participant.handicap_at_start && (
                      <p className="text-xs text-[#a8d4c0]">
                        Handicap: {participant.handicap_at_start}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!activeSeason && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#004d35]">
              <Calendar className="h-8 w-8 text-[#c9a962]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
              No Active Season
            </h3>
            <p className="mt-2 text-center text-[#a8d4c0]">
              This league doesn't have an active season yet. Check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
