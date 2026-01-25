'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  updateRegistrationPayment,
  updateRegistrationGroup,
} from '@/lib/actions/events';
import type { EventRegistration, PaymentStatus } from '@/types/b2b';
import { DollarSign, Users, Check, X, Clock, UserX } from 'lucide-react';

interface RegistrationListProps {
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
  teamSize: number;
}

export function RegistrationList({
  eventId,
  registrations,
  teamSize,
}: RegistrationListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeRegistrations = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  );

  const handlePaymentToggle = async (regId: string, currentStatus: string) => {
    setLoadingId(regId);
    const newStatus: PaymentStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await updateRegistrationPayment(regId, newStatus);
    setLoadingId(null);
    router.refresh();
  };

  const handleGroupChange = async (regId: string, groupNumber: number | null) => {
    setLoadingId(regId);
    await updateRegistrationGroup(regId, groupNumber);
    setLoadingId(null);
    router.refresh();
  };

  // Calculate next available group number
  const usedGroups = new Set(activeRegistrations.map((r) => r.group_number).filter(Boolean));
  const maxGroup = Math.max(0, ...Array.from(usedGroups) as number[]);

  // Group registrations by group_number for display
  const ungrouped = activeRegistrations.filter((r) => !r.group_number);
  const grouped = new Map<number, typeof activeRegistrations>();

  for (const reg of activeRegistrations) {
    if (reg.group_number) {
      if (!grouped.has(reg.group_number)) {
        grouped.set(reg.group_number, []);
      }
      grouped.get(reg.group_number)!.push(reg);
    }
  }

  const paymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'refunded':
        return <X className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const renderPlayer = (reg: typeof activeRegistrations[0]) => {
    const isGuest = !reg.user_id;
    const name = reg.profile?.full_name || reg.guest_name || reg.profile?.email || reg.guest_email || 'Unknown';
    const email = reg.profile?.email || reg.guest_email || '';
    const handicap = reg.profile?.handicap ?? reg.handicap_at_registration;

    return (
      <div
        key={reg.id}
        className={`flex items-center justify-between rounded-lg border border-[#004d35] p-3 ${
          loadingId === reg.id ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar
            src={reg.profile?.avatar_url}
            name={name}
            size="sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#e8f5f0]">
                {name}
              </p>
              {isGuest && (
                <Badge variant="secondary" className="text-xs bg-blue-900/30 text-blue-400">
                  <UserX className="h-3 w-3 mr-1" />
                  Guest
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#a8d4c0]">
              {handicap !== null ? `HCP: ${handicap}` : 'No handicap'}
              {isGuest && email && ` • ${email}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Payment Status Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePaymentToggle(reg.id, reg.payment_status)}
            disabled={loadingId === reg.id}
            className={`gap-1 ${
              reg.payment_status === 'paid'
                ? 'text-green-400 hover:text-green-300'
                : 'text-yellow-400 hover:text-yellow-300'
            }`}
          >
            {paymentStatusIcon(reg.payment_status)}
            <span className="text-xs">{reg.payment_status}</span>
          </Button>

          {/* Group Assignment */}
          <select
            className="rounded border border-[#004d35] bg-[#002418] px-2 py-1 text-xs text-[#e8f5f0]"
            value={reg.group_number || ''}
            onChange={(e) =>
              handleGroupChange(reg.id, e.target.value ? parseInt(e.target.value) : null)
            }
            disabled={loadingId === reg.id}
          >
            <option value="">No group</option>
            {Array.from({ length: maxGroup + 1 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                Group {num}
              </option>
            ))}
            <option value={maxGroup + 1}>+ New group</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-[#a8d4c0]">
        <div className="flex items-center gap-1">
          <Check className="h-4 w-4 text-green-400" />
          <span>
            {activeRegistrations.filter((r) => r.payment_status === 'paid').length} paid
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-yellow-400" />
          <span>
            {activeRegistrations.filter((r) => r.payment_status === 'pending').length} pending
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{grouped.size} groups</span>
        </div>
      </div>

      {/* Grouped Players */}
      {Array.from(grouped.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([groupNum, members]) => (
          <div key={groupNum} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Group {groupNum}</Badge>
              {members[0]?.starting_hole && (
                <span className="text-xs text-[#a8d4c0]">
                  Starting hole {members[0].starting_hole}
                </span>
              )}
              <span className="text-xs text-[#a8d4c0]">
                ({members.length}/{teamSize})
              </span>
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-[#004d35]">
              {members.map(renderPlayer)}
            </div>
          </div>
        ))}

      {/* Ungrouped Players */}
      {ungrouped.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Ungrouped</Badge>
            <span className="text-xs text-[#a8d4c0]">({ungrouped.length} players)</span>
          </div>
          <div className="space-y-2 pl-4 border-l-2 border-[#004d35] border-dashed">
            {ungrouped.map(renderPlayer)}
          </div>
        </div>
      )}

      {activeRegistrations.length === 0 && (
        <div className="text-center py-8 text-[#a8d4c0]">
          <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No registrations yet</p>
        </div>
      )}
    </div>
  );
}
