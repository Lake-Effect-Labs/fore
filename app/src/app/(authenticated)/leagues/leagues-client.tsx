'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { joinLeague } from '@/lib/actions';
import {
  Search,
  Trophy,
  ChevronRight,
  Users,
  Calendar,
  Loader2,
  Check,
  UserPlus,
} from 'lucide-react';
import type { League } from '@/types/b2b';

type LeagueWithDetails = League & {
  organization?: { name: string; slug?: string };
  activeSeason?: { id: string; name: string };
};

interface LeaguesClientProps {
  publicLeagues: LeagueWithDetails[];
  myLeagues: LeagueWithDetails[];
}

const dayLabels: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const formatLabels: Record<string, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  stableford: 'Stableford',
  skins: 'Skins',
};

export function LeaguesClient({ publicLeagues, myLeagues }: LeaguesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [joiningSeasonId, setJoiningSeasonId] = useState<string | null>(null);
  const [joinedSeasonIds, setJoinedSeasonIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Get IDs of leagues user is already in
  const myLeagueIds = useMemo(
    () => new Set(myLeagues.map((l) => l.id)),
    [myLeagues]
  );

  // Filter available leagues (ones user hasn't joined)
  const availableLeagues = useMemo(
    () => publicLeagues.filter((l) => !myLeagueIds.has(l.id)),
    [publicLeagues, myLeagueIds]
  );

  // Filter by search
  const filteredMyLeagues = useMemo(() => {
    if (!search.trim()) return myLeagues;
    const query = search.toLowerCase();
    return myLeagues.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.organization?.name?.toLowerCase().includes(query)
    );
  }, [myLeagues, search]);

  const filteredAvailableLeagues = useMemo(() => {
    if (!search.trim()) return availableLeagues;
    const query = search.toLowerCase();
    return availableLeagues.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.organization?.name?.toLowerCase().includes(query)
    );
  }, [availableLeagues, search]);

  const handleJoin = (seasonId: string) => {
    setError('');
    setJoiningSeasonId(seasonId);
    startTransition(async () => {
      const result = await joinLeague(seasonId);
      if (result.error) {
        setError(result.error);
      } else {
        setJoinedSeasonIds((prev) => new Set([...prev, seasonId]));
        router.refresh();
      }
      setJoiningSeasonId(null);
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#e8f5f0]">Leagues</h1>
        <p className="text-[#a8d4c0]">Find and join golf leagues</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a8d4c0]" />
        <Input
          placeholder="Search leagues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* My Leagues */}
      {filteredMyLeagues.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
            <Trophy className="h-5 w-5 text-[#c9a962]" />
            My Leagues
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMyLeagues.map((league) => (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <Card className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#e8f5f0] truncate">
                          {league.name}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {league.organization?.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {league.format && (
                            <Badge variant="secondary" className="text-xs">
                              {formatLabels[league.format] || league.format}
                            </Badge>
                          )}
                          {league.day_of_week !== null && league.day_of_week !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="mr-1 h-3 w-3" />
                              {dayLabels[league.day_of_week]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#a8d4c0] flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Available Leagues */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e8f5f0]">
          <Users className="h-5 w-5 text-[#c9a962]" />
          Available Leagues
        </h2>
        {filteredAvailableLeagues.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAvailableLeagues.map((league) => {
              const seasonId = league.activeSeason?.id;
              const isJoining = joiningSeasonId === seasonId;
              const hasJoined = seasonId && joinedSeasonIds.has(seasonId);

              return (
                <Card key={league.id} className="transition-all hover:border-[#c9a962]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#e8f5f0] truncate">
                          {league.name}
                        </h3>
                        <p className="text-sm text-[#a8d4c0]">
                          {league.organization?.name}
                        </p>
                        {league.description && (
                          <p className="mt-1 text-sm text-[#a8d4c0] line-clamp-2">
                            {league.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {league.format && (
                            <Badge variant="secondary" className="text-xs">
                              {formatLabels[league.format] || league.format}
                            </Badge>
                          )}
                          {league.day_of_week !== null && league.day_of_week !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="mr-1 h-3 w-3" />
                              {dayLabels[league.day_of_week]}
                            </Badge>
                          )}
                          {league.entry_fee && (
                            <Badge variant="outline" className="text-xs">
                              ${league.entry_fee}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      {seasonId ? (
                        hasJoined ? (
                          <Button variant="outline" size="sm" disabled className="w-full">
                            <Check className="mr-2 h-4 w-4 text-emerald-500" />
                            Joined
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleJoin(seasonId)}
                            disabled={isPending}
                            className="w-full"
                          >
                            {isJoining ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="mr-2 h-4 w-4" />
                            )}
                            Join League
                          </Button>
                        )
                      ) : (
                        <Button variant="outline" size="sm" disabled className="w-full">
                          No Active Season
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#004d35]">
                <Trophy className="h-6 w-6 text-[#c9a962]" />
              </div>
              <p className="mt-4 text-center text-[#a8d4c0]">
                {search
                  ? 'No leagues match your search'
                  : 'No available leagues at the moment'}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
