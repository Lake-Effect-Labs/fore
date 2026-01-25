'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ScoreInputProps {
  value: number | null;
  onChange: (strokes: number) => void;
  disabled?: boolean;
  isPending?: boolean;
  highlight?: boolean;
}

export function ScoreInput({
  value,
  onChange,
  disabled = false,
  isPending = false,
  highlight = false,
}: ScoreInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(localValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 20) {
      if (numValue !== value) {
        onChange(numValue);
      }
    } else {
      setLocalValue(value?.toString() || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value?.toString() || '');
      setIsEditing(false);
    }
    // Allow only numbers
    if (
      !/[0-9]/.test(e.key) &&
      !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(
        e.key
      )
    ) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow 1-2 digit numbers
    if (val === '' || /^\d{1,2}$/.test(val)) {
      setLocalValue(val);
    }
  };

  // Quick score buttons for mobile
  const quickScores = [3, 4, 5, 6, 7];

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-10 h-10 text-center text-lg font-semibold rounded-lg',
            'border-2 border-[#c9a962] bg-[#003d2a] text-[#e8f5f0]',
            'focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:ring-offset-1 focus:ring-offset-[#002418]'
          )}
        />
        {/* Quick score popover for mobile */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 flex gap-1 p-1 bg-[#003d2a] rounded-lg shadow-lg border border-[#004d35]">
          {quickScores.map((score) => (
            <button
              key={score}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setLocalValue(score.toString());
                onChange(score);
                setIsEditing(false);
              }}
              className={cn(
                'w-8 h-8 text-sm font-medium rounded-md transition-colors',
                'hover:bg-[#004d35] hover:text-[#c9a962]',
                score === value && 'bg-[#c9a962] text-[#002418] hover:bg-[#c9a962]'
              )}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-10 h-10 text-center text-lg font-semibold rounded-lg transition-all',
        'border-2 focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:ring-offset-1 focus:ring-offset-[#002418]',
        value !== null
          ? highlight
            ? 'border-[#c9a962] bg-[#c9a962]/20 text-[#c9a962]'
            : 'border-[#004d35] bg-[#003d2a] text-[#e8f5f0]'
          : 'border-dashed border-[#004d35] bg-[#002418] text-[#a8d4c0]',
        !disabled && 'hover:border-[#c9a962] hover:bg-[#004d35] cursor-pointer',
        disabled && 'opacity-60 cursor-not-allowed',
        isPending && 'animate-pulse'
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mx-auto animate-spin text-[#c9a962]" />
      ) : value !== null ? (
        value
      ) : (
        '-'
      )}
    </button>
  );
}
