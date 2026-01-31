'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createLeague } from '@/lib/actions/leagues';
import type { LeagueSettings, EventFormat } from '@/types/b2b';

interface CreateLeagueFormProps {
  organizationId: string;
  slug: string;
}

const leagueTypes = [
  { value: 'weekly', label: 'Weekly', description: 'Recurring weekly play' },
  { value: 'seasonal', label: 'Seasonal', description: 'Multi-week season' },
  { value: 'tournament', label: 'Tournament', description: 'Single/multi-round' },
];

const formats = [
  { value: 'stroke_play', label: 'Stroke Play', description: 'Total strokes count' },
  { value: 'match_play', label: 'Match Play', description: 'Hole-by-hole competition' },
  { value: 'stableford', label: 'Stableford', description: 'Points-based scoring' },
  { value: 'scramble', label: 'Scramble', description: 'Team best ball each shot' },
  { value: 'best_ball', label: 'Best Ball', description: 'Best score from team' },
  { value: 'shamble', label: 'Shamble', description: 'Best drive, then individual' },
];

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const handicapModes = [
  {
    value: 'none',
    label: 'No Handicaps',
    description: 'Gross scores only'
  },
  {
    value: 'user_entered',
    label: 'User Entered',
    description: 'Players enter own handicap'
  },
  {
    value: 'established',
    label: 'Established',
    description: 'Use GHIN/existing index'
  },
  {
    value: 'league_rounds',
    label: 'League Rounds',
    description: 'First X rounds set handicap'
  },
];

const scoringTypes = [
  { value: 'net', label: 'Net Only', description: 'Handicap-adjusted' },
  { value: 'gross', label: 'Gross Only', description: 'Raw scores' },
  { value: 'both', label: 'Both', description: 'Track both' },
];

const teamFormats = [
  { value: 'individual', label: 'Individual', description: 'No teams' },
  { value: 'fixed', label: 'Fixed Teams', description: 'Same all season' },
  { value: 'blind_draw', label: 'Blind Draw', description: 'Random each week' },
  { value: 'abcd', label: 'ABCD Draw', description: 'Balanced by skill' },
];

const pointsSystems = [
  { value: 'none', label: 'No Points', description: 'Stroke totals only' },
  { value: 'weekly', label: 'Weekly Points', description: 'Points for finish' },
  { value: 'match', label: 'Match Points', description: 'Head-to-head' },
  { value: 'quota', label: 'Quota Points', description: 'vs personal quota' },
];

