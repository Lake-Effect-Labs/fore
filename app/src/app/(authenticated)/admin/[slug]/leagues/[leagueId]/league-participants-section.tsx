'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Users, UserPlus, Search, Mail, MoreVertical } from 'lucide-react';

interface Participant {
  id: string;
  user_id: string;
  handicap_at_start: number | null;
  is_active: boolean;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    handicap: number | null;
  };
}

interface LeagueParticipantsSectionProps {
  seasonId: string | null;
  participants: Participant[];
  leagueName: string;
}

export function LeagueParticipantsSection({
  seasonId,
  participants,
  leagueName,
}: LeagueParticipantsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const filteredParticipants = participants.filter((p) => {
    const name = p.profile.full_name?.toLowerCase() || '';
    const email = p.profile.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  const activeCount = participants.filter((p) => p.is_active).length;

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c9a962]" />
              <CardTitle className="text-base sm:text-lg">
                Participants ({activeCount})
              </CardTitle>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8d4c0]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 rounded-lg border border-[#004d35] bg-[#002418] pl-9 pr-3 py-2 text-sm text-[#e8f5f0] placeholder:text-[#a8d4c0]/50 focus:border-[#c9a962] focus:outline-none"
                />
              </div>
              {seasonId && (
                <Button size="sm" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {!seasonId ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-10 w-10 text-[#004d35] mb-3" />
              <p className="text-sm text-[#a8d4c0]">
                Create a season first to manage participants.
              </p>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-10 w-10 text-[#004d35] mb-3" />
              <p className="text-sm text-[#a8d4c0] mb-4">
                No participants yet. Invite players to join the league.
              </p>
              <Button size="sm" variant="outline" onClick={() => setShowInviteModal(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Invitations
              </Button>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#a8d4c0]">
                No participants match your search.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3 hover:bg-[#002418] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={participant.profile.avatar_url}
                      name={participant.profile.full_name || participant.profile.email}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-sm text-[#e8f5f0]">
                        {participant.profile.full_name || participant.profile.email}
                      </p>
                      {participant.profile.full_name && (
                        <p className="text-xs text-[#a8d4c0]">{participant.profile.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-[#e8f5f0]">
                        {participant.handicap_at_start !== null
                          ? `${participant.handicap_at_start} HCP`
                          : 'No HCP'}
                      </p>
                      <Badge
                        variant={participant.is_active ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {participant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <button className="p-1 text-[#a8d4c0] hover:text-[#e8f5f0]">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal (placeholder) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#003d2a] border border-[#004d35] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#004d35]">
              <h2 className="text-lg font-semibold text-[#e8f5f0]">Invite Players</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-[#a8d4c0] hover:text-[#e8f5f0]"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-[#a8d4c0]">
                Share this link with players to invite them to join <strong>{leagueName}</strong>:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/leagues/join/${seasonId}`}
                  className="flex-1 rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0]"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/leagues/join/${seasonId}`
                    );
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="border-t border-[#004d35] pt-4">
                <p className="text-xs text-[#a8d4c0] mb-3">Or invite via email:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="player@email.com"
                    className="flex-1 rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-sm text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
                  />
                  <Button size="sm" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>
                <p className="text-xs text-[#a8d4c0] mt-2">
                  Email invitations coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
