'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSettlementSummaries, markSettlementPaid } from '@/lib/actions';
import { formatCurrency } from '@/lib/game-logic/settlements';
import type { GameWithDetails, SettlementSummary } from '@/types/database';
import { Trophy, ArrowRight, Check, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameResultsProps {
  game: GameWithDetails;
  currentUserId: string;
}

export function GameResults({ game, currentUserId }: GameResultsProps) {
  const [summaries, setSummaries] = useState<SettlementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettlementSummaries(game.id).then((data) => {
      setSummaries(data);
      setIsLoading(false);
    });
  }, [game.id]);

  const handleMarkPaid = async (settlementId: string) => {
    await markSettlementPaid(settlementId);
    // Refresh summaries
    const updated = await getSettlementSummaries(game.id);
    setSummaries(updated);
  };

  // Sort by net winnings (highest first)
  const sortedSummaries = [...summaries].sort((a, b) => b.net - a.net);
  const winner = sortedSummaries[0];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-slate-400">Loading results...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      {winner && winner.net > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {winner.profile.display_name ||
                  winner.profile.full_name ||
                  'Winner'}
              </h2>
              <p className="mt-1 text-lg text-slate-600">wins</p>
              <div className="mt-2 text-3xl font-bold text-emerald-600">
                {formatCurrency(winner.net)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Square */}
      {(!winner || winner.net === 0) && (
        <Card>
          <CardContent className="py-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Trophy className="h-8 w-8 text-slate-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">All Square</h2>
            <p className="mt-1 text-slate-600">No money changes hands</p>
          </CardContent>
        </Card>
      )}

      {/* Standings */}
      <Card>
        <CardHeader>
          <CardTitle>Final Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedSummaries.map((summary, index) => {
              const player = game.players.find(
                (p) => p.id === summary.player_id
              );
              return (
                <div
                  key={summary.player_id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    index === 0 && summary.net > 0
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                        index === 0 && summary.net > 0
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {index + 1}
                    </div>
                    <Avatar
                      src={player?.profile?.avatar_url}
                      name={player?.profile?.full_name || player?.profile?.email}
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        {player?.profile?.display_name ||
                          player?.profile?.full_name ||
                          'Player'}
                        {player?.user_id === currentUserId && (
                          <span className="ml-1 text-xs text-emerald-600">
                            (you)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-lg font-bold',
                      summary.net > 0
                        ? 'text-emerald-600'
                        : summary.net < 0
                        ? 'text-red-600'
                        : 'text-slate-500'
                    )}
                  >
                    {summary.net > 0 && '+'}
                    {formatCurrency(summary.net)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Settlement Details */}
      {sortedSummaries.some((s) => s.owes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Who Owes Who
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedSummaries.map((summary) => {
                if (summary.owes.length === 0) return null;

                const fromPlayer = game.players.find(
                  (p) => p.id === summary.player_id
                );

                return summary.owes.map((debt) => {
                  const toPlayer = game.players.find(
                    (p) => p.id === debt.to_player_id
                  );
                  const settlement = game.settlements.find(
                    (s) =>
                      s.from_player_id === summary.player_id &&
                      s.to_player_id === debt.to_player_id
                  );

                  return (
                    <div
                      key={`${summary.player_id}-${debt.to_player_id}`}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={fromPlayer?.profile?.avatar_url}
                          name={
                            fromPlayer?.profile?.full_name ||
                            fromPlayer?.profile?.email
                          }
                          size="sm"
                        />
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <Avatar
                          src={toPlayer?.profile?.avatar_url}
                          name={
                            toPlayer?.profile?.full_name ||
                            toPlayer?.profile?.email
                          }
                          size="sm"
                        />
                        <div>
                          <span className="font-medium text-slate-900">
                            {fromPlayer?.profile?.display_name ||
                              fromPlayer?.profile?.full_name ||
                              'Player'}
                          </span>
                          <span className="mx-2 text-slate-400">owes</span>
                          <span className="font-medium text-slate-900">
                            {toPlayer?.profile?.display_name ||
                              toPlayer?.profile?.full_name ||
                              'Player'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(debt.amount)}
                        </span>
                        {settlement?.is_paid ? (
                          <Badge variant="success">
                            <Check className="mr-1 h-3 w-3" />
                            Paid
                          </Badge>
                        ) : (
                          fromPlayer?.user_id === currentUserId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                settlement && handleMarkPaid(settlement.id)
                              }
                            >
                              Mark as Paid
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
