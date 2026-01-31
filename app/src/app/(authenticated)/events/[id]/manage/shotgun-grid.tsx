'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignGroupStartingHole } from '@/lib/actions/events';
import { Users, Flag, X } from 'lucide-react';

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

interface ShotgunGridProps {
  eventId: string;
  groups: Group[];
  holes: number;
}

export function ShotgunGrid({ eventId, groups, holes }: ShotgunGridProps) {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create a map of hole -> group
  const holeAssignments = new Map<number, Group>();
  for (const group of groups) {
    if (group.startingHole) {
      holeAssignments.set(group.startingHole, group);
    }
  }

  const unassignedGroups = groups.filter((g) => !g.startingHole && g.groupNumber > 0);

  const handleHoleClick = async (holeNumber: number) => {
    if (selectedGroup === null) return;

    setIsLoading(true);
    await assignGroupStartingHole(eventId, selectedGroup, holeNumber);
    setIsLoading(false);
    setSelectedGroup(null);
    router.refresh();
  };

  const handleClearHole = async (holeNumber: number) => {
    const group = holeAssignments.get(holeNumber);
    if (!group) return;

    setIsLoading(true);
    // Assign hole 0 or null to clear
    await assignGroupStartingHole(eventId, group.groupNumber, 0);
    setIsLoading(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg bg-[#002418] border border-[#004d35] p-4">
        <p className="text-sm text-[#a8d4c0]">
          {selectedGroup
            ? `Click a hole to assign Group ${selectedGroup}`
            : 'Select a group below, then click a hole to assign their starting position'}
        </p>
      </div>

      {/* Unassigned Groups */}
      {unassignedGroups.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#e8f5f0] mb-2">
            Select a group to assign:
          </h4>
          <div className="flex flex-wrap gap-2">
            {unassignedGroups.map((group) => (
              <button
                key={group.groupNumber}
                onClick={() => setSelectedGroup(
                  selectedGroup === group.groupNumber ? null : group.groupNumber
                )}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all ${
                  selectedGroup === group.groupNumber
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : 'border-[#004d35] hover:border-[#006747]'
                }`}
              >
                <Users className={`h-4 w-4 ${
                  selectedGroup === group.groupNumber ? 'text-[#c9a962]' : 'text-[#a8d4c0]'
                }`} />
                <span className={`text-sm font-medium ${
                  selectedGroup === group.groupNumber ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'
                }`}>
                  Group {group.groupNumber}
                </span>
                <span className="text-xs text-[#a8d4c0]">
                  ({group.players.length})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hole Grid */}
      <div>
        <h4 className="text-sm font-medium text-[#e8f5f0] mb-3">
          Course Layout ({holes} holes)
        </h4>
        <div className={`grid gap-2 ${holes === 18 ? 'grid-cols-6 sm:grid-cols-9' : 'grid-cols-3 sm:grid-cols-9'}`}>
          {Array.from({ length: holes }, (_, i) => i + 1).map((hole) => {
            const assignedGroup = holeAssignments.get(hole);
            const isSelectable = selectedGroup !== null && !assignedGroup;

            return (
              <div
                key={hole}
                onClick={() => isSelectable && handleHoleClick(hole)}
                className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  assignedGroup
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : isSelectable
                    ? 'border-dashed border-[#c9a962] bg-[#003d2a] cursor-pointer hover:bg-[#004d35]'
                    : 'border-[#004d35] bg-[#002418]'
                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Hole Number */}
                <div className={`absolute top-1 left-1 text-xs font-bold ${
                  assignedGroup ? 'text-[#c9a962]' : 'text-[#a8d4c0]'
                }`}>
                  {hole}
                </div>

                {assignedGroup ? (
                  <>
                    <Users className="h-5 w-5 text-[#c9a962]" />
                    <span className="text-xs font-medium text-[#e8f5f0] mt-1">
                      G{assignedGroup.groupNumber}
                    </span>
                    {/* Clear button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearHole(hole);
                      }}
                      className="absolute -top-1 -right-1 rounded-full bg-red-900 p-0.5 text-red-400 hover:bg-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <Flag className={`h-5 w-5 ${isSelectable ? 'text-[#c9a962]' : 'text-[#004d35]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-[#a8d4c0]">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-[#c9a962] bg-[#004d35]" />
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-dashed border-[#c9a962]" />
          <span>Available (click to assign)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border-2 border-[#004d35]" />
          <span>Empty</span>
        </div>
      </div>

      {/* Assigned Groups Summary */}
      {groups.filter((g) => g.startingHole).length > 0 && (
        <div className="rounded-lg border border-[#004d35] p-4">
          <h4 className="text-sm font-medium text-[#e8f5f0] mb-3">Assigned Groups</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {groups
              .filter((g) => g.startingHole)
              .sort((a, b) => (a.startingHole || 0) - (b.startingHole || 0))
              .map((group) => (
                <div
                  key={group.groupNumber}
                  className="flex items-center justify-between rounded bg-[#002418] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-[#c9a962]" />
                    <span className="text-sm text-[#e8f5f0]">Hole {group.startingHole}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#a8d4c0]">Group {group.groupNumber}</span>
                    <span className="text-xs text-[#a8d4c0]">
                      ({group.players.map((p) => p.name.split(' ')[0]).join(', ')})
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <div className="text-center py-8 text-[#a8d4c0]">
          <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No groups created yet</p>
          <p className="text-sm mt-1">Assign players to groups in the Registrations section first</p>
        </div>
      )}
    </div>
  );
}
