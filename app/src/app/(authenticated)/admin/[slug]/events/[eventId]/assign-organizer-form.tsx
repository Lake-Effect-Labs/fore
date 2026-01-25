'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assignOrganizer } from '@/lib/actions/events';
import { UserPlus, RefreshCw } from 'lucide-react';

interface AssignOrganizerFormProps {
  eventId: string;
  currentOrganizer?: { id: string; email: string; full_name: string | null } | null;
}

export function AssignOrganizerForm({ eventId, currentOrganizer }: AssignOrganizerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [showForm, setShowForm] = useState(!currentOrganizer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);

    const result = await assignOrganizer(eventId, email);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.organizer) {
      setSuccess(`Assigned ${result.organizer.full_name || result.organizer.email} as organizer`);
      setEmail('');
      setShowForm(false);
      router.refresh();
    }
  };

  if (!showForm && currentOrganizer) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Change Organizer
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
          {currentOrganizer ? 'New organizer email' : 'Organizer email'}
        </label>
        <Input
          type="email"
          placeholder="organizer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="mt-1 text-xs text-[#a8d4c0]">
          Must be an existing Fore user account
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/20 p-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-900/20 p-2 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={isLoading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {currentOrganizer ? 'Update' : 'Assign'} Organizer
        </Button>
        {currentOrganizer && showForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowForm(false);
              setEmail('');
              setError('');
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
