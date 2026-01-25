'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getFriends,
  getPendingFriendRequests,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from '@/lib/actions';
import type { Profile } from '@/types/database';
import type { FriendWithProfile } from '@/lib/actions/friends';
import {
  Search,
  UserPlus,
  Check,
  X,
  Users,
  Clock,
  Trash2,
} from 'lucide-react';

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [friendsData, pendingData] = await Promise.all([
      getFriends(),
      getPendingFriendRequests(),
    ]);
    setFriends(friendsData);
    setPendingRequests(pendingData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchUsers(query);
      // Filter out existing friends
      const friendIds = friends.map((f) => f.friend.id);
      setSearchResults(results.filter((r) => !friendIds.includes(r.id)));
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingRequest(userId);
    setMessage('');
    const result = await sendFriendRequest(userId);
    setSendingRequest(null);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage('Friend request sent!');
      setSearchResults(searchResults.filter((r) => r.id !== userId));
    }
  };

  const handleRespondToRequest = async (
    friendshipId: string,
    response: 'accepted' | 'declined'
  ) => {
    await respondToFriendRequest(friendshipId, response);
    await loadData();
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    await removeFriend(friendshipId);
    await loadData();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-[#e8f5f0]">Friends</h1>

      {/* Search for friends */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#c9a962]" />
            Add Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8d4c0]" />
            <Input
              className="pl-10"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {message && (
            <div
              className={`mt-3 rounded-lg p-3 text-sm ${
                message.includes('error')
                  ? 'bg-red-900/20 text-red-400'
                  : 'bg-green-900/20 text-green-400'
              }`}
            >
              {message}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={profile.avatar_url}
                      name={profile.full_name || profile.email}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-[#e8f5f0]">
                        {profile.full_name || profile.display_name || 'Golfer'}
                      </div>
                      <div className="text-sm text-[#a8d4c0]">{profile.email}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(profile.id)}
                    isLoading={sendingRequest === profile.id}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#c9a962]" />
              Friend Requests
              <Badge variant="warning">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={request.friend.avatar_url}
                      name={request.friend.full_name || request.friend.email}
                    />
                    <div>
                      <div className="font-medium text-[#e8f5f0]">
                        {request.friend.display_name ||
                          request.friend.full_name ||
                          'Golfer'}
                      </div>
                      <div className="text-sm text-[#a8d4c0]">
                        {request.friend.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleRespondToRequest(request.id, 'declined')
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleRespondToRequest(request.id, 'accepted')
                      }
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#c9a962]" />
            My Friends
            {friends.length > 0 && (
              <Badge variant="secondary">{friends.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-[#a8d4c0]">Loading...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-[#004d35]" />
              <h3 className="mt-4 text-lg font-medium text-[#e8f5f0]">
                No friends yet
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Search for golfers above to add friends
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between rounded-lg border border-[#004d35] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={friendship.friend.avatar_url}
                      name={
                        friendship.friend.full_name || friendship.friend.email
                      }
                    />
                    <div>
                      <div className="font-medium text-[#e8f5f0]">
                        {friendship.friend.display_name ||
                          friendship.friend.full_name ||
                          'Golfer'}
                      </div>
                      {friendship.friend.handicap && (
                        <div className="text-sm text-[#a8d4c0]">
                          Handicap: {friendship.friend.handicap}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#a8d4c0] hover:text-red-400"
                    onClick={() => handleRemoveFriend(friendship.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
