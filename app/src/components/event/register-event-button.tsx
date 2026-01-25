'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { registerForEvent } from '@/lib/actions';
import { UserPlus, Loader2, Check } from 'lucide-react';

interface RegisterEventButtonProps {
  eventId: string;
  entryFee?: number | null;
}

export function RegisterEventButton({ eventId, entryFee }: RegisterEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [registered, setRegistered] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = () => {
    setError('');
    startTransition(async () => {
      const result = await registerForEvent(eventId);
      if (result.error) {
        setError(result.error);
      } else {
        if (result.waitlisted) {
          setWaitlisted(true);
        } else {
          setRegistered(true);
        }
        router.refresh();
      }
    });
  };

  if (registered) {
    return (
      <Button variant="outline" disabled>
        <Check className="mr-2 h-4 w-4 text-emerald-600" />
        Registered
      </Button>
    );
  }

  if (waitlisted) {
    return (
      <Button variant="outline" disabled>
        <Check className="mr-2 h-4 w-4 text-amber-600" />
        Waitlisted
      </Button>
    );
  }

  return (
    <div>
      <Button onClick={handleRegister} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Register{entryFee ? ` ($${entryFee.toFixed(2)})` : ''}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
