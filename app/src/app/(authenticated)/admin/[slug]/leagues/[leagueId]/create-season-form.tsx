'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSeason } from '@/lib/actions/leagues';
import { Plus, X } from 'lucide-react';

interface CreateSeasonFormProps {
  leagueId: string;
}

export function CreateSeasonForm({ leagueId }: CreateSeasonFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Generate default season name based on current date
  const getDefaultSeasonName = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    if (month >= 2 && month <= 4) return `Spring ${year}`;
    if (month >= 5 && month <= 7) return `Summer ${year}`;
    if (month >= 8 && month <= 10) return `Fall ${year}`;
    return `Winter ${year}`;
  };

  const handleOpen = () => {
    setName(getDefaultSeasonName());
    // Set default dates to 16 weeks from today
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 16 * 7); // 16 weeks
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !startDate || !endDate) {
      setError('Please fill in all fields');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsLoading(true);

    const result = await createSeason(leagueId, name, startDate, endDate);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      setName('');
      setStartDate('');
      setEndDate('');
      router.refresh();
    }
  };

  if (!isOpen) {
    return (
      <Button size="sm" onClick={handleOpen}>
        <Plus className="mr-2 h-4 w-4" />
        New Season
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-[#003d2a] border border-[#004d35] shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#004d35]">
          <h2 className="text-lg font-semibold text-[#e8f5f0]">Create New Season</h2>
          <button onClick={() => setIsOpen(false)} className="text-[#a8d4c0] hover:text-[#e8f5f0]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
              Season Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer 2024"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                End Date *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          <p className="text-xs text-[#a8d4c0]">
            The season will be set as active immediately. Players can then register.
          </p>

          {error && (
            <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Create Season
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
