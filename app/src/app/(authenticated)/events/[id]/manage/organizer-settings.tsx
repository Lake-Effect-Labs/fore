'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateEventAsOrganizer, openEventRegistration, closeEventRegistration } from '@/lib/actions/events';
import type { Event, EventVisibility } from '@/types/b2b';
import { Save, Eye, EyeOff, Link as LinkIcon, Globe, Lock } from 'lucide-react';

interface OrganizerSettingsProps {
  event: Event & { organization?: { name: string; slug: string } };
}

export function OrganizerSettings({ event }: OrganizerSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(event.name);
  const [slug, setSlug] = useState(event.slug || '');
  const [description, setDescription] = useState(event.description || '');
  const [visibility, setVisibility] = useState<EventVisibility>(event.visibility || 'link');
  const [maxPlayers, setMaxPlayers] = useState(event.max_players?.toString() || '');
  const [entryFee, setEntryFee] = useState(event.entry_fee?.toString() || '');
  const [teamSize, setTeamSize] = useState(event.team_size.toString());
  const [registrationCloses, setRegistrationCloses] = useState(
    event.registration_closes_at?.split('T')[0] || ''
  );

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    const result = await updateEventAsOrganizer(event.id, {
      name,
      slug: slug || undefined,
      description: description || undefined,
      visibility,
      max_players: maxPlayers ? parseInt(maxPlayers) : undefined,
      entry_fee: entryFee ? parseFloat(entryFee) : undefined,
      team_size: parseInt(teamSize),
      registration_closes_at: registrationCloses || undefined,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Settings saved');
      router.refresh();
    }
  };

  const handleOpenRegistration = async () => {
    setIsLoading(true);
    const result = await openEventRegistration(event.id);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  };

  const handleCloseRegistration = async () => {
    setIsLoading(true);
    const result = await closeEventRegistration(event.id);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  };

  const visibilityOptions: { value: EventVisibility; label: string; icon: typeof Globe; desc: string }[] = [
    { value: 'private', label: 'Private', icon: Lock, desc: 'Invite only' },
    { value: 'link', label: 'Link Access', icon: LinkIcon, desc: 'Anyone with link' },
    { value: 'public', label: 'Public', icon: Globe, desc: 'Listed publicly' },
  ];

  return (
    <div className="space-y-6">
      {/* Registration Controls */}
      <div className="flex items-center justify-between rounded-lg border border-[#004d35] p-4">
        <div>
          <p className="font-medium text-[#e8f5f0]">Registration Status</p>
          <p className="text-sm text-[#a8d4c0]">
            {event.status === 'open' ? 'Players can register' : 'Registration is closed'}
          </p>
        </div>
        {event.status === 'open' ? (
          <Button variant="outline" onClick={handleCloseRegistration} disabled={isLoading}>
            <EyeOff className="mr-2 h-4 w-4" />
            Close Registration
          </Button>
        ) : event.status === 'draft' ? (
          <Button onClick={handleOpenRegistration} disabled={isLoading}>
            <Eye className="mr-2 h-4 w-4" />
            Open Registration
          </Button>
        ) : null}
      </div>

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0]">Event Name</label>
          <Input
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Company Golf Outing 2024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0]">URL Slug</label>
          <Input
            className="mt-1"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="company-outing-2024"
          />
          {event.organization && slug && (
            <p className="mt-1 text-xs text-[#a8d4c0]">
              URL: /{event.organization.slug}/{slug}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#e8f5f0]">Description</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-[#e8f5f0] placeholder:text-[#a8d4c0]/50 focus:border-[#c9a962] focus:outline-none focus:ring-1 focus:ring-[#c9a962]"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell players about your event..."
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-[#e8f5f0] mb-2">Visibility</label>
        <div className="grid grid-cols-3 gap-2">
          {visibilityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                visibility === opt.value
                  ? 'border-[#c9a962] bg-[#004d35]'
                  : 'border-[#004d35] hover:border-[#006747]'
              }`}
            >
              <opt.icon className={`h-5 w-5 ${visibility === opt.value ? 'text-[#c9a962]' : 'text-[#a8d4c0]'}`} />
              <span className={`text-sm font-medium ${visibility === opt.value ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                {opt.label}
              </span>
              <span className="text-xs text-[#a8d4c0]">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0]">Max Players</label>
          <Input
            className="mt-1"
            type="number"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            placeholder="72"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0]">Entry Fee ($)</label>
          <Input
            className="mt-1"
            type="number"
            step="0.01"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0]">Team Size</label>
          <select
            className="mt-1 w-full rounded-lg border border-[#004d35] bg-[#002418] px-3 py-2 text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
          >
            <option value="1">Individual</option>
            <option value="2">Twosomes</option>
            <option value="3">Threesomes</option>
            <option value="4">Foursomes</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#e8f5f0]">Registration Deadline</label>
        <Input
          className="mt-1"
          type="date"
          value={registrationCloses}
          onChange={(e) => setRegistrationCloses(e.target.value)}
        />
      </div>

      {/* Course Fee Info (read-only) */}
      {event.course_fee && (
        <div className="rounded-lg bg-[#002418] border border-[#004d35] p-4">
          <p className="text-sm text-[#a8d4c0]">
            <strong className="text-[#e8f5f0]">Course Fee:</strong> ${event.course_fee} per player
          </p>
          <p className="text-xs text-[#a8d4c0] mt-1">
            This fee is set by the course and will be collected separately.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-900/20 p-3 text-sm text-green-400">
          {success}
        </div>
      )}

      <Button onClick={handleSave} disabled={isLoading} isLoading={isLoading}>
        <Save className="mr-2 h-4 w-4" />
        Save Settings
      </Button>
    </div>
  );
}
