'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { getProfile, updateProfile } from '@/lib/actions';
import type { Profile } from '@/types/database';
import { Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handicap, setHandicap] = useState('');

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p);
        setFullName(p?.full_name || '');
        setDisplayName(p?.display_name || '');
        setHandicap(p?.handicap?.toString() || '');
      })
      .catch(() => {
        setMessage('Failed to load profile. Please refresh the page.');
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setIsError(false);

    try {
      const result = await updateProfile({
        full_name: fullName || undefined,
        display_name: displayName || undefined,
        handicap: handicap ? parseFloat(handicap) : undefined,
      });

      if (result.error) {
        setMessage(result.error);
        setIsError(true);
      } else {
        setMessage('Profile updated successfully');
        setIsError(false);
        router.refresh();
      }
    } catch {
      setMessage('Failed to update profile. Please try again.');
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-pulse text-slate-400">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-[#e8f5f0]">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || profile?.email}
              size="lg"
            />
            <div>
              <CardTitle>
                {profile?.display_name || profile?.full_name || 'Golfer'}
              </CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-[#a8d4c0]"
              >
                Full Name
              </label>
              <Input
                id="fullName"
                className="mt-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-[#a8d4c0]"
              >
                Display Name
              </label>
              <Input
                id="displayName"
                className="mt-2"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Johnny"
              />
              <p className="mt-1 text-sm text-[#a8d4c0]/70">
                This is how you&apos;ll appear in games
              </p>
            </div>

            <div>
              <label
                htmlFor="handicap"
                className="block text-sm font-medium text-[#a8d4c0]"
              >
                Handicap Index
              </label>
              <Input
                id="handicap"
                type="number"
                step="0.1"
                min="0"
                max="54"
                className="mt-2"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
                placeholder="15.4"
              />
              <p className="mt-1 text-sm text-[#a8d4c0]/70">
                Optional - used for handicapped games
              </p>
            </div>

            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  isError
                    ? 'bg-red-900/20 border border-red-800 text-red-400'
                    : 'bg-green-900/20 border border-green-800 text-green-400'
                }`}
              >
                {message}
              </div>
            )}

            <Button type="submit" isLoading={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
