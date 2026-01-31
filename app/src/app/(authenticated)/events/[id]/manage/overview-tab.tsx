'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event, EventRegistration } from '@/types/b2b';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Share2,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { openEventRegistration, closeEventRegistration } from '@/lib/actions/events';
import { useState } from 'react';

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

interface OverviewTabProps {
  event: Event & {
    organization?: { name: string; slug: string };
    facility?: { id: string; name: string; holes: number };
  };
  eventUrl: string | null;
  registrations: (EventRegistration & {
    profile: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
      handicap: number | null;
    };
  })[];
  groups: Group[];
  onTabChange: (tab: string) => void;
}

export function OverviewTab({
  event,
  eventUrl,
  registrations,
  groups,
  onTabChange,
}: OverviewTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeRegistrations = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  );
  const paidCount = activeRegistrations.filter((r) => r.payment_status === 'paid').length;
  const unpaidCount = activeRegistrations.filter((r) => r.payment_status === 'pending').length;
  const ungroupedCount = activeRegistrations.filter((r) => !r.group_number).length;
  const unassignedGroups = groups.filter((g) => !g.startingHole && g.groupNumber > 0).length;

  const handleOpenRegistration = async () => {
    setIsLoading(true);
    await openEventRegistration(event.id);
    setIsLoading(false);
    router.refresh();
  };

  const handleCloseRegistration = async () => {
    setIsLoading(true);
    await closeEventRegistration(event.id);
    setIsLoading(false);
    router.refresh();
  };

  const copyLink = async () => {
    if (eventUrl) {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate checklist items
  const checklist = [
    {
      id: 'name',
      label: 'Set event name',
      done: event.name !== 'New Event',
      action: () => onTabChange('settings'),
    },
    {
      id: 'slug',
      label: 'Create shareable URL',
      done: !!event.slug,
      action: () => onTabChange('settings'),
    },
    {
      id: 'registration',
      label: 'Open registration',
      done: event.status === 'open' || event.status === 'closed',
      action: handleOpenRegistration,
    },
    {
      id: 'players',
      label: 'Get players registered',
      done: activeRegistrations.length > 0,
      action: () => onTabChange('share'),
    },
    {
      id: 'groups',
      label: 'Assign players to groups',
      done: ungroupedCount === 0 && activeRegistrations.length > 0,
      action: () => onTabChange('players'),
    },
    ...(event.shotgun_start
      ? [
          {
            id: 'holes',
            label: 'Assign groups to starting holes',
            done: unassignedGroups === 0 && groups.length > 0,
            action: () => onTabChange('groups'),
          },
        ]
      : []),
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#004d35] p-2">
                <Calendar className="h-5 w-5 text-[#c9a962]" />
              </div>
              <div>
                <p className="text-xs text-[#a8d4c0]">Date</p>
                <p className="text-sm font-medium text-[#e8f5f0]">
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#004d35] p-2">
                  <Clock className="h-5 w-5 text-[#c9a962]" />
                </div>
                <div>
                  <p className="text-xs text-[#a8d4c0]">Start Time</p>
                  <p className="text-sm font-medium text-[#e8f5f0]">{event.start_time}</p>
                </div>
              </div>
            )}
            {event.facility && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#004d35] p-2">
                  <MapPin className="h-5 w-5 text-[#c9a962]" />
                </div>
                <div>
                  <p className="text-xs text-[#a8d4c0]">Course</p>
                  <p className="text-sm font-medium text-[#e8f5f0]">{event.facility.name}</p>
                </div>
              </div>
            )}
            {event.entry_fee && (
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#004d35] p-2">
                  <DollarSign className="h-5 w-5 text-[#c9a962]" />
                </div>
                <div>
                  <p className="text-xs text-[#a8d4c0]">Entry Fee</p>
                  <p className="text-sm font-medium text-[#e8f5f0]">${event.entry_fee}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Share Link */}
      {eventUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ExternalLink className="h-4 w-4 text-[#a8d4c0] flex-shrink-0" />
                <span className="text-sm text-[#a8d4c0]">Event URL:</span>
                <code className="rounded bg-[#002418] px-2 py-1 text-sm text-[#e8f5f0] truncate">
                  {eventUrl}
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onTabChange('share')}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Setup Progress</CardTitle>
            <span className="text-sm text-[#a8d4c0]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#004d35] overflow-hidden">
            <div
              className="h-full bg-[#c9a962] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                  item.done ? 'bg-[#002418]' : 'bg-[#002418]/50 hover:bg-[#002418]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[#a8d4c0]" />
                  )}
                  <span
                    className={`text-sm ${
                      item.done ? 'text-[#a8d4c0] line-through' : 'text-[#e8f5f0]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {!item.done && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={item.action}
                    disabled={isLoading}
                    className="text-[#c9a962] hover:text-[#e8f5f0]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Registration Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e8f5f0]">Registration</p>
                <p className="text-xs text-[#a8d4c0]">
                  {event.status === 'open'
                    ? 'Players can sign up'
                    : event.status === 'draft'
                    ? 'Not yet open'
                    : 'Closed'}
                </p>
              </div>
              {event.status === 'draft' ? (
                <Button size="sm" onClick={handleOpenRegistration} disabled={isLoading}>
                  Open
                </Button>
              ) : event.status === 'open' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseRegistration}
                  disabled={isLoading}
                >
                  Close
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="cursor-pointer hover:border-[#006747]" onClick={() => onTabChange('players')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e8f5f0]">Payments</p>
                <p className="text-xs text-[#a8d4c0]">
                  {paidCount} paid, {unpaidCount} pending
                </p>
              </div>
              {unpaidCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-400">
                  {unpaidCount} unpaid
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Check-in */}
        <Card className="cursor-pointer hover:border-[#006747]" onClick={() => onTabChange('checkin')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#e8f5f0]">Check-in</p>
                <p className="text-xs text-[#a8d4c0]">
                  Ready for event day
                </p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-[#c9a962]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {ungroupedCount > 0 && (
        <Card className="border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400">
                  {ungroupedCount} {ungroupedCount === 1 ? 'player needs' : 'players need'} group assignment
                </p>
                <p className="text-xs text-[#a8d4c0] mt-1">
                  Assign players to groups so they know who they&apos;re playing with.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onTabChange('players')}>
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {event.shotgun_start && unassignedGroups > 0 && (
        <Card className="border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400">
                  {unassignedGroups} {unassignedGroups === 1 ? 'group needs' : 'groups need'} starting hole assignment
                </p>
                <p className="text-xs text-[#a8d4c0] mt-1">
                  Assign groups to starting holes for the shotgun start.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onTabChange('groups')}>
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
