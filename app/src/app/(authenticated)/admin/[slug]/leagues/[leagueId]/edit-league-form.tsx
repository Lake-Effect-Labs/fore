'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateLeague } from '@/lib/actions/leagues';
import type { League } from '@/types/b2b';
import { Pencil, X } from 'lucide-react';

interface EditLeagueFormProps {
  league: League;
  slug: string;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function EditLeagueForm({ league, slug }: EditLeagueFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description || '');
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(league.day_of_week);
  const [startTime, setStartTime] = useState(league.start_time || '');
  const [maxPlayers, setMaxPlayers] = useState(league.max_players?.toString() || '');
  const [entryFee, setEntryFee] = useState(league.entry_fee?.toString() || '');
  const [handicapPercentage, setHandicapPercentage] = useState(
    league.handicap_percentage.toString()
  );
  const [isActive, setIsActive] = useState(league.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await updateLeague(league.id, {
      name,
      description: description || null,
      day_of_week: dayOfWeek,
      start_time: startTime || null,
      max_players: maxPlayers ? parseInt(maxPlayers) : null,
      entry_fee: entryFee ? parseFloat(entryFee) : null,
      handicap_percentage: parseInt(handicapPercentage),
      is_active: isActive,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      router.refresh();
    }
  };

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-[#003d2a] border border-[#004d35] shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#004d35]">
          <h2 className="text-lg font-semibold text-[#e8f5f0]">Edit League</h2>
          <button onClick={() => setIsOpen(false)} className="text-[#a8d4c0] hover:text-[#e8f5f0]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
              League Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] placeholder:text-[#a8d4c0]/50 focus:border-[#c9a962] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek ?? ''}
                onChange={(e) => setDayOfWeek(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
              >
                <option value="">Not set</option>
                {daysOfWeek.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Max Players
              </label>
              <Input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="Unlimited"
                min={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Entry Fee ($)
              </label>
              <Input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder="Free"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
              Handicap Percentage
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={handicapPercentage}
                onChange={(e) => setHandicapPercentage(e.target.value)}
                min={0}
                max={100}
                className="max-w-[100px]"
              />
              <span className="text-[#a8d4c0]">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962]"
            />
            <label htmlFor="isActive" className="text-sm text-[#e8f5f0]">
              League is active
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
