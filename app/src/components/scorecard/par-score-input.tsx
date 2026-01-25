'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Minus } from 'lucide-react';

interface ParScoreInputProps {
  par: number;
  value: number | null;
  onChange: (strokes: number) => void;
  disabled?: boolean;
  isPending?: boolean;
  holeNumber: number;
}

export function ParScoreInput({
  par,
  value,
  onChange,
  disabled = false,
  isPending = false,
  holeNumber,
}: ParScoreInputProps) {
  // Current score defaults to par if not set
  const currentScore = value ?? par;
  const relativeToPar = currentScore - par;

  const handleIncrement = () => {
    if (!disabled && currentScore < 15) {
      onChange(currentScore + 1);
    }
  };

  const handleDecrement = () => {
    if (!disabled && currentScore > 1) {
      onChange(currentScore - 1);
    }
  };

  // Format relative to par display
  const getRelativeDisplay = () => {
    if (value === null) return '-';
    if (relativeToPar === 0) return 'E';
    if (relativeToPar > 0) return `+${relativeToPar}`;
    return `${relativeToPar}`;
  };

  // Get color based on score relative to par
  const getScoreColor = () => {
    if (value === null) return 'text-[#a8d4c0]';
    if (relativeToPar < 0) return 'text-red-400'; // Under par (birdie/eagle) - red like leaderboards
    if (relativeToPar === 0) return 'text-[#e8f5f0]'; // Par - white
    if (relativeToPar === 1) return 'text-[#a8d4c0]'; // Bogey - muted
    return 'text-[#a8d4c0]/70'; // Double bogey+ - more muted
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Hole number */}
      <div className="text-xs font-medium text-[#a8d4c0]">
        {holeNumber}
      </div>

      {/* Par indicator */}
      <div className="text-[10px] text-[#a8d4c0]/60">
        Par {par}
      </div>

      {/* Score control */}
      <div className="flex items-center gap-1">
        {/* Minus button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || currentScore <= 1}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
            'bg-[#003d2a] border border-[#004d35]',
            'hover:bg-[#004d35] hover:border-[#c9a962]',
            'active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#003d2a] disabled:hover:border-[#004d35]'
          )}
        >
          <Minus className="h-4 w-4 text-[#e8f5f0]" />
        </button>

        {/* Score display */}
        <div
          className={cn(
            'flex h-12 w-14 flex-col items-center justify-center rounded-lg',
            'bg-[#002418] border-2 border-[#004d35]',
            isPending && 'animate-pulse'
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#c9a962]" />
          ) : (
            <>
              <span className={cn('text-lg font-bold', getScoreColor())}>
                {value ?? '-'}
              </span>
              <span className={cn('text-xs font-medium -mt-1', getScoreColor())}>
                {getRelativeDisplay()}
              </span>
            </>
          )}
        </div>

        {/* Plus button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || currentScore >= 15}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
            'bg-[#003d2a] border border-[#004d35]',
            'hover:bg-[#004d35] hover:border-[#c9a962]',
            'active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#003d2a] disabled:hover:border-[#004d35]'
          )}
        >
          <Plus className="h-4 w-4 text-[#e8f5f0]" />
        </button>
      </div>
    </div>
  );
}
