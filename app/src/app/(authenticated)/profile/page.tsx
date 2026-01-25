'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { getProfile, updateProfile } from '@/lib/actions';
import type { Profile } from '@/types/database';
import { User, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handicap, setHandicap] = useState('');

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setFullName(p?.full_name || '');
      setDisplayName(p?.display_name || '');
      setHandicap(p?.handicap?.toString() || '');
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    const result = await updateProfile({
      full_name: fullName || undefined,
      display_name: displayName || undefined,
      handicap: handicap ? parseFloat(handicap) : undefined,
    });

    setIsSaving(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage('Profile updated successfully');
      router.refresh();
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
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Profile</h1>

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
                className="block text-sm font-medium text-slate-700"
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
                className="block text-sm font-medium text-slate-700"
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
              <p className="mt-1 text-sm text-slate-500">
                This is how you&apos;ll appear in games
              </p>
            </div>

            <div>
              <label
                htmlFor="handicap"
                className="block text-sm font-medium text-slate-700"
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
              <p className="mt-1 text-sm text-slate-500">
                Optional - used for handicapped games
              </p>
            </div>

            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.includes('error')
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
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
