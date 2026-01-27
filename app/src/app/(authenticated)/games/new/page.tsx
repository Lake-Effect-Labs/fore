'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { createGame, getFriends, searchUsers } from '@/lib/actions';
import type { GameFormat, Profile } from '@/types/database';
import { ArrowLeft, ArrowRight, Check, Search, X, Users } from 'lucide-react';
import { useEffect } from 'react';
import type { FriendWithProfile } from '@/lib/actions/friends';

type Step = 'format' | 'config' | 'players' | 'review';

const formats: { id: GameFormat; name: string; description: string; players: string }[] = [
  {
    id: 'wolf',
    name: 'Wolf',
    description: 'Rotating wolf picks a partner or goes alone. High risk, high reward.',
    players: '4 players',
  },
  {
    id: 'skins',
    name: 'Skins',
    description: 'Win the hole outright, win the skin. Ties carry over.',
    players: '2-4 players',
  },
  {
    id: 'nassau',
    name: 'Nassau',
    description: 'Three bets: front 9, back 9, and overall.',
    players: '2-4 players',
  },
  {
    id: 'best_ball',
    name: 'Best Ball',
    description: 'Teams of 2. Best score on each hole counts for your team.',
    players: '4 players (2v2)',
  },
  {
    id: 'bingo_bango_bongo',
    name: 'Bingo Bango Bongo',
    description: '3 points per hole: first on green, closest to pin, first in hole.',
    players: '2-4 players',
  },
  {
    id: 'match_play',
    name: 'Match Play',
    description: 'Head-to-head, hole by hole. Win or halve each hole.',
    players: '2 players',
  },
];

