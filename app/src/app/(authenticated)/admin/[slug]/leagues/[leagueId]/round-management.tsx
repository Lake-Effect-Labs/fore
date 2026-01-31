'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createRound } from '@/lib/actions/leagues';
import type { Round, Facility } from '@/types/b2b';
import { Calendar, Clock, Plus, X, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface RoundManagementProps {
  seasonId: string;
  rounds: Round[];
  facilities: Facility[];
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  pending: 'secondary',
  active: 'success',
  completed: 'default',
  cancelled: 'destructive',
};

export function RoundManagement({ seasonId, rounds, facilities }: RoundManagementProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Single round form state
  const [roundNumber, setRoundNumber] = useState((rounds.length + 1).toString());
  const [scheduledDate, setScheduledDate] = useState('');
  const [teeTime, setTeeTime] = useState('');
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || '');

  // Bulk generation state
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkWeeks, setBulkWeeks] = useState('16');
  const [bulkDayOfWeek, setBulkDayOfWeek] = useState('4'); // Thursday default
  const [bulkTeeTime, setBulkTeeTime] = useState('17:00');
  const [bulkFacilityId, setBulkFacilityId] = useState(facilities[0]?.id || '');
  const [bulkProgress, setBulkProgress] = useState(0);

  const upcomingRounds = rounds
    .filter((r) => new Date(r.scheduled_date) >= new Date() && r.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  const pastRounds = rounds
    .filter((r) => new Date(r.scheduled_date) < new Date() || r.status === 'completed')
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!scheduledDate) {
      setError('Please select a date');
      return;
    }

    setIsLoading(true);

    const result = await createRound(
      seasonId,
      parseInt(roundNumber),
      scheduledDate,
      facilityId || undefined,
      teeTime || undefined
    );

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setShowCreateForm(false);
      setRoundNumber((rounds.length + 2).toString());
      setScheduledDate('');
      setTeeTime('');
      router.refresh();
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bulkStartDate) {
      setError('Please select a start date');
      return;
    }

    const numWeeks = parseInt(bulkWeeks);
    if (numWeeks < 1 || numWeeks > 52) {
      setError('Please enter between 1 and 52 weeks');
      return;
    }

    setIsLoading(true);
    setBulkProgress(0);

    // Calculate all the dates
    const startDate = new Date(bulkStartDate);
    const targetDay = parseInt(bulkDayOfWeek);
    
    // Find the first occurrence of the target day on or after start date
    const currentDate = new Date(startDate);
    const currentDay = currentDate.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    currentDate.setDate(currentDate.getDate() + daysUntilTarget);

    let successCount = 0;
    let errorMessage = '';

    for (let week = 0; week < numWeeks; week++) {
      const roundDate = new Date(currentDate);
      roundDate.setDate(roundDate.getDate() + (week * 7));
      
      const dateStr = roundDate.toISOString().split('T')[0];
      const roundNum = rounds.length + week + 1;

      const result = await createRound(
        seasonId,
        roundNum,
        dateStr,
        bulkFacilityId || undefined,
        bulkTeeTime || undefined
      );

      if (result.error) {
        errorMessage = result.error;
        break;
      }
      
      successCount++;
      setBulkProgress(Math.round(((week + 1) / numWeeks) * 100));
    }

    setIsLoading(false);
    setBulkProgress(0);

    if (errorMessage) {
      setError(`Created ${successCount} rounds, then failed: ${errorMessage}`);
    } else {
      setShowBulkForm(false);
      setBulkStartDate('');
      router.refresh();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left"
          >
            <Calendar className="h-5 w-5 text-[#c9a962]" />
            <CardTitle className="text-base sm:text-lg">
              Rounds ({rounds.length})
            </CardTitle>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#a8d4c0]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#a8d4c0]" />
            )}
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBulkForm(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Generate
            </Button>
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {rounds.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-10 w-10 text-[#004d35] mb-3" />
              <p className="text-sm text-[#a8d4c0]">
                No rounds scheduled yet. Add rounds to start tracking league play.
              </p>
            </div>
          ) : (
            <>
              {/* Upcoming Rounds */}
              {upcomingRounds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#e8f5f0] mb-2">Upcoming</h4>
                  <div className="space-y-2">
                    {upcomingRounds.map((round) => (
                      <div
                        key={round.id}
                        className="flex items-center justify-between rounded-lg border border-[#004d35] p-3 hover:bg-[#002418] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d35] text-sm font-medium text-[#c9a962]">
                            {round.round_number}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#e8f5f0]">
                              {formatDate(round.scheduled_date)}
                            </p>
                            {round.tee_time && (
                              <p className="text-xs text-[#a8d4c0] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(round.tee_time)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={statusColors[round.status] || 'secondary'}>
                          {round.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Rounds */}
              {pastRounds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#a8d4c0] mb-2">Past</h4>
                  <div className="space-y-2">
                    {pastRounds.slice(0, 5).map((round) => (
                      <div
                        key={round.id}
                        className="flex items-center justify-between rounded-lg border border-[#004d35] p-3 opacity-75"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#002418] text-sm font-medium text-[#a8d4c0]">
                            {round.round_number}
                          </div>
                          <p className="text-sm text-[#a8d4c0]">
                            {formatDate(round.scheduled_date)}
                          </p>
                        </div>
                        <Badge variant={statusColors[round.status] || 'secondary'}>
                          {round.status}
                        </Badge>
                      </div>
                    ))}
                    {pastRounds.length > 5 && (
                      <p className="text-xs text-[#a8d4c0] text-center">
                        + {pastRounds.length - 5} more rounds
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}

      {/* Create Round Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#003d2a] border border-[#004d35] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#004d35]">
              <h2 className="text-lg font-semibold text-[#e8f5f0]">Schedule Round</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-[#a8d4c0] hover:text-[#e8f5f0]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                  Round Number *
                </label>
                <Input
                  type="number"
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(e.target.value)}
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                  Date *
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                  Tee Time
                </label>
                <Input
                  type="time"
                  value={teeTime}
                  onChange={(e) => setTeeTime(e.target.value)}
                />
              </div>

              {facilities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                    Course
                  </label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                  >
                    <option value="">Select course...</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  Schedule Round
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#003d2a] border border-[#004d35] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#004d35]">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#c9a962]" />
                <h2 className="text-lg font-semibold text-[#e8f5f0]">Generate Rounds</h2>
              </div>
              <button
                onClick={() => setShowBulkForm(false)}
                className="text-[#a8d4c0] hover:text-[#e8f5f0]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBulkGenerate} className="p-4 space-y-4">
              <p className="text-sm text-[#a8d4c0]">
                Automatically schedule multiple weeks of rounds at once.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                    Start Week *
                  </label>
                  <Input
                    type="date"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                    # of Weeks *
                  </label>
                  <Input
                    type="number"
                    value={bulkWeeks}
                    onChange={(e) => setBulkWeeks(e.target.value)}
                    min={1}
                    max={52}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={bulkDayOfWeek}
                    onChange={(e) => setBulkDayOfWeek(e.target.value)}
                    className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                  >
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                    Tee Time
                  </label>
                  <Input
                    type="time"
                    value={bulkTeeTime}
                    onChange={(e) => setBulkTeeTime(e.target.value)}
                  />
                </div>
              </div>

              {facilities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#e8f5f0] mb-1">
                    Course
                  </label>
                  <select
                    value={bulkFacilityId}
                    onChange={(e) => setBulkFacilityId(e.target.value)}
                    className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                  >
                    <option value="">Select course...</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {bulkProgress > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-[#a8d4c0] mb-1">
                    <span>Creating rounds...</span>
                    <span>{bulkProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#002418] overflow-hidden">
                    <div 
                      className="h-full bg-[#c9a962] transition-all duration-300"
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  <Zap className="mr-2 h-4 w-4" />
                  Generate {bulkWeeks} Rounds
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBulkForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
