'use client';

import { useState, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ScoreInput } from './score-input';
import { updateScore } from '@/lib/actions';
import type { GameWithDetails, Score } from '@/types/database';
import { calculateSkins } from '@/lib/game-logic/skins';
import { calculateMatchPlay } from '@/lib/game-logic/match-play';
import { getNassauStandings } from '@/lib/game-logic/nassau';
import { cn } from '@/lib/utils';
import { Loader2, Trophy, Target } from 'lucide-react';

interface ScorecardProps {
  game: GameWithDetails;
  currentUserId: string;
}

export function Scorecard({ game, currentUserId }: ScorecardProps) {
  const [scores, setScores] = useState<Score[]>(game.scores);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get score for a specific player and hole
  const getScore = useCallback(
    (playerId: string, hole: number): number | null => {
      const score = scores.find(
        (s) => s.player_id === playerId && s.hole_number === hole
      );
      return score?.strokes ?? null;
    },
    [scores]
  );

  // Calculate player totals
  const getPlayerTotal = useCallback(
    (playerId: string, startHole: number = 1, endHole: number = game.holes): number => {
      return scores
        .filter(
          (s) =>
            s.player_id === playerId &&
            s.hole_number >= startHole &&
            s.hole_number <= endHole &&
            s.strokes !== null
        )
        .reduce((sum, s) => sum + (s.strokes || 0), 0);
    },
    [scores, game.holes]
  );

  // Optimistic score update
  const handleScoreChange = useCallback(
    async (playerId: string, hole: number, strokes: number) => {
      const key = `${playerId}-${hole}`;

      // Optimistic update
      setScores((prev) => {
        const existing = prev.findIndex(
          (s) => s.player_id === playerId && s.hole_number === hole
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], strokes };
          return updated;
        }
        return [
          ...prev,
          {
            id: `temp-${key}`,
            game_id: game.id,
            player_id: playerId,
            hole_number: hole,
            strokes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });

      // Mark as pending
      setPendingUpdates((prev) => new Set(prev).add(key));
      setSaveError(null);

      // Server update
      startTransition(async () => {
        const result = await updateScore({
          game_id: game.id,
          player_id: playerId,
          hole_number: hole,
          strokes,
        });

        // Remove from pending
        setPendingUpdates((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });

        if (result.error) {
          // Revert on error and show message
          setScores(game.scores);
          setSaveError(result.error || 'Failed to save score. Please try again.');
          // Auto-clear error after 5 seconds
          setTimeout(() => setSaveError(null), 5000);
        }
      });
    },
    [game.id, game.scores]
  );

  // Calculate game-specific results for display
  const getHoleResult = (hole: number) => {
    if (game.format === 'skins' && game.config) {
      const results = calculateSkins(scores, game.config, game.holes);
      const holeResult = results.find((r) => r.hole === hole);
      return holeResult;
    }
    return null;
  };

  // Get match play status
  const getMatchPlayStatus = () => {
    if (game.format === 'match_play' && game.players.length === 2) {
      const result = calculateMatchPlay(
        scores,
        game.config!,
        game.players[0].id,
        game.players[1].id,
        game.holes as 9 | 18
      );
      return result;
    }
    return null;
  };

  // Get Nassau standings
  const getNassauStatus = () => {
    if (game.format === 'nassau') {
      return getNassauStandings(
        scores,
        game.players.map((p) => p.id)
      );
    }
    return null;
  };

  const holes = Array.from({ length: game.holes }, (_, i) => i + 1);
  const frontNine = holes.filter((h) => h <= 9);
  const backNine = holes.filter((h) => h > 9);

  const matchPlayStatus = getMatchPlayStatus();
  const nassauStatus = getNassauStatus();

  return (
    <div className="space-y-6">
      {/* Game Status Banner */}
      {game.format === 'match_play' && matchPlayStatus && (
        <Card className="border-[#004d35] bg-[#003d2a]">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Target className="h-5 w-5 text-[#c9a962]" />
              <span className="font-semibold text-[#e8f5f0]">
                {matchPlayStatus.leader_id ? (
                  <>
                    {game.players.find((p) => p.id === matchPlayStatus.leader_id)
                      ?.profile?.display_name ||
                      game.players.find((p) => p.id === matchPlayStatus.leader_id)
                        ?.profile?.full_name ||
                      'Player'}{' '}
                    is {matchPlayStatus.holes_up} up
                    {matchPlayStatus.holes_remaining > 0 &&
                      ` with ${matchPlayStatus.holes_remaining} to play`}
                  </>
                ) : (
                  'All Square'
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Error Banner */}
      {saveError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      {/* Scorecard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Scorecard</CardTitle>
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-[#a8d4c0]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#004d35] bg-[#003d2a]">
                  <th className="sticky left-0 z-10 bg-[#003d2a] px-4 py-3 text-left text-sm font-medium text-[#a8d4c0]">
                    Player
                  </th>
                  {frontNine.map((hole) => (
                    <th
                      key={hole}
                      className="px-2 py-3 text-center text-sm font-medium text-[#a8d4c0]"
                    >
                      {hole}
                    </th>
                  ))}
                  <th className="bg-[#002418] px-3 py-3 text-center text-sm font-semibold text-[#e8f5f0]">
                    OUT
                  </th>
                  {backNine.map((hole) => (
                    <th
                      key={hole}
                      className="px-2 py-3 text-center text-sm font-medium text-[#a8d4c0]"
                    >
                      {hole}
                    </th>
                  ))}
                  {game.holes === 18 && (
                    <>
                      <th className="bg-[#002418] px-3 py-3 text-center text-sm font-semibold text-[#e8f5f0]">
                        IN
                      </th>
                      <th className="bg-[#004d35] px-3 py-3 text-center text-sm font-semibold text-[#c9a962]">
                        TOT
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {game.players.map((player) => {
                  const isCurrentUser = player.user_id === currentUserId;
                  const frontTotal = getPlayerTotal(player.id, 1, 9);
                  const backTotal = getPlayerTotal(player.id, 10, 18);
                  const total = frontTotal + backTotal;

                  return (
                    <tr
                      key={player.id}
                      className={cn(
                        'border-b border-[#004d35]/50',
                        isCurrentUser && 'bg-[#003d2a]/50'
                      )}
                    >
                      {/* Player Info */}
                      <td className="sticky left-0 z-10 bg-[#002418] px-4 py-2">
                        <div className={cn(isCurrentUser && 'bg-[#003d2a]/50')}>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={player.profile?.avatar_url}
                              name={player.profile?.full_name || player.profile?.email}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-[#e8f5f0]">
                                {player.profile?.display_name ||
                                  player.profile?.full_name ||
                                  'Golfer'}
                                {isCurrentUser && (
                                  <span className="ml-1 text-xs text-[#c9a962]">
                                    (you)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Front 9 Scores */}
                      {frontNine.map((hole) => {
                        const score = getScore(player.id, hole);
                        const isPendingScore = pendingUpdates.has(
                          `${player.id}-${hole}`
                        );
                        const skinResult = getHoleResult(hole);
                        const wonSkin =
                          skinResult?.winner_id === player.id && !skinResult.carried;

                        return (
                          <td
                            key={hole}
                            className={cn(
                              'px-1 py-1 text-center',
                              wonSkin && 'bg-[#c9a962]/10'
                            )}
                          >
                            <ScoreInput
                              value={score}
                              onChange={(strokes) =>
                                handleScoreChange(player.id, hole, strokes)
                              }
                              disabled={!isCurrentUser}
                              isPending={isPendingScore}
                              highlight={wonSkin}
                            />
                          </td>
                        );
                      })}

                      {/* Front 9 Total */}
                      <td className="bg-[#002418] px-3 py-2 text-center font-semibold text-[#e8f5f0]">
                        {frontTotal || '-'}
                      </td>

                      {/* Back 9 Scores */}
                      {backNine.map((hole) => {
                        const score = getScore(player.id, hole);
                        const isPendingScore = pendingUpdates.has(
                          `${player.id}-${hole}`
                        );
                        const skinResult = getHoleResult(hole);
                        const wonSkin =
                          skinResult?.winner_id === player.id && !skinResult.carried;

                        return (
                          <td
                            key={hole}
                            className={cn(
                              'px-1 py-1 text-center',
                              wonSkin && 'bg-[#c9a962]/10'
                            )}
                          >
                            <ScoreInput
                              value={score}
                              onChange={(strokes) =>
                                handleScoreChange(player.id, hole, strokes)
                              }
                              disabled={!isCurrentUser}
                              isPending={isPendingScore}
                              highlight={wonSkin}
                            />
                          </td>
                        );
                      })}

                      {/* Back 9 & Total */}
                      {game.holes === 18 && (
                        <>
                          <td className="bg-[#002418] px-3 py-2 text-center font-semibold text-[#e8f5f0]">
                            {backTotal || '-'}
                          </td>
                          <td className="bg-[#004d35] px-3 py-2 text-center font-bold text-[#c9a962]">
                            {total || '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

                {/* Skins Row */}
                {game.format === 'skins' && game.config && (
                  <tr className="border-t-2 border-[#004d35] bg-[#c9a962]/10">
                    <td className="sticky left-0 z-10 bg-[#c9a962]/10 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-[#c9a962]" />
                        <span className="text-sm font-medium text-[#c9a962]">
                          Skins
                        </span>
                      </div>
                    </td>
                    {frontNine.map((hole) => {
                      const result = getHoleResult(hole);
                      return (
                        <td key={hole} className="px-2 py-2 text-center">
                          {result?.winner_id ? (
                            <span className="text-sm font-semibold text-[#c9a962]">
                              ${result.value}
                            </span>
                          ) : result?.carried ? (
                            <span className="text-xs text-[#a8d4c0]/60">C/O</span>
                          ) : (
                            <span className="text-[#a8d4c0]/40">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="bg-[#002418] px-3 py-2" />
                    {backNine.map((hole) => {
                      const result = getHoleResult(hole);
                      return (
                        <td key={hole} className="px-2 py-2 text-center">
                          {result?.winner_id ? (
                            <span className="text-sm font-semibold text-[#c9a962]">
                              ${result.value}
                            </span>
                          ) : result?.carried ? (
                            <span className="text-xs text-[#a8d4c0]/60">C/O</span>
                          ) : (
                            <span className="text-[#a8d4c0]/40">-</span>
                          )}
                        </td>
                      );
                    })}
                    {game.holes === 18 && (
                      <>
                        <td className="bg-[#002418]" />
                        <td className="bg-[#004d35]" />
                      </>
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Nassau Standings */}
      {game.format === 'nassau' && nassauStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nassau Standings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-[#003d2a] p-4">
                <h4 className="text-sm font-medium text-[#a8d4c0]">Front 9</h4>
                <div className="mt-2 space-y-1">
                  {nassauStatus
                    .sort((a, b) => a.frontNine - b.frontNine)
                    .map((standing) => {
                      const player = game.players.find(
                        (p) => p.id === standing.playerId
                      );
                      return (
                        <div
                          key={standing.playerId}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[#e8f5f0]">
                            {player?.profile?.display_name ||
                              player?.profile?.full_name ||
                              'Player'}
                          </span>
                          <span className="font-semibold text-[#e8f5f0]">
                            {standing.frontNine || '-'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              {game.holes === 18 && (
                <>
                  <div className="rounded-lg bg-[#003d2a] p-4">
                    <h4 className="text-sm font-medium text-[#a8d4c0]">Back 9</h4>
                    <div className="mt-2 space-y-1">
                      {nassauStatus
                        .sort((a, b) => a.backNine - b.backNine)
                        .map((standing) => {
                          const player = game.players.find(
                            (p) => p.id === standing.playerId
                          );
                          return (
                            <div
                              key={standing.playerId}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-[#e8f5f0]">
                                {player?.profile?.display_name ||
                                  player?.profile?.full_name ||
                                  'Player'}
                              </span>
                              <span className="font-semibold text-[#e8f5f0]">
                                {standing.backNine || '-'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#004d35] p-4">
                    <h4 className="text-sm font-medium text-[#c9a962]">
                      Overall
                    </h4>
                    <div className="mt-2 space-y-1">
                      {nassauStatus
                        .sort((a, b) => a.total - b.total)
                        .map((standing) => {
                          const player = game.players.find(
                            (p) => p.id === standing.playerId
                          );
                          return (
                            <div
                              key={standing.playerId}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-[#e8f5f0]">
                                {player?.profile?.display_name ||
                                  player?.profile?.full_name ||
                                  'Player'}
                              </span>
                              <span className="font-bold text-[#c9a962]">
                                {standing.total || '-'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
