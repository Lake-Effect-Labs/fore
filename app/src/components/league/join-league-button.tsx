'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { joinLeague } from '@/lib/actions';
import { UserPlus, Loader2, Check } from 'lucide-react';

interface JoinLeagueButtonProps {
  seasonId: string;
}

export function JoinLeagueButton({ seasonId }: JoinLeagueButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = () => {
    setError('');
    startTransition(async () => {
      const result = await joinLeague(seasonId);
      if (result.error) {
        setError(result.error);
      } else {
        setJoined(true);
        router.refresh();
      }
    });
  };

  if (joined) {
    return (
      <Button variant="outline" disabled>
        <Check className="mr-2 h-4 w-4 text-emerald-600" />
        Joined
      </Button>
    );
  }

  return (
    <div>
      <Button onClick={handleJoin} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Join League
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
