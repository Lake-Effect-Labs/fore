'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoundScorecard } from '@/components/scorecard/round-scorecard';
import { Button } from '@/components/ui/button';
import { submitEventScore, recalculateLeaderboard } from '@/lib/actions/events';
import { Check, Loader2, RefreshCw } from 'lucide-react';

interface EventScoringProps {
  eventId: string;
  registrationId: string;
  holes: {
    hole_number: number;
    par: number;
    yardage?: number | null;
    handicap_index?: number | null;
    pin_placement?: 'front' | 'middle' | 'back' | null;
    notes?: string | null;
  }[];
  initialScores: Record<number, number>;
}

export function EventScoring({
  eventId,
  registrationId,
  holes,
  initialScores,
}: EventScoringProps) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<number, number>>(initialScores);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleScoreChange = async (holeNumber: number, strokes: number) => {
    // Optimistic update
    setScores(prev => ({ ...prev, [holeNumber]: strokes }));
    setIsSaved(false);

    // Submit to server
    const result = await submitEventScore(eventId, registrationId, holeNumber, strokes);

    if (result.error) {
      // Revert on error
      setScores(prev => {
        const next = { ...prev };
        delete next[holeNumber];
        return next;
      });
    } else {
      // Refresh to update leaderboard
      router.refresh();
    }
  };

  const handleRefreshLeaderboard = async () => {
    setIsSubmitting(true);
    await recalculateLeaderboard(eventId);
    router.refresh();
    setIsSubmitting(false);
    setIsSaved(true);
  };

  const holesCompleted = Object.keys(scores).length;
  const totalHoles = holes.length;
  const isComplete = holesCompleted === totalHoles;

  return (
    <div className="space-y-4">
      <RoundScorecard
        holes={holes}
        scores={scores}
        onScoreChange={handleScoreChange}
        title="Enter Score"
        showTotals={true}
      />

      {/* Status and Refresh */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#a8d4c0]">
            {holesCompleted} of {totalHoles} holes completed
          </span>
          {isComplete && (
            <Badge className="bg-[#004d35] text-[#c9a962]">Round Complete</Badge>
          )}
        </div>

        <Button
          onClick={handleRefreshLeaderboard}
          disabled={isSubmitting}
          variant="outline"
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Leaderboard...
            </>
          ) : isSaved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Leaderboard Updated
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Leaderboard
            </>
          )}
        </Button>

        <p className="text-center text-xs text-[#a8d4c0]">
          Scores are saved automatically as you enter them
        </p>
      </div>
    </div>
  );
}

// Simple Badge component since we're using it inline
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
