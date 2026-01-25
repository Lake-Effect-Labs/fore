'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createLeague, getOrganization } from '@/lib/actions';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function NewLeaguePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leagueType, setLeagueType] = useState('weekly');
  const [format, setFormat] = useState('stroke_play');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [entryFee, setEntryFee] = useState('');

  useEffect(() => {
    async function loadData() {
      const org = await getOrganization(slug);
      if (org) {
        setOrgId(org.id);
      }
    }
    loadData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setError('');
    setIsLoading(true);

    const result = await createLeague({
      organization_id: orgId,
      name,
      description: description || undefined,
      league_type: leagueType as any,
      format: format as any,
      max_players: maxPlayers ? parseInt(maxPlayers) : undefined,
      entry_fee: entryFee ? parseFloat(entryFee) : undefined,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.league) {
      router.push(`/org/${slug}/leagues/${result.league.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}/leagues`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leagues
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Create New League</h1>
        <p className="mt-2 text-slate-600">
          Set up a recurring golf league for your members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Trophy className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>League Details</CardTitle>
              <CardDescription>Configure your league settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                League Name *
              </label>
              <Input
                className="mt-2"
                placeholder="Tuesday Night League"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
                placeholder="Weekly competitive league open to all skill levels..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  League Type *
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={leagueType}
                  onChange={(e) => setLeagueType(e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="season">Seasonal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Format *
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="stroke_play">Stroke Play</option>
                  <option value="match_play">Match Play</option>
                  <option value="stableford">Stableford</option>
                  <option value="best_ball">Best Ball</option>
                  <option value="scramble">Scramble</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Max Players
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="32"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Entry Fee ($)
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create League
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