export function CreateLeagueForm({ organizationId, slug }: CreateLeagueFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leagueType, setLeagueType] = useState('weekly');
  const [format, setFormat] = useState('stroke_play');

  // Schedule
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [numberOfWeeks, setNumberOfWeeks] = useState('16');
  const [holesPerRound, setHolesPerRound] = useState('9');

  // Players & Teams
  const [maxPlayers, setMaxPlayers] = useState('');
  const [teamFormat, setTeamFormat] = useState('individual');
  const [playersPerTeam, setPlayersPerTeam] = useState('2');

  // Divisions / Flights
  const [useDivisions, setUseDivisions] = useState(false);
  const [numberOfDivisions, setNumberOfDivisions] = useState('2');
  const [playersPerDivision, setPlayersPerDivision] = useState('20');
  const [divisionType, setDivisionType] = useState<'handicap' | 'random' | 'manual'>('handicap');

  // Handicaps
  const [handicapMode, setHandicapMode] = useState('user_entered');
  const [handicapRounds, setHandicapRounds] = useState('2');
  const [handicapPercentage, setHandicapPercentage] = useState('100');
  const [maxHandicap, setMaxHandicap] = useState('36');

  // Scoring
  const [scoringType, setScoringType] = useState('net');
  const [pointsSystem, setPointsSystem] = useState('weekly');
  const [dropWorstRounds, setDropWorstRounds] = useState('0');

  // Fees & Prizes
  const [entryFee, setEntryFee] = useState('');
  const [weeklyFee, setWeeklyFee] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [payoutPlaces, setPayoutPlaces] = useState('3');

  // Additional Options
  const [allowSubs, setAllowSubs] = useState(true);
  const [trackSkins, setTrackSkins] = useState(false);
  const [skinValue, setSkinValue] = useState('');
  const [trackClosestToPin, setTrackClosestToPin] = useState(false);
  const [trackLongDrive, setTrackLongDrive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Build settings object
    const settings: LeagueSettings = {
      handicap_mode: handicapMode as LeagueSettings['handicap_mode'],
      handicap_rounds: handicapMode === 'league_rounds' ? parseInt(handicapRounds) : null,
      max_handicap: parseInt(maxHandicap),
      scoring_type: scoringType as LeagueSettings['scoring_type'],
      points_system: pointsSystem as LeagueSettings['points_system'],
      team_format: teamFormat as LeagueSettings['team_format'],
      players_per_team: teamFormat !== 'individual' ? parseInt(playersPerTeam) : null,
      use_divisions: useDivisions,
      number_of_divisions: useDivisions ? parseInt(numberOfDivisions) : null,
      players_per_division: useDivisions ? parseInt(playersPerDivision) : null,
      division_type: useDivisions ? divisionType : null,
      number_of_weeks: parseInt(numberOfWeeks),
      holes_per_round: parseInt(holesPerRound),
      drop_worst_rounds: parseInt(dropWorstRounds),
      allow_subs: allowSubs,
      track_skins: trackSkins,
      skin_value: trackSkins && skinValue ? parseFloat(skinValue) : null,
      track_closest_to_pin: trackClosestToPin,
      track_long_drive: trackLongDrive,
      weekly_fee: weeklyFee ? parseFloat(weeklyFee) : null,
      prize_pool: prizePool ? parseFloat(prizePool) : null,
      payout_places: parseInt(payoutPlaces),
    };

    const result = await createLeague({
      organization_id: organizationId,
      name,
      description: description || undefined,
      league_type: leagueType as 'weekly' | 'seasonal' | 'tournament',
      format: format as EventFormat,
      day_of_week: dayOfWeek ?? undefined,
      start_time: startTime || undefined,
      max_players: maxPlayers ? parseInt(maxPlayers) : undefined,
      entry_fee: entryFee ? parseFloat(entryFee) : undefined,
      handicap_percentage: handicapPercentage ? parseInt(handicapPercentage) : 100,
      settings,
    });

    setIsLoading(false);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      router.push(`/admin/${slug}/leagues`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Basic Info */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Basic Information</h3>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
              League Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Thursday Night Men's League"
              required
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the league..."
              rows={3}
              className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm sm:text-base text-[#e8f5f0] placeholder:text-[#a8d4c0]/50 focus:border-[#c9a962] focus:outline-none"
            />
          </div>

          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
            {leagueTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setLeagueType(type.value)}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  leagueType === type.value
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
                }`}
              >
                <p className={`font-medium text-sm sm:text-base ${leagueType === type.value ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                  {type.label}
                </p>
                <p className="mt-0.5 text-[10px] sm:text-xs text-[#a8d4c0]">{type.description}</p>
              </button>
            ))}
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
                onClick={() => setFormat(f.value)}
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
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Schedule</h3>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek ?? ''}
                onChange={(e) => setDayOfWeek(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
              >
                <option value="">Select...</option>
                {daysOfWeek.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                # of Weeks
              </label>
              <Input
                type="number"
                value={numberOfWeeks}
                onChange={(e) => setNumberOfWeeks(e.target.value)}
                min={1}
                max={52}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Holes/Round
              </label>
              <select
                value={holesPerRound}
                onChange={(e) => setHolesPerRound(e.target.value)}
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
              >
                <option value="9">9 Holes</option>
                <option value="18">18 Holes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players & Teams */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Players & Teams</h3>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Max Players
              </label>
              <Input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="Unlimited"
                min={2}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Team Format
              </label>
              <select
                value={teamFormat}
                onChange={(e) => setTeamFormat(e.target.value)}
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
              >
                {teamFormats.map((tf) => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>

            {teamFormat !== 'individual' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                  Players/Team
                </label>
                <select
                  value={playersPerTeam}
                  onChange={(e) => setPlayersPerTeam(e.target.value)}
                  className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Divisions */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Divisions / Flights</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useDivisions}
                onChange={(e) => setUseDivisions(e.target.checked)}
                className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4"
              />
              <span className="text-xs sm:text-sm text-[#a8d4c0]">Enable</span>
            </label>
          </div>

          {useDivisions && (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                  # of Divisions
                </label>
                <Input
                  type="number"
                  value={numberOfDivisions}
                  onChange={(e) => setNumberOfDivisions(e.target.value)}
                  min={2}
                  max={10}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                  Players/Division
                </label>
                <Input
                  type="number"
                  value={playersPerDivision}
                  onChange={(e) => setPlayersPerDivision(e.target.value)}
                  min={4}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                  Assignment
                </label>
                <select
                  value={divisionType}
                  onChange={(e) => setDivisionType(e.target.value as 'handicap' | 'random' | 'manual')}
                  className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                >
                  <option value="handicap">By Handicap</option>
                  <option value="random">Random</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          )}

          {!useDivisions && (
            <p className="text-xs sm:text-sm text-[#a8d4c0]">
              All players compete in a single group.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Handicaps */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Handicap Settings</h3>

          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
            {handicapModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setHandicapMode(mode.value)}
                className={`rounded-lg border-2 p-2.5 sm:p-3 text-left transition-all ${
                  handicapMode === mode.value
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
                }`}
              >
                <p className={`font-medium text-xs sm:text-sm ${handicapMode === mode.value ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                  {mode.label}
                </p>
                <p className="mt-0.5 text-[10px] sm:text-xs text-[#a8d4c0] line-clamp-1">{mode.description}</p>
              </button>
            ))}
          </div>

          {handicapMode !== 'none' && (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 pt-2">
              {handicapMode === 'league_rounds' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                    Handicap Rounds
                  </label>
                  <Input
                    type="number"
                    value={handicapRounds}
                    onChange={(e) => setHandicapRounds(e.target.value)}
                    min={1}
                    max={5}
                    className="text-sm"
                  />
                  <p className="mt-1 text-[10px] sm:text-xs text-[#a8d4c0]">
                    First X rounds establish handicap
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                  Handicap %
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={handicapPercentage}
                    onChange={(e) => setHandicapPercentage(e.target.value)}
                    min={0}
                    max={100}
                    className="text-sm"
                  />
                  <span className="text-[#a8d4c0] text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                  Max Handicap
                </label>
                <Input
                  type="number"
                  value={maxHandicap}
                  onChange={(e) => setMaxHandicap(e.target.value)}
                  min={0}
                  max={54}
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring & Points */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Scoring & Points</h3>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Scoring Type
              </label>
              <select
                value={scoringType}
                onChange={(e) => setScoringType(e.target.value)}
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
              >
                {scoringTypes.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Points System
              </label>
              <select
                value={pointsSystem}
                onChange={(e) => setPointsSystem(e.target.value)}
                className="w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
              >
                {pointsSystems.map((ps) => (
                  <option key={ps.value} value={ps.value}>{ps.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Drop Worst
              </label>
              <Input
                type="number"
                value={dropWorstRounds}
                onChange={(e) => setDropWorstRounds(e.target.value)}
                min={0}
                max={5}
                className="text-sm"
              />
              <p className="mt-1 text-[10px] sm:text-xs text-[#a8d4c0]">
                Rounds to exclude
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees & Prizes */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Fees & Prizes</h3>

          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Season Fee ($)
              </label>
              <Input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                placeholder="0"
                min={0}
                step={0.01}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Weekly Fee ($)
              </label>
              <Input
                type="number"
                value={weeklyFee}
                onChange={(e) => setWeeklyFee(e.target.value)}
                placeholder="0"
                min={0}
                step={0.01}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Prize Pool ($)
              </label>
              <Input
                type="number"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="0"
                min={0}
                step={0.01}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Payout Places
              </label>
              <Input
                type="number"
                value={payoutPlaces}
                onChange={(e) => setPayoutPlaces(e.target.value)}
                min={1}
                max={10}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Options */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-sm sm:text-base text-[#e8f5f0]">Additional Options</h3>

          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
            <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
              <input
                type="checkbox"
                checked={allowSubs}
                onChange={(e) => setAllowSubs(e.target.checked)}
                className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Subs</p>
                <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Allow substitutes</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
              <input
                type="checkbox"
                checked={trackSkins}
                onChange={(e) => setTrackSkins(e.target.checked)}
                className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Skins</p>
                <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Track skins game</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
              <input
                type="checkbox"
                checked={trackClosestToPin}
                onChange={(e) => setTrackClosestToPin(e.target.checked)}
                className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">CTP</p>
                <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Closest to pin</p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-[#004d35] cursor-pointer hover:bg-[#003d2a] active:scale-[0.98]">
              <input
                type="checkbox"
                checked={trackLongDrive}
                onChange={(e) => setTrackLongDrive(e.target.checked)}
                className="rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962] h-4 w-4 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm text-[#e8f5f0]">Long Drive</p>
                <p className="text-[10px] text-[#a8d4c0] hidden sm:block">Track longest</p>
              </div>
            </label>
          </div>

          {trackSkins && (
            <div className="pt-2">
              <label className="block text-xs sm:text-sm font-medium text-[#e8f5f0] mb-1">
                Skin Value ($)
              </label>
              <Input
                type="number"
                value={skinValue}
                onChange={(e) => setSkinValue(e.target.value)}
                placeholder="5.00"
                min={0}
                step={0.01}
                className="max-w-[150px] text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-xs sm:text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto order-1 sm:order-none">
          Create League
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  );
}
