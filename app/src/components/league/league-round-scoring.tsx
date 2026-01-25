'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoundScorecard } from '@/components/scorecard/round-scorecard';
import { Button } from '@/components/ui/button';
import { submitRoundScore, updateStandings } from '@/lib/actions/leagues';
import { Check, Loader2 } from 'lucide-react';

interface LeagueRoundScoringProps {
  roundId: string;
  participantId: string;
  holes: {
    hole_number: number;
    par: number;
    yardage?: number | null;
    handicap_index?: number | null;
    pin_placement?: 'front' | 'middle' | 'back' | null;
    notes?: string | null;
  }[];
  initialScores: Record<number, number>;
  leagueId: string;
  seasonId: string;
}

export function LeagueRoundScoring({
  roundId,
  participantId,
  holes,
  initialScores,
  leagueId,
  seasonId,
}: LeagueRoundScoringProps) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<number, number>>(initialScores);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleScoreChange = async (holeNumber: number, strokes: number) => {
    // Optimistic update
    setScores(prev => ({ ...prev, [holeNumber]: strokes }));
    setIsSaved(false);

    // Submit to server
    const result = await submitRoundScore(roundId, participantId, holeNumber, strokes);

    if (result.error) {
      // Revert on error
      setScores(prev => {
        const next = { ...prev };
        delete next[holeNumber];
        return next;
      });
    }
  };

  const handleFinishRound = async () => {
    setIsSubmitting(true);

    // Update standings
    await updateStandings(seasonId);

    setIsSaved(true);
    setIsSubmitting(false);

    // Refresh the page to show updated standings
    router.refresh();
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

      {/* Finish Round Button */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleFinishRound}
          disabled={holesCompleted === 0 || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Round Saved
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {isComplete ? 'Finish Round' : `Save Progress (${holesCompleted}/${totalHoles})`}
            </>
          )}
        </Button>

        {!isComplete && (
          <p className="text-center text-xs text-[#a8d4c0]">
            You can save partial rounds and come back to finish later
          </p>
        )}
      </div>
    </div>
  );
}
