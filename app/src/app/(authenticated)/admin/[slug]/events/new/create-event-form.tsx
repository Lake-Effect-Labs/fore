'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createEvent } from '@/lib/actions/events';
import type { Facility, EventFormat, EventSettings } from '@/types/b2b';
import { Calendar, Clock, MapPin, DollarSign, Mail, Settings, Zap } from 'lucide-react';

interface CreateEventFormProps {
  organizationId: string;
  organizationSlug: string;
  facilities: Facility[];
}

const formats = [
  { value: 'scramble', label: 'Scramble', description: 'Team best shot' },
  { value: 'best_ball', label: 'Best Ball', description: 'Best individual score' },
  { value: 'shamble', label: 'Shamble', description: 'Best drive, then own ball' },
  { value: 'stroke_play', label: 'Stroke Play', description: 'Individual total' },
  { value: 'stableford', label: 'Stableford', description: 'Points-based' },
  { value: 'match_play', label: 'Match Play', description: 'Hole by hole' },
];

const teamSizes = [
  { value: 1, label: 'Individual' },
  { value: 2, label: 'Pairs (2)' },
  { value: 3, label: 'Threesomes (3)' },
  { value: 4, label: 'Foursomes (4)' },
];

export function CreateEventForm({
  organizationId,
  organizationSlug,
  facilities,
}: CreateEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mode: quick (organizer configures) or full (admin configures everything)
  const [mode, setMode] = useState<'quick' | 'full'>('quick');

  // Basic Info (both modes)
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || '');
  const [courseFee, setCourseFee] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');

  // Full mode settings
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<EventFormat>('scramble');
  const [teamSize, setTeamSize] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [shotgunStart, setShotgunStart] = useState(true);
  const [prizePool, setPrizePool] = useState('');

  // Handicaps
  const [useHandicaps, setUseHandicaps] = useState(true);
  const [handicapAllowance, setHandicapAllowance] = useState('100');
  const [maxHandicap, setMaxHandicap] = useState('36');
  const [scoringType, setScoringType] = useState<'net' | 'gross' | 'both'>('net');

  // Flights
  const [useFlights, setUseFlights] = useState(false);
  const [flightCount, setFlightCount] = useState('2');

  // Competition extras
  const [trackSkins, setTrackSkins] = useState(false);
  const [skinsValue, setSkinsValue] = useState('');
  const [trackCtp, setTrackCtp] = useState(false);
  const [trackLongDrive, setTrackLongDrive] = useState(false);

  // Mulligans
  const [allowMulligans, setAllowMulligans] = useState(false);
  const [mulliganPrice, setMulliganPrice] = useState('');
  const [maxMulligans, setMaxMulligans] = useState('2');

  // Inclusions
  const [includesFood, setIncludesFood] = useState(false);
  const [includesCart, setIncludesCart] = useState(true);
  const [includesRange, setIncludesRange] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!eventDate) {
      setError('Please select an event date');
      return;
    }

    setIsLoading(true);

    // Build settings object for full mode
    const settings: EventSettings = mode === 'full' ? {
      scoring_type: scoringType,
      use_handicaps: useHandicaps,
      handicap_allowance: useHandicaps ? parseInt(handicapAllowance) : undefined,
      max_handicap: useHandicaps ? parseInt(maxHandicap) : undefined,
      team_format: format as EventSettings['team_format'],
      use_flights: useFlights,
      flight_count: useFlights ? parseInt(flightCount) : undefined,
      track_skins: trackSkins,
      skins_value: trackSkins && skinsValue ? parseFloat(skinsValue) : undefined,
      track_closest_to_pin: trackCtp,
      track_long_drive: trackLongDrive,
      allow_mulligans: allowMulligans,
      mulligan_price: allowMulligans && mulliganPrice ? parseFloat(mulliganPrice) : undefined,
      max_mulligans: allowMulligans ? parseInt(maxMulligans) : undefined,
      includes_food: includesFood,
      includes_cart: includesCart,
      includes_range: includesRange,
    } : {};

    const result = await createEvent({
      organization_id: organizationId,
      facility_id: facilityId || undefined,
      event_date: eventDate,
      start_time: startTime || undefined,
      course_fee: courseFee ? parseFloat(courseFee) : undefined,
      organizer_email: organizerEmail || undefined,
      // Quick mode: minimal settings, organizer configures rest
      // Full mode: admin configures everything
      name: mode === 'full' && name ? name : undefined,
      description: mode === 'full' && description ? description : undefined,
      format: mode === 'full' ? format : 'scramble',
      team_size: mode === 'full' ? teamSize : 4,
      max_players: mode === 'full' && maxPlayers ? parseInt(maxPlayers) : undefined,
      entry_fee: mode === 'full' && entryFee ? parseFloat(entryFee) : undefined,
      shotgun_start: mode === 'full' ? shotgunStart : true,
      prize_pool: mode === 'full' && prizePool ? parseFloat(prizePool) : undefined,
      handicap_percentage: mode === 'full' && useHandicaps ? parseInt(handicapAllowance) : 100,
      flights_enabled: mode === 'full' ? useFlights : false,
      settings: mode === 'full' ? settings : {},
      organizer_can_configure: mode === 'quick',
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.event) {
      router.push(`/admin/${organizationSlug}/events/${result.event.id}`);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0] mb-4">How much do you want to configure?</h3>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                mode === 'quick'
                  ? 'border-[#c9a962] bg-[#004d35]'
                  : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className={`h-5 w-5 ${mode === 'quick' ? 'text-[#c9a962]' : 'text-[#a8d4c0]'}`} />
                <span className={`font-medium ${mode === 'quick' ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                  Quick Setup
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#a8d4c0]">
                Set date, time & fee. Let the event organizer configure everything else.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                mode === 'full'
                  ? 'border-[#c9a962] bg-[#004d35]'
                  : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Settings className={`h-5 w-5 ${mode === 'full' ? 'text-[#c9a962]' : 'text-[#a8d4c0]'}`} />
                <span className={`font-medium ${mode === 'full' ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                  Full Configuration
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#a8d4c0]">
                Configure all event settings yourself including format, prizes, and rules.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Date, Time & Location */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Date & Location</h3>

          <div className="grid gap-3 sm:gap-4 grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962]" />
                Event Date *
              </label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={today}
                required
                className="text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962]" />
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {facilities.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962]" />
                Course
              </label>
              <select
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} ({facility.holes} holes)
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fees */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Fees</h3>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962]" />
                Course Fee (per player)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="75.00"
                value={courseFee}
                onChange={(e) => setCourseFee(e.target.value)}
                className="text-sm"
              />
              <p className="mt-1 text-[10px] sm:text-xs text-[#a8d4c0]">
                What the course charges per player
              </p>
            </div>

            {mode === 'full' && (
              <div>
                <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                  Entry Fee (per player)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="text-sm"
                />
                <p className="mt-1 text-[10px] sm:text-xs text-[#a8d4c0]">
                  What players pay to participate
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organizer */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Event Organizer</h3>

          <div>
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#c9a962]" />
              Organizer Email
            </label>
            <Input
              type="email"
              placeholder="organizer@company.com"
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              className="text-sm"
            />
            <p className="mt-1 text-[10px] sm:text-xs text-[#a8d4c0]">
              {mode === 'quick'
                ? "This person will configure and manage the event details, registrations, and groups."
                : "This person will manage registrations and groups. You can also assign later."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Full Mode Settings */}
      {mode === 'full' && (
        <>
          {/* Basic Event Info */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Event Details</h3>

              <div>
                <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                  Event Name
                </label>
                <Input
                  placeholder="Annual Company Golf Outing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                  Description
                </label>
                <textarea
                  placeholder="Tell players about the event..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] placeholder:text-[#a8d4c0]/50 focus:border-[#c9a962] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                  Max Players
                </label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Format */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Game Format</h3>

              <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value as EventFormat)}
                    className={`rounded-lg border-2 p-2.5 sm:p-3 text-left transition-all ${
                      format === f.value
                        ? 'border-[#c9a962] bg-[#004d35]'
                        : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
                    }`}
                  >
                    <p className={`font-medium text-xs sm:text-sm ${format === f.value ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                      {f.label}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-[#a8d4c0] line-clamp-1">{f.description}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 pt-2">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                    Team Size
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                    value={teamSize}
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                  >
                    {teamSizes.map((ts) => (
                      <option key={ts.value} value={ts.value}>{ts.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] flex-1">
                    <input
                      type="checkbox"
                      checked={shotgunStart}
                      onChange={(e) => setShotgunStart(e.target.checked)}
                      className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                    />
                    <div>
                      <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Shotgun Start</p>
                      <p className="text-[10px] text-[#a8d4c0]">All groups start at once</p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Handicaps & Scoring */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Handicaps & Scoring</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useHandicaps}
                    onChange={(e) => setUseHandicaps(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <span className="text-xs sm:text-sm text-[#a8d4c0]">Use Handicaps</span>
                </label>
              </div>

              {useHandicaps && (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                      Scoring Type
                    </label>
                    <select
                      className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                      value={scoringType}
                      onChange={(e) => setScoringType(e.target.value as 'net' | 'gross' | 'both')}
                    >
                      <option value="net">Net Only</option>
                      <option value="gross">Gross Only</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                      Handicap %
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={handicapAllowance}
                        onChange={(e) => setHandicapAllowance(e.target.value)}
                        min={0}
                        max={100}
                        className="text-sm"
                      />
                      <span className="text-[#a8d4c0] text-sm">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                      Max Handicap
                    </label>
                    <Input
                      type="number"
                      value={maxHandicap}
                      onChange={(e) => setMaxHandicap(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {!useHandicaps && (
                <p className="text-xs sm:text-sm text-[#a8d4c0]">
                  Gross scoring only - no handicaps applied.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Flights */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Flights / Divisions</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useFlights}
                    onChange={(e) => setUseFlights(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <span className="text-xs sm:text-sm text-[#a8d4c0]">Enable</span>
                </label>
              </div>

              {useFlights && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                    Number of Flights
                  </label>
                  <Input
                    type="number"
                    value={flightCount}
                    onChange={(e) => setFlightCount(e.target.value)}
                    min={2}
                    max={10}
                    className="max-w-[120px] text-sm"
                  />
                </div>
              )}

              {!useFlights && (
                <p className="text-xs sm:text-sm text-[#a8d4c0]">
                  All players compete in a single group.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Prizes */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Prizes</h3>

              <div>
                <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                  Prize Pool ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  className="max-w-[150px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Competition Extras */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Competition Extras</h3>

              <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
                <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={trackSkins}
                    onChange={(e) => setTrackSkins(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Skins</p>
                    <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Side game</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={trackCtp}
                    onChange={(e) => setTrackCtp(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">CTP</p>
                    <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Closest to pin</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={trackLongDrive}
                    onChange={(e) => setTrackLongDrive(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Long Drive</p>
                    <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Longest drive</p>
                  </div>
                </label>
              </div>

              {trackSkins && (
                <div className="pt-2">
                  <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                    Skins Value ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5.00"
                    value={skinsValue}
                    onChange={(e) => setSkinsValue(e.target.value)}
                    className="max-w-[120px] text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mulligans */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Mulligans</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMulligans}
                    onChange={(e) => setAllowMulligans(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <span className="text-xs sm:text-sm text-[#a8d4c0]">Allow</span>
                </label>
              </div>

              {allowMulligans && (
                <div className="grid gap-3 sm:gap-4 grid-cols-2">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                      Price Each ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      value={mulliganPrice}
                      onChange={(e) => setMulliganPrice(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1 block">
                      Max Per Player
                    </label>
                    <Input
                      type="number"
                      value={maxMulligans}
                      onChange={(e) => setMaxMulligans(e.target.value)}
                      min={1}
                      max={10}
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              {!allowMulligans && (
                <p className="text-xs sm:text-sm text-[#a8d4c0]">
                  No mulligans - play it as it lies.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Inclusions */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">What&apos;s Included</h3>

              <div className="grid gap-2 sm:gap-3 grid-cols-3">
                <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={includesCart}
                    onChange={(e) => setIncludesCart(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <span className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Cart</span>
                </label>

                <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={includesFood}
                    onChange={(e) => setIncludesFood(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <span className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Food</span>
                </label>

                <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
                  <input
                    type="checkbox"
                    checked={includesRange}
                    onChange={(e) => setIncludesRange(e.target.checked)}
                    className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
                  />
                  <span className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Range</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-xs sm:text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto order-1 sm:order-none">
          Create Event
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  );
}
