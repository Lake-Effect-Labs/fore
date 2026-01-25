'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerWithFoursome } from '@/lib/actions/events';
import { Plus, X, UserPlus, Users } from 'lucide-react';

interface Teammate {
  name: string;
  email: string;
  handicap?: number;
}

interface EventRegistrationFormProps {
  eventId: string;
  teamSize: number;
  waitlist?: boolean;
}

export function EventRegistrationForm({
  eventId,
  teamSize,
  waitlist,
}: EventRegistrationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeammate, setNewTeammate] = useState<Teammate>({ name: '', email: '' });

  const canAddMore = teammates.length < teamSize - 1; // -1 for the registering user

  const addTeammate = () => {
    if (newTeammate.name && newTeammate.email) {
      // Check for duplicate email
      if (teammates.some(t => t.email.toLowerCase() === newTeammate.email.toLowerCase())) {
        return;
      }
      setTeammates([...teammates, { ...newTeammate, email: newTeammate.email.toLowerCase() }]);
      setNewTeammate({ name: '', email: '' });
      setShowAddForm(false);
    }
  };

  const removeTeammate = (email: string) => {
    setTeammates(teammates.filter((t) => t.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await registerWithFoursome(
      eventId,
      teammates.length > 0 ? teammates : undefined
    );

    setIsLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Team members section */}
      {teamSize > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-[#e8f5f0]">
              Your Group
            </label>
            <span className="text-xs text-[#a8d4c0]">
              {teammates.length + 1} of {teamSize}
            </span>
          </div>

          {/* You (the registering user) */}
          <div className="flex items-center gap-3 rounded-lg bg-[#004d35] p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c9a962] text-[#002418] text-sm font-bold">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8f5f0]">You</p>
              <p className="text-xs text-[#a8d4c0]">Captain</p>
            </div>
          </div>

          {/* Added teammates */}
          {teammates.map((teammate, index) => (
            <div
              key={teammate.email}
              className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002418] border border-[#004d35] text-[#a8d4c0] text-sm font-bold">
                  {index + 2}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e8f5f0]">{teammate.name}</p>
                  <p className="text-xs text-[#a8d4c0]">
                    {teammate.email}
                    {teammate.handicap !== undefined && ` • HCP: ${teammate.handicap}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeTeammate(teammate.email)}
                className="text-[#a8d4c0] hover:text-red-400 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add teammate form */}
          {canAddMore && showAddForm && (
            <div className="rounded-lg border border-[#004d35] p-4 space-y-3">
              <p className="text-sm font-medium text-[#e8f5f0]">Add a teammate</p>
              <p className="text-xs text-[#a8d4c0]">
                They don't need a Fore account - just enter their info and they'll be added to your group.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#a8d4c0] mb-1">Name *</label>
                  <Input
                    placeholder="John Smith"
                    value={newTeammate.name}
                    onChange={(e) => setNewTeammate({ ...newTeammate, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#a8d4c0] mb-1">Email *</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={newTeammate.email}
                    onChange={(e) => setNewTeammate({ ...newTeammate, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="sm:w-1/2">
                <label className="block text-xs text-[#a8d4c0] mb-1">Handicap (optional)</label>
                <Input
                  type="number"
                  placeholder="18"
                  min="0"
                  max="54"
                  step="0.1"
                  value={newTeammate.handicap ?? ''}
                  onChange={(e) => setNewTeammate({
                    ...newTeammate,
                    handicap: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTeammate({ name: '', email: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={addTeammate}
                  disabled={!newTeammate.name || !newTeammate.email}
                >
                  Add to Group
                </Button>
              </div>
            </div>
          )}

          {/* Add teammate button */}
          {canAddMore && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#004d35] p-3 text-sm text-[#a8d4c0] hover:border-[#c9a962] hover:text-[#e8f5f0] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add teammate ({teamSize - 1 - teammates.length} spot{teamSize - 1 - teammates.length !== 1 ? 's' : ''} available)
            </button>
          )}

          {!canAddMore && (
            <p className="text-xs text-[#a8d4c0] text-center">
              Group is full ({teamSize} players)
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" isLoading={isLoading}>
        {teammates.length > 0 ? (
          <>
            <Users className="mr-2 h-4 w-4" />
            {waitlist ? 'Join Waitlist' : 'Register'} as Group of {teammates.length + 1}
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            {waitlist ? 'Join Waitlist' : 'Register'}
          </>
        )}
      </Button>

      {teammates.length === 0 && teamSize > 1 && (
        <p className="text-xs text-[#a8d4c0] text-center">
          You can register alone and add teammates later, or add them now
        </p>
      )}
    </form>
  );
}
