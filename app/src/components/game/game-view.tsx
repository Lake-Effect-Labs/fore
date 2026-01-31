'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Scorecard } from '@/components/scorecard/scorecard';
import { GameResults } from '@/components/game/game-results';
import {
  startGame,
  completeGame,
  respondToInvite,
} from '@/lib/actions';
import type { GameWithDetails, GameFormat } from '@/types/database';
import {
  ArrowLeft,
  Play,
  Check,
  X,
  Users,
  Trophy,
  Clock,
  DollarSign,
} from 'lucide-react';

const formatLabels: Record<GameFormat, string> = {
  skins: 'Skins',
  nassau: 'Nassau',
  match_play: 'Match Play',
  wolf: 'Wolf',
  best_ball: 'Best Ball',
  bingo_bango_bongo: 'Bingo Bango Bongo',
};

interface GameViewProps {
  game: GameWithDetails;
  currentUserId: string;
}

export function GameView({ game, currentUserId }: GameViewProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isCreator = game.created_by === currentUserId;
  const currentPlayer = game.players.find((p) => p.user_id === currentUserId);
  const isPending = currentPlayer?.invite_status === 'pending';
  const allAccepted = game.players.every((p) => p.invite_status === 'accepted');

  const handleStart = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await startGame(game.id);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await completeGame(game.id);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError('Failed to complete game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (response: 'accepted' | 'declined') => {
    setIsLoading(true);
    setError('');
    try {
      const result = await respondToInvite(game.id, response);
      if (result?.error) {
        setError(result.error);
      } else if (response === 'declined') {
        router.push('/dashboard');
      } else {
        router.refresh();
      }
    } catch {
      setError('Failed to respond to invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get stake description
  const getStakeDescription = () => {
    if (!game.config) return '';
    if (game.format === 'skins') {
      return `$${game.config.skin_value} per skin`;
    }
    if (game.format === 'nassau') {
      return `$${game.config.front_nine_bet}/$${game.config.back_nine_bet}/$${game.config.overall_bet}`;
    }
    if (game.format === 'match_play') {
      return `$${game.config.match_bet} match`;
    }
    if (game.format === 'wolf') {
      return game.config.wolf_value ? `$${game.config.wolf_value}/pt` : '';
    }
    if (game.format === 'best_ball') {
      return game.config.best_ball_bet ? `$${game.config.best_ball_bet}/team` : '';
    }
    if (game.format === 'bingo_bango_bongo') {
      return game.config.bingo_value ? `$${game.config.bingo_value}/$${game.config.bango_value}/$${game.config.bongo_value}` : '';
    }
    return '';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Game Info Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-[#003d2a] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004d35]">
            <Trophy className="h-6 w-6 text-[#c9a962]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#e8f5f0]">
                {formatLabels[game.format]}
              </h1>
              <Badge
                variant={
                  game.status === 'active'
                    ? 'default'
                    : game.status === 'completed'
                    ? 'success'
                    : 'warning'
                }
              >
                {game.status === 'active'
                  ? 'In Progress'
                  : game.status === 'completed'
                  ? 'Completed'
                  : 'Pending'}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-[#a8d4c0]">
              {game.course_name && <span>{game.course_name}</span>}
              <span>{game.holes} holes</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {getStakeDescription()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Players */}
          <div className="flex -space-x-2">
            {game.players.map((player) => (
              <Avatar
                key={player.id}
                src={player.profile?.avatar_url}
                name={player.profile?.full_name || player.profile?.email}
                size="md"
                className="border-2 border-[#003d2a]"
              />
            ))}
          </div>

          {/* Actions */}
          {game.status === 'pending' && isCreator && allAccepted && (
            <Button onClick={handleStart} isLoading={isLoading}>
              <Play className="mr-2 h-4 w-4" />
              Start Game
            </Button>
          )}
          {game.status === 'active' && isCreator && (
            <Button onClick={handleComplete} isLoading={isLoading}>
              <Check className="mr-2 h-4 w-4" />
              Complete Game
            </Button>
          )}
        </div>
      </div>

      {/* Pending Invite */}
      {isPending && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-[#002418]">
                You&apos;ve been invited to this game
              </h3>
              <p className="text-sm text-[#003d2a]">
                Accept to join or decline to skip this one.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleRespond('declined')}
                isLoading={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Decline
              </Button>
              <Button
                onClick={() => handleRespond('accepted')}
                isLoading={isLoading}
              >
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Banner */}
      {error && (
        <Card className="mb-6 border-red-800 bg-red-900/20">
          <CardContent className="flex items-center gap-3 p-4">
            <X className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Waiting for players */}
      {game.status === 'pending' && !allAccepted && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="font-semibold text-[#e8f5f0]">
                Waiting for players to accept
              </h3>
              <p className="text-sm text-[#a8d4c0]">
                {game.players.filter((p) => p.invite_status === 'pending').length}{' '}
                player(s) haven&apos;t responded yet
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {game.status === 'active' && (
        <Scorecard game={game} currentUserId={currentUserId} />
      )}

      {game.status === 'completed' && (
        <GameResults game={game} currentUserId={currentUserId} />
      )}

      {game.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {game.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={player.profile?.avatar_url}
                      name={player.profile?.full_name || player.profile?.email}
                    />
                    <div>
                      <div className="font-medium text-[#e8f5f0]">
                        {player.profile?.display_name ||
                          player.profile?.full_name ||
                          'Golfer'}
                      </div>
                      <div className="text-sm text-[#a8d4c0]">
                        {player.profile?.email}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      player.invite_status === 'accepted'
                        ? 'success'
                        : player.invite_status === 'declined'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    {player.invite_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
