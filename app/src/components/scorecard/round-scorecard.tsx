'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParScoreInput } from './par-score-input';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Flag, Trophy } from 'lucide-react';

interface HoleData {
  hole_number: number;
  par: number;
}

interface RoundScorecardProps {
  holes: HoleData[];
  scores: Record<number, number>; // hole_number -> strokes
  onScoreChange: (holeNumber: number, strokes: number) => Promise<void>;
  disabled?: boolean;
  title?: string;
  showTotals?: boolean;
}

export function RoundScorecard({
  holes,
  scores,
  onScoreChange,
  disabled = false,
  title = 'Scorecard',
  showTotals = true,
}: RoundScorecardProps) {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [pendingHoles, setPendingHoles] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const currentHole = holes[currentHoleIndex];
  const totalHoles = holes.length;

  // Calculate totals
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const totalStrokes = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const holesPlayed = Object.keys(scores).length;
  const relativeToPar = totalStrokes - holes
    .filter(h => scores[h.hole_number] !== undefined)
    .reduce((sum, h) => sum + h.par, 0);

  const handleScoreChange = async (holeNumber: number, strokes: number) => {
    setPendingHoles(prev => new Set(prev).add(holeNumber));

    startTransition(async () => {
      await onScoreChange(holeNumber, strokes);
      setPendingHoles(prev => {
        const next = new Set(prev);
        next.delete(holeNumber);
        return next;
      });
    });
  };

  const goToPrevHole = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  const goToNextHole = () => {
    if (currentHoleIndex < totalHoles - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  // Group holes into front 9 and back 9
  const frontNine = holes.filter(h => h.hole_number <= 9);
  const backNine = holes.filter(h => h.hole_number > 9);

  return (
    <div className="space-y-4">
      {/* Main scoring card - single hole focus for mobile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            {showTotals && holesPlayed > 0 && (
              <span className={cn(
                'text-lg font-bold',
                relativeToPar < 0 ? 'text-red-400' : relativeToPar === 0 ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'
              )}>
                {relativeToPar === 0 ? 'E' : relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current hole - large display */}
          <div className="flex items-center justify-center gap-4 py-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevHole}
              disabled={currentHoleIndex === 0}
              className="h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <div className="flex-1 flex justify-center">
              <ParScoreInput
                par={currentHole.par}
                value={scores[currentHole.hole_number] ?? null}
                onChange={(strokes) => handleScoreChange(currentHole.hole_number, strokes)}
                disabled={disabled}
                isPending={pendingHoles.has(currentHole.hole_number)}
                holeNumber={currentHole.hole_number}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextHole}
              disabled={currentHoleIndex === totalHoles - 1}
              className="h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Hole navigation dots */}
          <div className="flex justify-center gap-1 py-2">
            {holes.map((hole, index) => (
              <button
                key={hole.hole_number}
                onClick={() => setCurrentHoleIndex(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  index === currentHoleIndex
                    ? 'bg-[#c9a962] w-4'
                    : scores[hole.hole_number] !== undefined
                    ? 'bg-[#004d35]'
                    : 'bg-[#003d2a]'
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick overview - all holes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="h-4 w-4 text-[#c9a962]" />
            All Holes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {/* Front 9 */}
          <div className="mb-2">
            <div className="text-xs text-[#a8d4c0] mb-1 px-1">Front 9</div>
            <div className="grid grid-cols-9 gap-1">
              {frontNine.map((hole) => {
                const score = scores[hole.hole_number];
                const relative = score !== undefined ? score - hole.par : null;
                return (
                  <button
                    key={hole.hole_number}
                    onClick={() => setCurrentHoleIndex(holes.findIndex(h => h.hole_number === hole.hole_number))}
                    className={cn(
                      'flex flex-col items-center justify-center rounded p-1 transition-all',
                      'border border-[#004d35]',
                      currentHoleIndex === holes.findIndex(h => h.hole_number === hole.hole_number)
                        ? 'bg-[#004d35] border-[#c9a962]'
                        : 'bg-[#003d2a] hover:bg-[#004d35]'
                    )}
                  >
                    <span className="text-[10px] text-[#a8d4c0]">{hole.hole_number}</span>
                    <span className={cn(
                      'text-sm font-bold',
                      score === undefined ? 'text-[#a8d4c0]/40' :
                      relative !== null && relative < 0 ? 'text-red-400' :
                      relative === 0 ? 'text-[#e8f5f0]' :
                      'text-[#a8d4c0]'
                    )}>
                      {score ?? '-'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Back 9 */}
          {backNine.length > 0 && (
            <div>
              <div className="text-xs text-[#a8d4c0] mb-1 px-1">Back 9</div>
              <div className="grid grid-cols-9 gap-1">
                {backNine.map((hole) => {
                  const score = scores[hole.hole_number];
                  const relative = score !== undefined ? score - hole.par : null;
                  return (
                    <button
                      key={hole.hole_number}
                      onClick={() => setCurrentHoleIndex(holes.findIndex(h => h.hole_number === hole.hole_number))}
                      className={cn(
                        'flex flex-col items-center justify-center rounded p-1 transition-all',
                        'border border-[#004d35]',
                        currentHoleIndex === holes.findIndex(h => h.hole_number === hole.hole_number)
                          ? 'bg-[#004d35] border-[#c9a962]'
                          : 'bg-[#003d2a] hover:bg-[#004d35]'
                      )}
                    >
                      <span className="text-[10px] text-[#a8d4c0]">{hole.hole_number}</span>
                      <span className={cn(
                        'text-sm font-bold',
                        score === undefined ? 'text-[#a8d4c0]/40' :
                        relative !== null && relative < 0 ? 'text-red-400' :
                        relative === 0 ? 'text-[#e8f5f0]' :
                        'text-[#a8d4c0]'
                      )}>
                        {score ?? '-'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totals */}
          {showTotals && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#004d35]">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#c9a962]" />
                <span className="text-sm text-[#a8d4c0]">
                  {holesPlayed} of {totalHoles} holes
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#e8f5f0]">
                  {totalStrokes || '-'}
                </div>
                <div className={cn(
                  'text-xs',
                  relativeToPar < 0 ? 'text-red-400' : relativeToPar === 0 ? 'text-[#a8d4c0]' : 'text-[#a8d4c0]'
                )}>
                  {holesPlayed > 0 ? (
                    relativeToPar === 0 ? 'Even' : relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar
                  ) : (
                    `Par ${totalPar}`
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
