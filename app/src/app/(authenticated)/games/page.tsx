import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { getMyGames } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  ChevronRight,
  Gamepad2,
  Clock,
  Trophy,
  Users,
  Target,
  Zap,
  UserPlus,
  Medal,
} from 'lucide-react';
import type { GameFormat, GameStatus } from '@/types/database';

const formatLabels: Record<GameFormat, string> = {
  skins: 'Skins',
  nassau: 'Nassau',
  match_play: 'Match Play',
  wolf: 'Wolf',
  best_ball: 'Best Ball',
  bingo_bango_bongo: 'Bingo Bango Bongo',
};

const formatIcons: Record<GameFormat, typeof Target> = {
  skins: Target,
  nassau: Trophy,
  match_play: Users,
  wolf: Zap,
  best_ball: UserPlus,
  bingo_bango_bongo: Medal,
};

const statusColors: Record<GameStatus, 'default' | 'warning' | 'success' | 'secondary'> = {
  pending: 'warning',
  active: 'default',
  completed: 'success',
  cancelled: 'secondary',
};

const statusLabels: Record<GameStatus, string> = {
  pending: 'Waiting',
  active: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function GamesPage() {
  const games = await getMyGames();

  const activeGames = games.filter((g) => g.status === 'active');
  const pendingGames = games.filter((g) => g.status === 'pending');
  const completedGames = games.filter((g) => g.status === 'completed');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e8f5f0]">Play</h1>
          <p className="text-[#a8d4c0]">Games with friends</p>
        </div>
        <Link href="/games/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </Link>
      </div>

      {/* Game Types Info */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <h2 className="mb-4 text-lg font-semibold text-[#e8f5f0]">
            Game Formats
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#004d35]">
                <Zap className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-medium text-[#e8f5f0]">Wolf</h3>
                <p className="text-sm text-[#a8d4c0]">
                  Rotating wolf picks partner or goes alone. 4 players.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#004d35]">
                <Target className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-medium text-[#e8f5f0]">Skins</h3>
                <p className="text-sm text-[#a8d4c0]">
                  Win the hole outright, win the skin. Ties carry over.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#004d35]">
                <Trophy className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-medium text-[#e8f5f0]">Nassau</h3>
                <p className="text-sm text-[#a8d4c0]">
                  Three bets: front 9, back 9, and overall match.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#004d35]">
                <UserPlus className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-medium text-[#e8f5f0]">Best Ball</h3>
                <p className="text-sm text-[#a8d4c0]">
                  Teams of 2. Best score per hole counts. 4 players.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#004d35]">
                <Medal className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-medium text-[#e8f5f0]">Bingo Bango Bongo</h3>
                <p className="text-sm text-[#a8d4c0]">
                  3 points per hole: first on, closest, first in.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#004d35]">
                <Users className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <h3 className="font-medium text-[#e8f5f0]">Match Play</h3>
                <p className="text-sm text-[#a8d4c0]">
                  Head-to-head, hole by hole. Best for 2 players.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Games */}
      {activeGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Clock className="h-5 w-5 text-[#c9a962]" />
            Active Games
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGames.map((game) => {
              const FormatIcon = formatIcons[game.format];
              return (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="h-full transition-all hover:border-[#c9a962]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant={statusColors[game.status]}>
                            {statusLabels[game.status]}
                          </Badge>
                          <div className="mt-2 flex items-center gap-2">
                            <FormatIcon className="h-4 w-4 text-[#c9a962]" />
                            <h3 className="font-semibold text-[#e8f5f0]">
                              {formatLabels[game.format]}
                            </h3>
                          </div>
                          {game.course_name && (
                            <p className="text-sm text-[#a8d4c0]">{game.course_name}</p>
                          )}
                          <p className="text-sm text-[#a8d4c0]">{game.holes} holes</p>
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
              );
            })}
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
            {pendingGames.map((game) => {
              const FormatIcon = formatIcons[game.format];
              return (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="h-full transition-all hover:border-[#c9a962]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="warning">Waiting</Badge>
                          <div className="mt-2 flex items-center gap-2">
                            <FormatIcon className="h-4 w-4 text-[#c9a962]" />
                            <h3 className="font-semibold text-[#e8f5f0]">
                              {formatLabels[game.format]}
                            </h3>
                          </div>
                          <p className="text-sm text-[#a8d4c0]">{game.holes} holes</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#a8d4c0]" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Games */}
      {completedGames.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Trophy className="h-5 w-5 text-[#a8d4c0]" />
            Recent Games
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGames.slice(0, 6).map((game) => {
              const FormatIcon = formatIcons[game.format];
              return (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="h-full transition-all hover:border-[#c9a962]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-[#a8d4c0]">
                            {formatDate(game.completed_at || game.created_at)}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <FormatIcon className="h-4 w-4 text-[#c9a962]" />
                            <h3 className="font-semibold text-[#e8f5f0]">
                              {formatLabels[game.format]}
                            </h3>
                          </div>
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
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#004d35]">
              <Gamepad2 className="h-8 w-8 text-[#c9a962]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
              No Games Yet
            </h3>
            <p className="mt-2 max-w-sm text-center text-[#a8d4c0]">
              Start a game of wolf, skins, nassau, or best ball with your friends.
            </p>
            <Link href="/games/new" className="mt-6">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Start Your First Game
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
