'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateStandings } from '@/lib/actions/leagues';
import { RefreshCw, Check } from 'lucide-react';

interface UpdateStandingsButtonProps {
  seasonId: string;
}

export function UpdateStandingsButton({ seasonId }: UpdateStandingsButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    const result = await updateStandings(seasonId);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      // Reset success state after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : success ? (
          <>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Updated!
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recalculate Standings
          </>
        )}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
