'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createEvent, getOrganization, getOrganizationFacilities } from '@/lib/actions';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { Facility } from '@/types/b2b';

export default function NewEventPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [orgId, setOrgId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [format, setFormat] = useState('stroke_play');
  const [facilityId, setFacilityId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [teamSize, setTeamSize] = useState('1');
  const [handicapPercentage, setHandicapPercentage] = useState('100');
  const [flightsEnabled, setFlightsEnabled] = useState(false);
  const [shotgunStart, setShotgunStart] = useState(false);

  useEffect(() => {
    async function loadData() {
      const org = await getOrganization(slug);
      if (org) {
        setOrgId(org.id);
        const facs = await getOrganizationFacilities(org.id);
        setFacilities(facs);
        if (facs.length > 0) {
          setFacilityId(facs[0].id);
        }
      }
    }
    loadData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setError('');
    setIsLoading(true);

    const result = await createEvent({
      organization_id: orgId,
      name,
      description: description || undefined,
      event_date: eventDate,
      start_time: startTime || undefined,
      format: format as any,
      facility_id: facilityId || undefined,
      max_players: maxPlayers ? parseInt(maxPlayers) : undefined,
      entry_fee: entryFee ? parseFloat(entryFee) : undefined,
      team_size: parseInt(teamSize),
      handicap_percentage: parseInt(handicapPercentage),
      flights_enabled: flightsEnabled,
      shotgun_start: shotgunStart,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.event) {
      router.push(`/org/${slug}/events/${result.event.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}/events`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Create New Event</h1>
        <p className="mt-2 text-slate-600">
          Set up a tournament, outing, or special golf event.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Configure your event settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Event Name *
              </label>
              <Input
                className="mt-2"
                placeholder="Summer Championship"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
                placeholder="Annual club championship tournament..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Event Date *
                </label>
                <Input
                  className="mt-2"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Start Time
                </label>
                <Input
                  className="mt-2"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Format *
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="stroke_play">Stroke Play</option>
                  <option value="match_play">Match Play</option>
                  <option value="stableford">Stableford</option>
                  <option value="best_ball">Best Ball</option>
                  <option value="scramble">Scramble</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Team Size
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                >
                  <option value="1">Individual</option>
                  <option value="2">2-Person Teams</option>
                  <option value="4">4-Person Teams</option>
                </select>
              </div>
            </div>

            {facilities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Course
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                >
                  <option value="">Select a course</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Max Players
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="72"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Entry Fee ($)
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.01"
                  placeholder="75.00"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Handicap %
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="100"
                  value={handicapPercentage}
                  onChange={(e) => setHandicapPercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={shotgunStart}
                  onChange={(e) => setShotgunStart(e.target.checked)}
                />
                <span className="text-sm text-slate-700">Shotgun Start</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={flightsEnabled}
                  onChange={(e) => setFlightsEnabled(e.target.checked)}
                />
                <span className="text-sm text-slate-700">Enable Flights (divide players by handicap)</span>
              </label>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Event
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
