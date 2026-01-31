'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Event, EventRegistration } from '@/types/b2b';
import {
  Settings,
  Users,
  Grid3X3,
  Share2,
  ClipboardCheck,
  LayoutDashboard,
} from 'lucide-react';
import { OrganizerSettings } from './organizer-settings';
import { RegistrationList } from './registration-list';
import { ShotgunGrid } from './shotgun-grid';
import { ShareInvite } from './share-invite';
import { CheckInList } from './check-in-list';
import { OverviewTab } from './overview-tab';

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

interface ManageTabsProps {
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
  initialTab: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'groups', label: 'Groups', icon: Grid3X3 },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'checkin', label: 'Check-in', icon: ClipboardCheck },
];

export function ManageTabs({
  event,
  eventUrl,
  registrations,
  groups,
  initialTab,
}: ManageTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const confirmedCount = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-[#004d35]">
        <nav className="flex gap-1 overflow-x-auto pb-px scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            // Hide groups tab if not shotgun start
            if (tab.id === 'groups' && !event.shotgun_start) {
              return null;
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#c9a962] text-[#c9a962]'
                    : 'border-transparent text-[#a8d4c0] hover:text-[#e8f5f0] hover:border-[#006747]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab
            event={event}
            eventUrl={eventUrl}
            registrations={registrations}
            groups={groups}
            onTabChange={handleTabChange}
          />
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
              <CardDescription>
                Update event details, set registration deadline, and manage visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizerSettings event={event} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'players' && (
          <Card>
            <CardHeader>
              <CardTitle>Registrations ({confirmedCount})</CardTitle>
              <CardDescription>
                View registered players, mark payments, and manage groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationList
                eventId={event.id}
                registrations={registrations}
                teamSize={event.team_size}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'groups' && event.shotgun_start && (
          <Card>
            <CardHeader>
              <CardTitle>Shotgun Start</CardTitle>
              <CardDescription>
                Assign groups to starting holes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShotgunGrid
                eventId={event.id}
                groups={groups}
                holes={event.facility?.holes || 18}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'share' && (
          <ShareInvite
            event={event}
            eventUrl={eventUrl}
            registrations={registrations}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckInList
            eventId={event.id}
            registrations={registrations}
            groups={groups}
          />
        )}
      </div>
    </div>
  );
}
