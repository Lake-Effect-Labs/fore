'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Link2,
  Copy,
  Share2,
  Mail,
  MessageCircle,
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
  const [copied, setCopied] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the invite link - just the signup page for now
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth`
    : '';

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = async () => {
    const shareData = {
      title: 'Join me on Fore!',
      text: 'Join me on Fore to play golf games, join leagues, and track our rounds together!',
      url: inviteLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed, fall back to copy
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join me on Fore!');
    const body = encodeURIComponent(
      `Hey! I've been using Fore to play golf games with friends and track our rounds. You should join!\n\nSign up here: ${inviteLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Join me on Fore to play golf games together! Sign up: ${inviteLink}`
    );
    window.open(`sms:?body=${message}`);
  };

  const loadData = async () => {
    try {
      const [friendsData, pendingData] = await Promise.all([
        getFriends(),
        getPendingFriendRequests(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
    } catch {
      setMessage('Failed to load friends. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (query.length >= 2) {
      searchTimerRef.current = setTimeout(async () => {
        const results = await searchUsers(query);
        const friendIds = friends.map((f) => f.friend.id);
        setSearchResults(results.filter((r) => !friendIds.includes(r.id)));
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [friends]);

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
    setMessage('');
    try {
      const result = await respondToFriendRequest(friendshipId, response);
      if (result?.error) {
        setMessage(result.error);
      } else {
        await loadData();
      }
    } catch {
      setMessage('Failed to respond to friend request. Please try again.');
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    setMessage('');
    try {
      const result = await removeFriend(friendshipId);
      if (result?.error) {
        setMessage(result.error);
      } else {
        await loadData();
      }
    } catch {
      setMessage('Failed to remove friend. Please try again.');
    }
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
              placeholder="Search by name, email, or phone..."
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

      {/* Invite Friends */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#c9a962]" />
            Invite Friends to Fore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[#a8d4c0]">
            Know someone who isn&apos;t on Fore yet? Share your invite link and play together!
          </p>

          {/* Invite Link */}
          <div className="flex items-center gap-2 rounded-lg border border-[#004d35] bg-[#002418] p-3">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-transparent text-sm text-[#e8f5f0] outline-none"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyInviteLink}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Share Options */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={shareInvite}
              className="flex-1 sm:flex-none"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={shareViaEmail}
              className="flex-1 sm:flex-none"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={shareViaSMS}
              className="flex-1 sm:flex-none"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Text
            </Button>
          </div>
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