export default function NewGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('format');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [format, setFormat] = useState<GameFormat | null>(null);
  const [holes, setHoles] = useState<9 | 18>(18);
  const [courseName, setCourseName] = useState('');

  // Config state
  const [skinValue, setSkinValue] = useState('5');
  const [carryOver, setCarryOver] = useState(true);
  const [frontNineBet, setFrontNineBet] = useState('5');
  const [backNineBet, setBackNineBet] = useState('5');
  const [overallBet, setOverallBet] = useState('5');
  const [matchBet, setMatchBet] = useState('10');
  // Wolf config
  const [wolfValue, setWolfValue] = useState('1');
  const [loneWolfMultiplier, setLoneWolfMultiplier] = useState('2');
  const [blindWolfMultiplier, setBlindWolfMultiplier] = useState('3');
  // Best Ball config
  const [bestBallBet, setBestBallBet] = useState('10');
  // Bingo Bango Bongo config
  const [bingoValue, setBingoValue] = useState('1');
  const [bangoValue, setBangoValue] = useState('1');
  const [bongoValue, setBongoValue] = useState('1');

  // Players state
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Profile[]>([]);

  useEffect(() => {
    getFriends()
      .then(setFriends)
      .catch(() => {
        // Friends list failed to load - user can still search
      });
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchUsers(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addPlayer = (profile: Profile) => {
    if (!selectedPlayers.find((p) => p.id === profile.id)) {
      setSelectedPlayers([...selectedPlayers, profile]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removePlayer = (id: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!format) return;

    setIsLoading(true);
    setError('');

    const config: Record<string, number | boolean | null> = {};

    if (format === 'skins') {
      config.skin_value = parseFloat(skinValue) || 5;
      config.carry_over = carryOver;
    } else if (format === 'nassau') {
      config.front_nine_bet = parseFloat(frontNineBet) || 5;
      config.back_nine_bet = parseFloat(backNineBet) || 5;
      config.overall_bet = parseFloat(overallBet) || 5;
    } else if (format === 'match_play') {
      config.match_bet = parseFloat(matchBet) || 10;
    } else if (format === 'wolf') {
      config.wolf_value = parseFloat(wolfValue) || 1;
      config.lone_wolf_multiplier = parseFloat(loneWolfMultiplier) || 2;
      config.blind_wolf_multiplier = parseFloat(blindWolfMultiplier) || 3;
    } else if (format === 'best_ball') {
      config.best_ball_bet = parseFloat(bestBallBet) || 10;
    } else if (format === 'bingo_bango_bongo') {
      config.bingo_value = parseFloat(bingoValue) || 1;
      config.bango_value = parseFloat(bangoValue) || 1;
      config.bongo_value = parseFloat(bongoValue) || 1;
    }

    const result = await createGame({
      format,
      holes,
      course_name: courseName || undefined,
      player_ids: selectedPlayers.map((p) => p.id),
      config,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.gameId) {
      router.push(`/games/${result.gameId}`);
    }
  };

  const canProceed = () => {
    if (step === 'format') return format !== null;
    if (step === 'config') return true;
    if (step === 'players') {
      if (format === 'match_play') return selectedPlayers.length === 1;
      if (format === 'wolf' || format === 'best_ball') return selectedPlayers.length === 3; // 4 players total including you
      return selectedPlayers.length >= 1;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 'format') setStep('config');
    else if (step === 'config') setStep('players');
    else if (step === 'players') setStep('review');
  };

  const prevStep = () => {
    if (step === 'config') setStep('format');
    else if (step === 'players') setStep('config');
    else if (step === 'review') setStep('players');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/games"
          className="inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#e8f5f0]">New Game</h1>
      </div>

      {/* Progress */}
      <div className="mb-8 flex items-center justify-between">
        {['format', 'config', 'players', 'review'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-[#c9a962] text-[#002418]'
                  : ['format', 'config', 'players', 'review'].indexOf(step) > i
                  ? 'bg-[#004d35] text-[#c9a962]'
                  : 'bg-[#003d2a] text-[#a8d4c0]'
              }`}
            >
              {['format', 'config', 'players', 'review'].indexOf(step) > i ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && (
              <div
                className={`h-0.5 w-12 sm:w-20 ${
                  ['format', 'config', 'players', 'review'].indexOf(step) > i
                    ? 'bg-[#c9a962]'
                    : 'bg-[#004d35]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'format' && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Game Format</CardTitle>
            <CardDescription>What type of game do you want to play?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formats.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  format === f.id
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : 'border-[#004d35] hover:border-[#006747]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#e8f5f0]">{f.name}</span>
                  <span className="text-xs text-[#a8d4c0] bg-[#002418] px-2 py-0.5 rounded-full">
                    {f.players}
                  </span>
                </div>
                <div className="text-sm text-[#a8d4c0] mt-1">{f.description}</div>
              </button>
            ))}

            <div className="pt-4">
              <label className="text-sm font-medium text-[#e8f5f0]">
                Number of Holes
              </label>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setHoles(9)}
                  className={`flex-1 rounded-lg border-2 py-3 font-medium transition-colors ${
                    holes === 9
                      ? 'border-[#c9a962] bg-[#004d35] text-[#c9a962]'
                      : 'border-[#004d35] text-[#a8d4c0] hover:border-[#006747]'
                  }`}
                >
                  9 Holes
                </button>
                <button
                  type="button"
                  onClick={() => setHoles(18)}
                  className={`flex-1 rounded-lg border-2 py-3 font-medium transition-colors ${
                    holes === 18
                      ? 'border-[#c9a962] bg-[#004d35] text-[#c9a962]'
                      : 'border-[#004d35] text-[#a8d4c0] hover:border-[#006747]'
                  }`}
                >
                  18 Holes
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'config' && (
        <Card>
          <CardHeader>
            <CardTitle>Set the Stakes</CardTitle>
            <CardDescription>Configure your game settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-[#e8f5f0]">
                Course Name (optional)
              </label>
              <Input
                className="mt-2"
                placeholder="e.g., Pebble Beach"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>

            {format === 'skins' && (
              <>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Value per Skin ($)
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    step="1"
                    value={skinValue}
                    onChange={(e) => setSkinValue(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="carryOver"
                    checked={carryOver}
                    onChange={(e) => setCarryOver(e.target.checked)}
                    className="h-4 w-4 rounded border-[#004d35] bg-[#002418] text-[#c9a962] focus:ring-[#c9a962]"
                  />
                  <label htmlFor="carryOver" className="text-sm text-[#a8d4c0]">
                    Carry over ties to next hole
                  </label>
                </div>
              </>
            )}

            {format === 'nassau' && (
              <>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Front 9 Bet ($)
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    step="1"
                    value={frontNineBet}
                    onChange={(e) => setFrontNineBet(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Back 9 Bet ($)
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    step="1"
                    value={backNineBet}
                    onChange={(e) => setBackNineBet(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Overall Bet ($)
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    step="1"
                    value={overallBet}
                    onChange={(e) => setOverallBet(e.target.value)}
                  />
                </div>
              </>
            )}

            {format === 'match_play' && (
              <div>
                <label className="text-sm font-medium text-[#e8f5f0]">
                  Match Bet ($)
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  min="1"
                  step="1"
                  value={matchBet}
                  onChange={(e) => setMatchBet(e.target.value)}
                />
              </div>
            )}

            {format === 'wolf' && (
              <>
                <div className="rounded-lg bg-[#002418] p-3 text-sm text-[#a8d4c0]">
                  <p className="font-medium text-[#e8f5f0] mb-1">How Wolf Works:</p>
                  <p>Each hole, one player is the &quot;wolf&quot; (rotates). After watching tee shots, the wolf picks a partner or goes alone. Wolf team vs. the other 2 players.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Value per Point ($)
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={wolfValue}
                    onChange={(e) => setWolfValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Lone Wolf Multiplier
                  </label>
                  <p className="text-xs text-[#a8d4c0] mb-2">When wolf goes alone against all 3</p>
                  <div className="flex gap-2">
                    {['2', '3', '4'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setLoneWolfMultiplier(m)}
                        className={`flex-1 rounded-lg border-2 py-2 font-medium transition-colors ${
                          loneWolfMultiplier === m
                            ? 'border-[#c9a962] bg-[#004d35] text-[#c9a962]'
                            : 'border-[#004d35] text-[#a8d4c0] hover:border-[#006747]'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Blind Wolf Multiplier
                  </label>
                  <p className="text-xs text-[#a8d4c0] mb-2">When wolf declares alone before seeing any shots</p>
                  <div className="flex gap-2">
                    {['3', '4', '5'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBlindWolfMultiplier(m)}
                        className={`flex-1 rounded-lg border-2 py-2 font-medium transition-colors ${
                          blindWolfMultiplier === m
                            ? 'border-[#c9a962] bg-[#004d35] text-[#c9a962]'
                            : 'border-[#004d35] text-[#a8d4c0] hover:border-[#006747]'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {format === 'best_ball' && (
              <>
                <div className="rounded-lg bg-[#002418] p-3 text-sm text-[#a8d4c0]">
                  <p className="font-medium text-[#e8f5f0] mb-1">How Best Ball Works:</p>
                  <p>Teams of 2. Each player plays their own ball. The best score on each hole counts for your team.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#e8f5f0]">
                    Team Bet ($)
                  </label>
                  <Input
                    className="mt-2"
                    type="number"
                    min="1"
                    step="1"
                    value={bestBallBet}
                    onChange={(e) => setBestBallBet(e.target.value)}
                  />
                  <p className="text-xs text-[#a8d4c0] mt-1">Winning team takes this from each opponent</p>
                </div>
              </>
            )}

            {format === 'bingo_bango_bongo' && (
              <>
                <div className="rounded-lg bg-[#002418] p-3 text-sm text-[#a8d4c0]">
                  <p className="font-medium text-[#e8f5f0] mb-1">How Bingo Bango Bongo Works:</p>
                  <p>3 points per hole. <strong>Bingo:</strong> first on green. <strong>Bango:</strong> closest to pin when all balls are on. <strong>Bongo:</strong> first in the hole.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[#e8f5f0]">
                      Bingo ($)
                    </label>
                    <Input
                      className="mt-2"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={bingoValue}
                      onChange={(e) => setBingoValue(e.target.value)}
                    />
                    <p className="text-xs text-[#a8d4c0] mt-1">1st on green</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#e8f5f0]">
                      Bango ($)
                    </label>
                    <Input
                      className="mt-2"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={bangoValue}
                      onChange={(e) => setBangoValue(e.target.value)}
                    />
                    <p className="text-xs text-[#a8d4c0] mt-1">Closest to pin</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#e8f5f0]">
                      Bongo ($)
                    </label>
                    <Input
                      className="mt-2"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={bongoValue}
                      onChange={(e) => setBongoValue(e.target.value)}
                    />
                    <p className="text-xs text-[#a8d4c0] mt-1">1st in hole</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'players' && (
        <Card>
          <CardHeader>
            <CardTitle>Add Players</CardTitle>
            <CardDescription>
              {format === 'match_play'
                ? 'Add 1 opponent for your match'
                : format === 'wolf' || format === 'best_ball'
                ? 'Add 3 players (4 total including you)'
                : 'Add friends to your game'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8d4c0]" />
              <Input
                className="pl-10"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#004d35] bg-[#003d2a] shadow-lg">
                  {searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => addPlayer(profile)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[#004d35]"
                    >
                      <Avatar
                        src={profile.avatar_url}
                        name={profile.full_name || profile.email}
                        size="sm"
                      />
                      <div className="text-left">
                        <div className="font-medium text-[#e8f5f0]">
                          {profile.full_name || profile.display_name || 'Golfer'}
                        </div>
                        <div className="text-sm text-[#a8d4c0]">{profile.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Players */}
            {selectedPlayers.length > 0 && (
              <div>
                <label className="text-sm font-medium text-[#e8f5f0]">
                  Selected Players
                </label>
                <div className="mt-2 space-y-2">
                  {selectedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={player.avatar_url}
                          name={player.full_name || player.email}
                          size="sm"
                        />
                        <span className="font-medium text-[#e8f5f0]">
                          {player.full_name || player.display_name || player.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlayer(player.id)}
                        className="text-[#a8d4c0] hover:text-red-400"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends Quick Add */}
            {friends.length > 0 && (
              <div>
                <label className="text-sm font-medium text-[#e8f5f0]">
                  Quick Add Friends
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {friends
                    .filter((f) => !selectedPlayers.find((p) => p.id === f.friend.id))
                    .slice(0, 6)
                    .map((friend) => (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => addPlayer(friend.friend)}
                        className="flex items-center gap-2 rounded-full border border-[#004d35] px-3 py-1.5 text-sm text-[#a8d4c0] hover:border-[#c9a962] hover:bg-[#004d35]"
                      >
                        <Avatar
                          src={friend.friend.avatar_url}
                          name={friend.friend.full_name || friend.friend.email}
                          size="sm"
                        />
                        <span>
                          {friend.friend.display_name || friend.friend.full_name || 'Friend'}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Create</CardTitle>
            <CardDescription>Make sure everything looks right</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-[#002418] p-4 border border-[#004d35]">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-[#a8d4c0]">Format</span>
                  <span className="font-medium text-[#e8f5f0]">
                    {formats.find((f) => f.id === format)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a8d4c0]">Holes</span>
                  <span className="font-medium text-[#e8f5f0]">{holes}</span>
                </div>
                {courseName && (
                  <div className="flex justify-between">
                    <span className="text-[#a8d4c0]">Course</span>
                    <span className="font-medium text-[#e8f5f0]">{courseName}</span>
                  </div>
                )}
                {format === 'skins' && (
                  <div className="flex justify-between">
                    <span className="text-[#a8d4c0]">Per Skin</span>
                    <span className="font-medium text-[#c9a962]">${skinValue}</span>
                  </div>
                )}
                {format === 'nassau' && (
                  <div className="flex justify-between">
                    <span className="text-[#a8d4c0]">Bets</span>
                    <span className="font-medium text-[#c9a962]">
                      ${frontNineBet} / ${backNineBet} / ${overallBet}
                    </span>
                  </div>
                )}
                {format === 'match_play' && (
                  <div className="flex justify-between">
                    <span className="text-[#a8d4c0]">Match Bet</span>
                    <span className="font-medium text-[#c9a962]">${matchBet}</span>
                  </div>
                )}
                {format === 'wolf' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#a8d4c0]">Per Point</span>
                      <span className="font-medium text-[#c9a962]">${wolfValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#a8d4c0]">Lone Wolf</span>
                      <span className="font-medium text-[#e8f5f0]">{loneWolfMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#a8d4c0]">Blind Wolf</span>
                      <span className="font-medium text-[#e8f5f0]">{blindWolfMultiplier}x</span>
                    </div>
                  </>
                )}
                {format === 'best_ball' && (
                  <div className="flex justify-between">
                    <span className="text-[#a8d4c0]">Team Bet</span>
                    <span className="font-medium text-[#c9a962]">${bestBallBet}</span>
                  </div>
                )}
                {format === 'bingo_bango_bongo' && (
                  <div className="flex justify-between">
                    <span className="text-[#a8d4c0]">Points</span>
                    <span className="font-medium text-[#c9a962]">
                      ${bingoValue} / ${bangoValue} / ${bongoValue}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#e8f5f0]">
                Players ({selectedPlayers.length + 1} including you)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#a8d4c0]" />
                <span className="text-[#a8d4c0]">
                  You
                  {selectedPlayers.length > 0 && (
                    <>
                      {' + '}
                      {selectedPlayers
                        .map((p) => p.display_name || p.full_name || 'Player')
                        .join(', ')}
                    </>
                  )}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        {step !== 'format' ? (
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step !== 'review' ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Create Game
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
