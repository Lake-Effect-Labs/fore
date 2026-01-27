import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { getMyGames, getProfile, getMyLeagues, getMyEvents } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import { ChevronRight, Trophy, Clock, Users, Calendar } from 'lucide-react';
import type { GameFormat, GameStatus } from '@/types/database';

const formatLabels: Record<GameFormat, string> = {
  skins: 'Skins',
  nassau: 'Nassau',
  match_play: 'Match Play',
  wolf: 'Wolf',
  best_ball: 'Best Ball',
  bingo_bango_bongo: 'Bingo Bango Bongo',
};

const statusColors: Record<GameStatus, 'default' | 'warning' | 'success' | 'secondary'> = {
  pending: 'warning',
  active: 'default',
  completed: 'success',
  cancelled: 'secondary',
};

const statusLabels: Record<GameStatus, string> = {
  pending: 'Pending',
  active: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function DashboardPage() {
  const profile = await getProfile();

  // Course admins should go to admin dashboard
  if (profile?.account_type === 'course_admin') {
    redirect('/admin');
  }

  const [games, leagues, events] = await Promise.all([
    getMyGames(),
    getMyLeagues().catch(() => []),
    getMyEvents().catch(() => []),
  ]);

  const activeGames = games.filter((g) => g.status === 'active');
  const pendingGames = games.filter((g) => g.status === 'pending');
  const completedGames = games.filter((g) => g.status === 'completed');

  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#e8f5f0]">
          Hey, {profile?.display_name || profile?.full_name || 'Golfer'}
        </h1>
        <p className="text-[#a8d4c0]">Here's what's happening</p>
      </div>

      {/* My Leagues */}
      {leagues.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Trophy className="h-5 w-5 text-[#c9a962]" />
            My Leagues
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.slice(0, 3).map((league: any) => (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <Card className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#e8f5f0]">
                          {league.name}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {league.organization?.name}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {leagues.length > 3 && (
            <Link href="/leagues" className="mt-4 inline-block text-sm text-[#c9a962] hover:underline">
              View all {leagues.length} leagues →
            </Link>
          )}
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Calendar className="h-5 w-5 text-[#c9a962]" />
            My Upcoming Events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.slice(0, 3).map((event: any) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#e8f5f0]">
                          {event.name}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {event.organization?.name && ` • ${event.organization.name}`}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Active Games */}
      {activeGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Clock className="h-5 w-5 text-[#c9a962]" />
            Active Games
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGames.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant={statusColors[game.status]}>
                          {statusLabels[game.status]}
                        </Badge>
                        <h3 className="mt-2 font-semibold text-[#e8f5f0]">
                          {formatLabels[game.format]}
                        </h3>
                        {game.course_name && (
                          <p className="text-sm text-[#a8d4c0]">{game.course_name}</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {game.players.slice(0, 4).map((player) => (
                          <Avatar
                            key={player.id}
                            src={player.profile?.avatar_url}
                            name={player.profile?.full_name || player.profile?.email}
                            size="sm"
                            className="border-2 border-[#003d2a]"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-[#a8d4c0]">
                        {game.players.length} players
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pending Games */}
      {pendingGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Users className="h-5 w-5 text-[#c9a962]" />
            Pending Invites
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingGames.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="warning">Waiting</Badge>
                        <h3 className="mt-2 font-semibold text-[#e8f5f0]">
                          {formatLabels[game.format]}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {game.holes} holes
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Games */}
      {completedGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Trophy className="h-5 w-5 text-[#a8d4c0]" />
            Recent Games
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGames.slice(0, 6).map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#a8d4c0]">
                          {formatDate(game.completed_at || game.created_at)}
                        </p>
                        <h3 className="mt-1 font-semibold text-[#e8f5f0]">
                          {formatLabels[game.format]}
                        </h3>
                        {game.course_name && (
                          <p className="text-sm text-[#a8d4c0]">{game.course_name}</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {games.length === 0 && leagues.length === 0 && events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#004d35]">
              <Trophy className="h-8 w-8 text-[#c9a962]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
              Welcome to Fore!
            </h3>
            <p className="mt-2 text-center text-[#a8d4c0] max-w-md">
              Find a league to join or sign up for an upcoming event using the sidebar navigation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
