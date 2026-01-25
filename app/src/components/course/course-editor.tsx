'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { bulkUpdateHoles, createTee, bulkUpdateYardages } from '@/lib/actions';
import { Plus, Save, Loader2 } from 'lucide-react';
import type { Tee, Hole, HoleYardage } from '@/types/b2b';

interface CourseEditorProps {
  facilityId: string;
  holes: number;
  tees: Tee[];
  holesData: (Hole & { yardages: HoleYardage[] })[];
  canEdit: boolean;
  slug: string;
}

export function CourseEditor({
  facilityId,
  holes,
  tees,
  holesData,
  canEdit,
}: CourseEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
  const [showAddTee, setShowAddTee] = useState(false);
  const [newTeeName, setNewTeeName] = useState('');
  const [newTeeColor, setNewTeeColor] = useState('');

  // Local state for editing
  const [localHoles, setLocalHoles] = useState(
    holesData.map((h) => ({
      hole_number: h.hole_number,
      par: h.par,
      handicap_index: h.handicap_index ?? h.hole_number,
    }))
  );

  const handleSaveHoles = () => {
    startTransition(async () => {
      await bulkUpdateHoles(facilityId, localHoles);
      setEditMode(false);
    });
  };

  const handleAddTee = () => {
    if (!newTeeName) return;
    startTransition(async () => {
      await createTee(facilityId, newTeeName, newTeeColor || undefined);
      setShowAddTee(false);
      setNewTeeName('');
      setNewTeeColor('');
    });
  };

  const handleParChange = (holeNumber: number, par: number) => {
    setLocalHoles((prev) =>
      prev.map((h) => (h.hole_number === holeNumber ? { ...h, par } : h))
    );
  };

  const handleHandicapChange = (holeNumber: number, handicap_index: number) => {
    setLocalHoles((prev) =>
      prev.map((h) => (h.hole_number === holeNumber ? { ...h, handicap_index } : h))
    );
  };

  const getYardageForTee = (hole: Hole & { yardages: HoleYardage[] }, teeId: string) => {
    const yardage = hole.yardages.find((y) => y.tee_id === teeId);
    return yardage?.yards || '-';
  };

  const totalPar = localHoles.reduce((sum, h) => sum + h.par, 0);
  const frontNinePar = localHoles.filter((h) => h.hole_number <= 9).reduce((sum, h) => sum + h.par, 0);
  const backNinePar = localHoles.filter((h) => h.hole_number > 9).reduce((sum, h) => sum + h.par, 0);

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!editMode ? (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Edit Holes
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveHoles} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
          {!showAddTee ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTee(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tee
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                className="w-32"
                placeholder="Tee name"
                value={newTeeName}
                onChange={(e) => setNewTeeName(e.target.value)}
              />
              <Input
                className="w-24"
                placeholder="Color"
                value={newTeeColor}
                onChange={(e) => setNewTeeColor(e.target.value)}
              />
              <Button
                size="sm"
                onClick={handleAddTee}
                disabled={!newTeeName || isPending}
              >
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTee(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-2 text-left font-medium text-slate-600">Hole</th>
              {holes > 9 && (
                <>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i + 1} className="px-2 py-2 text-center font-medium text-slate-600 min-w-[40px]">
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium text-slate-900 bg-slate-50">OUT</th>
                  {Array.from({ length: Math.min(holes - 9, 9) }, (_, i) => (
                    <th key={i + 10} className="px-2 py-2 text-center font-medium text-slate-600 min-w-[40px]">
                      {i + 10}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium text-slate-900 bg-slate-50">IN</th>
                  <th className="px-2 py-2 text-center font-medium text-slate-900 bg-slate-100">TOT</th>
                </>
              )}
              {holes <= 9 && (
                <>
                  {Array.from({ length: holes }, (_, i) => (
                    <th key={i + 1} className="px-2 py-2 text-center font-medium text-slate-600 min-w-[40px]">
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium text-slate-900 bg-slate-100">TOT</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Par Row */}
            <tr className="border-b border-slate-200 bg-emerald-50">
              <td className="px-2 py-2 font-medium text-emerald-700">Par</td>
              {holes > 9 ? (
                <>
                  {localHoles.slice(0, 9).map((hole) => (
                    <td key={hole.hole_number} className="px-1 py-1 text-center">
                      {editMode ? (
                        <Input
                          className="w-10 h-8 text-center p-0"
                          type="number"
                          value={hole.par}
                          onChange={(e) => handleParChange(hole.hole_number, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-emerald-700">{hole.par}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-semibold text-emerald-800 bg-emerald-100">
                    {frontNinePar}
                  </td>
                  {localHoles.slice(9, 18).map((hole) => (
                    <td key={hole.hole_number} className="px-1 py-1 text-center">
                      {editMode ? (
                        <Input
                          className="w-10 h-8 text-center p-0"
                          type="number"
                          value={hole.par}
                          onChange={(e) => handleParChange(hole.hole_number, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-emerald-700">{hole.par}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-semibold text-emerald-800 bg-emerald-100">
                    {backNinePar}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-emerald-900 bg-emerald-200">
                    {totalPar}
                  </td>
                </>
              ) : (
                <>
                  {localHoles.map((hole) => (
                    <td key={hole.hole_number} className="px-1 py-1 text-center">
                      {editMode ? (
                        <Input
                          className="w-10 h-8 text-center p-0"
                          type="number"
                          value={hole.par}
                          onChange={(e) => handleParChange(hole.hole_number, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-emerald-700">{hole.par}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-bold text-emerald-900 bg-emerald-200">
                    {totalPar}
                  </td>
                </>
              )}
            </tr>

            {/* Handicap Row */}
            <tr className="border-b border-slate-200 bg-slate-50">
              <td className="px-2 py-2 font-medium text-slate-600">Hdcp</td>
              {holes > 9 ? (
                <>
                  {localHoles.slice(0, 9).map((hole) => (
                    <td key={hole.hole_number} className="px-1 py-1 text-center">
                      {editMode ? (
                        <Input
                          className="w-10 h-8 text-center p-0"
                          type="number"
                          value={hole.handicap_index}
                          onChange={(e) => handleHandicapChange(hole.hole_number, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-slate-500">{hole.handicap_index}</span>
                      )}
                    </td>
                  ))}
                  <td className="bg-slate-100" />
                  {localHoles.slice(9, 18).map((hole) => (
                    <td key={hole.hole_number} className="px-1 py-1 text-center">
                      {editMode ? (
                        <Input
                          className="w-10 h-8 text-center p-0"
                          type="number"
                          value={hole.handicap_index}
                          onChange={(e) => handleHandicapChange(hole.hole_number, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-slate-500">{hole.handicap_index}</span>
                      )}
                    </td>
                  ))}
                  <td className="bg-slate-100" />
                  <td className="bg-slate-200" />
                </>
              ) : (
                <>
                  {localHoles.map((hole) => (
                    <td key={hole.hole_number} className="px-1 py-1 text-center">
                      {editMode ? (
                        <Input
                          className="w-10 h-8 text-center p-0"
                          type="number"
                          value={hole.handicap_index}
                          onChange={(e) => handleHandicapChange(hole.hole_number, parseInt(e.target.value) || 0)}
                        />
                      ) : (
                        <span className="text-slate-500">{hole.handicap_index}</span>
                      )}
                    </td>
                  ))}
                  <td className="bg-slate-200" />
                </>
              )}
            </tr>

            {/* Tee Rows */}
            {tees.map((tee) => {
              const teeYardages = holesData.map((h) => {
                const y = h.yardages.find((y) => y.tee_id === tee.id);
                return y?.yards || 0;
              });
              const frontNineYards = teeYardages.slice(0, 9).reduce((s, y) => s + y, 0);
              const backNineYards = teeYardages.slice(9, 18).reduce((s, y) => s + y, 0);
              const totalYards = teeYardages.reduce((s, y) => s + y, 0);

              return (
                <tr key={tee.id} className="border-b border-slate-200">
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {tee.color && (
                        <div
                          className="h-3 w-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: tee.color.toLowerCase() }}
                        />
                      )}
                      <span className="font-medium text-slate-700">{tee.name}</span>
                    </div>
                  </td>
                  {holes > 9 ? (
                    <>
                      {holesData.slice(0, 9).map((hole) => (
                        <td key={hole.id} className="px-2 py-2 text-center text-slate-600">
                          {getYardageForTee(hole, tee.id)}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-semibold text-slate-800 bg-slate-50">
                        {frontNineYards || '-'}
                      </td>
                      {holesData.slice(9, 18).map((hole) => (
                        <td key={hole.id} className="px-2 py-2 text-center text-slate-600">
                          {getYardageForTee(hole, tee.id)}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-semibold text-slate-800 bg-slate-50">
                        {backNineYards || '-'}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-slate-900 bg-slate-100">
                        {totalYards || '-'}
                      </td>
                    </>
                  ) : (
                    <>
                      {holesData.map((hole) => (
                        <td key={hole.id} className="px-2 py-2 text-center text-slate-600">
                          {getYardageForTee(hole, tee.id)}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center font-bold text-slate-900 bg-slate-100">
                        {totalYards || '-'}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {tees.length === 0 && (
        <p className="text-center py-4 text-slate-500">
          Add tee boxes above to configure yardages for each hole.
        </p>
      )}
    </div>
  );
}
