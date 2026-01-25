'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { EventRegistration } from '@/types/b2b';
import {
  Search,
  CheckCircle,
  Circle,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import { checkInRegistration } from '@/lib/actions/events';

interface Group {
  groupNumber: number;
  startingHole: number | null;
  players: {
    id: string;
    name: string;
    handicap: number | null;
    paymentStatus: string;
  }[];
}

interface CheckInListProps {
  eventId: string;
  registrations: (EventRegistration & {
    profile: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
      handicap: number | null;
    } | null;
  })[];
  groups: Group[];
}

export function CheckInList({ eventId, registrations, groups }: CheckInListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'not_checked_in' | 'unpaid'>('all');

  const activeRegistrations = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  );

  // Helper to get display name and email
  const getPlayerInfo = (r: typeof activeRegistrations[0]) => ({
    name: r.profile?.full_name || r.guest_name || r.profile?.email || r.guest_email || 'Unknown',
    email: r.profile?.email || r.guest_email || '',
    isGuest: !r.user_id,
  });

  // Filter registrations
  let filteredRegistrations = activeRegistrations.filter((r) => {
    const info = getPlayerInfo(r);
    const query = searchQuery.toLowerCase();
    return info.name.toLowerCase().includes(query) || info.email.toLowerCase().includes(query);
  });

  if (filter === 'checked_in') {
    filteredRegistrations = filteredRegistrations.filter((r) => r.checked_in);
  } else if (filter === 'not_checked_in') {
    filteredRegistrations = filteredRegistrations.filter((r) => !r.checked_in);
  } else if (filter === 'unpaid') {
    filteredRegistrations = filteredRegistrations.filter((r) => r.payment_status !== 'paid');
  }

  // Sort by group number, then by name
  filteredRegistrations.sort((a, b) => {
    const groupA = a.group_number || 999;
    const groupB = b.group_number || 999;
    if (groupA !== groupB) return groupA - groupB;
    const nameA = getPlayerInfo(a).name;
    const nameB = getPlayerInfo(b).name;
    return nameA.localeCompare(nameB);
  });

  const checkedInCount = activeRegistrations.filter((r) => r.checked_in).length;
  const unpaidCount = activeRegistrations.filter((r) => r.payment_status !== 'paid').length;

  const handleCheckIn = async (registrationId: string, currentlyCheckedIn: boolean) => {
    setLoadingId(registrationId);
    await checkInRegistration(registrationId, !currentlyCheckedIn);
    setLoadingId(null);
    router.refresh();
  };

  // Group registrations by group for grouped view
  const groupedRegistrations = new Map<number, typeof filteredRegistrations>();
  for (const reg of filteredRegistrations) {
    const groupNum = reg.group_number || 0;
    if (!groupedRegistrations.has(groupNum)) {
      groupedRegistrations.set(groupNum, []);
    }
    groupedRegistrations.get(groupNum)!.push(reg);
  }

  const renderPlayer = (reg: typeof activeRegistrations[0]) => {
    const isCheckedIn = reg.checked_in;
    const isLoading = loadingId === reg.id;
    const info = getPlayerInfo(reg);
    const handicap = reg.profile?.handicap ?? reg.handicap_at_registration;

    return (
      <div
        key={reg.id}
        className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
          isCheckedIn
            ? 'border-green-800 bg-green-900/20'
            : 'border-[#004d35] hover:border-[#006747]'
        } ${isLoading ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCheckIn(reg.id, isCheckedIn)}
            disabled={isLoading}
            className={`rounded-full p-1 transition-colors ${
              isCheckedIn
                ? 'text-green-400 hover:text-green-300'
                : 'text-[#004d35] hover:text-[#c9a962]'
            }`}
          >
            {isCheckedIn ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </button>
          <Avatar
            src={reg.profile?.avatar_url}
            name={info.name}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${isCheckedIn ? 'text-green-400' : 'text-[#e8f5f0]'}`}>
                {info.name}
              </p>
              {info.isGuest && (
                <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400">
                  <UserX className="h-3 w-3 mr-1" />
                  Guest
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#a8d4c0]">
              {handicap !== null ? `HCP: ${handicap}` : 'No handicap'}
              {reg.group_number && ` • Group ${reg.group_number}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reg.payment_status !== 'paid' && (
            <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-400 text-xs">
              Unpaid
            </Badge>
          )}
          {reg.starting_hole && (
            <Badge variant="secondary" className="text-xs">
              Hole {reg.starting_hole}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Check-in Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold text-[#c9a962]">{activeRegistrations.length}</p>
            <p className="text-xs text-[#a8d4c0]">Expected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold text-green-400">{checkedInCount}</p>
            <p className="text-xs text-[#a8d4c0]">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold text-[#a8d4c0]">
              {activeRegistrations.length - checkedInCount}
            </p>
            <p className="text-xs text-[#a8d4c0]">Remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className={`text-xl font-bold ${unpaidCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {unpaidCount}
            </p>
            <p className="text-xs text-[#a8d4c0]">Unpaid</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#a8d4c0]">Check-in Progress</span>
            <span className="text-sm font-medium text-[#e8f5f0]">
              {checkedInCount}/{activeRegistrations.length} (
              {activeRegistrations.length > 0
                ? Math.round((checkedInCount / activeRegistrations.length) * 100)
                : 0}
              %)
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#004d35] overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${
                  activeRegistrations.length > 0
                    ? (checkedInCount / activeRegistrations.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8d4c0]" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'not_checked_in' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('not_checked_in')}
              >
                <Circle className="h-3 w-3 mr-1" />
                Not Checked In
              </Button>
              <Button
                variant={filter === 'checked_in' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('checked_in')}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Checked In
              </Button>
              <Button
                variant={filter === 'unpaid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unpaid')}
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Unpaid
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#c9a962]" />
            Players ({filteredRegistrations.length})
          </CardTitle>
          <CardDescription>
            Tap the circle to check in players as they arrive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-[#a8d4c0]">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No players match your search</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedRegistrations.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([groupNum, members]) => (
                  <div key={groupNum}>
                    {groupNum > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">Group {groupNum}</Badge>
                        {members[0]?.starting_hole && (
                          <span className="text-xs text-[#a8d4c0]">
                            Starting hole {members[0].starting_hole}
                          </span>
                        )}
                        <span className="text-xs text-[#a8d4c0]">
                          ({members.filter((m) => m.checked_in).length}/{members.length} checked in)
                        </span>
                      </div>
                    )}
                    {groupNum === 0 && groupedRegistrations.size > 1 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">Ungrouped</Badge>
                      </div>
                    )}
                    <div className="space-y-2">
                      {members.map(renderPlayer)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Alert */}
      {unpaidCount > 0 && (
        <Card className="border-yellow-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400">
                  {unpaidCount} {unpaidCount === 1 ? 'player has' : 'players have'} not paid
                </p>
                <p className="text-xs text-[#a8d4c0] mt-1">
                  Collect payment before checking them in
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
