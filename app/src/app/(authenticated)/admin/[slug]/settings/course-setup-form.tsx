'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  createFacility,
  getOrganizationFacilities,
  getFacilityHoles,
  bulkUpdateHoles,
} from '@/lib/actions';
import type { Facility, PinPlacement } from '@/types/b2b';
import { MapPin, Save, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface CourseSetupFormProps {
  organizationId: string;
}

interface HoleData {
  hole_number: number;
  par: number;
  handicap_index: number;
  yardage: number | null;
  pin_placement: PinPlacement;
  notes: string | null;
}

export function CourseSetupForm({ organizationId }: CourseSetupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [facilityName, setFacilityName] = useState('');
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [holes, setHoles] = useState<HoleData[]>([]);

  // Load existing facility and holes
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const facilities = await getOrganizationFacilities(organizationId);

      if (facilities.length > 0) {
        const existingFacility = facilities[0];
        setFacility(existingFacility);
        setFacilityName(existingFacility.name);
        setHoleCount(existingFacility.holes);

        const existingHoles = await getFacilityHoles(existingFacility.id);
        if (existingHoles.length > 0) {
          setHoles(
            existingHoles.map((h) => ({
              hole_number: h.hole_number,
              par: h.par,
              handicap_index: h.handicap_index || h.hole_number,
              yardage: h.yardage,
              pin_placement: h.pin_placement,
              notes: h.notes,
            }))
          );
          // Show optional fields if any have data
          const hasOptionalData = existingHoles.some(
            (h) => h.yardage || h.pin_placement || h.notes
          );
          setShowOptional(hasOptionalData);
        } else {
          initializeHoles(existingFacility.holes);
        }
      } else {
        initializeHoles(18);
      }

      setIsLoading(false);
    }

    loadData();
  }, [organizationId]);

  const initializeHoles = (count: 9 | 18) => {
    const newHoles: HoleData[] = [];
    for (let i = 1; i <= count; i++) {
      newHoles.push({
        hole_number: i,
        par: 4,
        handicap_index: i,
        yardage: null,
        pin_placement: null,
        notes: null,
      });
    }
    setHoles(newHoles);
  };

  const handleHoleCountChange = (count: 9 | 18) => {
    setHoleCount(count);
    if (!facility) {
      initializeHoles(count);
    }
  };

  const updateHole = (
    holeNumber: number,
    field: keyof HoleData,
    value: number | string | null
  ) => {
    setHoles((prev) =>
      prev.map((h) =>
        h.hole_number === holeNumber ? { ...h, [field]: value } : h
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    setSaved(false);

    try {
      if (!facility) {
        // Create new facility
        const result = await createFacility({
          organization_id: organizationId,
          name: facilityName || 'Main Course',
          holes: holeCount,
          par: holes.reduce((sum, h) => sum + h.par, 0),
        });

        if (result.error) {
          setError(result.error);
          setIsSaving(false);
          return;
        }

        if (result.facility) {
          setFacility(result.facility);
          // Update holes with all data
          await bulkUpdateHoles(result.facility.id, holes);
        }
      } else {
        // Update existing holes
        await bulkUpdateHoles(facility.id, holes);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError('Failed to save course setup');
    }

    setIsSaving(false);
  };

  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const totalYardage = holes.reduce((sum, h) => sum + (h.yardage || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#a8d4c0]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#004d35]">
            <MapPin className="h-5 w-5 text-[#c9a962]" />
          </div>
          <div>
            <CardTitle>Course Setup</CardTitle>
            <CardDescription>
              Configure your course holes for scoring and handicaps
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Course Name */}
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0]">
            Course Name
          </label>
          <Input
            className="mt-2 max-w-md"
            placeholder="Main Course"
            value={facilityName}
            onChange={(e) => {
              setFacilityName(e.target.value);
              setSaved(false);
            }}
            disabled={!!facility}
          />
          {facility && (
            <p className="mt-1 text-xs text-[#a8d4c0]">
              Course name cannot be changed after creation
            </p>
          )}
        </div>

        {/* Hole Count */}
        {!facility && (
          <div>
            <label className="block text-sm font-medium text-[#e8f5f0]">
              Number of Holes
            </label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => handleHoleCountChange(9)}
                className={`rounded-lg border-2 px-6 py-2 font-medium transition-colors ${
                  holeCount === 9
                    ? 'border-[#c9a962] bg-[#004d35] text-[#c9a962]'
                    : 'border-[#004d35] text-[#a8d4c0] hover:border-[#006747]'
                }`}
              >
                9 Holes
              </button>
              <button
                type="button"
                onClick={() => handleHoleCountChange(18)}
                className={`rounded-lg border-2 px-6 py-2 font-medium transition-colors ${
                  holeCount === 18
                    ? 'border-[#c9a962] bg-[#004d35] text-[#c9a962]'
                    : 'border-[#004d35] text-[#a8d4c0] hover:border-[#006747]'
                }`}
              >
                18 Holes
              </button>
            </div>
          </div>
        )}

        {/* Course Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-[#002418] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[#a8d4c0]">Total Par</span>
              <span className="text-2xl font-bold text-[#c9a962]">{totalPar}</span>
            </div>
          </div>
          {totalYardage > 0 && (
            <div className="rounded-lg bg-[#002418] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[#a8d4c0]">Total Yardage</span>
                <span className="text-2xl font-bold text-[#c9a962]">
                  {totalYardage.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Optional Fields */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-2 text-sm text-[#c9a962] hover:text-[#e8f5f0]"
        >
          {showOptional ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showOptional ? 'Hide' : 'Show'} optional fields (yardage, pin placement, notes)
        </button>

        {/* Holes Grid */}
        <div>
          <label className="block text-sm font-medium text-[#e8f5f0] mb-3">
            Hole Configuration
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#004d35]">
                  <th className="px-2 py-2 text-left text-[#a8d4c0]">Hole</th>
                  <th className="px-2 py-2 text-center text-[#a8d4c0]">Par</th>
                  <th className="px-2 py-2 text-center text-[#a8d4c0]">Hdcp</th>
                  {showOptional && (
                    <>
                      <th className="px-2 py-2 text-center text-[#a8d4c0]">Yards</th>
                      <th className="px-2 py-2 text-center text-[#a8d4c0]">Pin</th>
                      <th className="px-2 py-2 text-left text-[#a8d4c0]">Notes</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {holes.map((hole) => (
                  <tr key={hole.hole_number} className="border-b border-[#004d35]/50">
                    <td className="px-2 py-2 font-medium text-[#e8f5f0]">
                      {hole.hole_number}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-center gap-1">
                        {[3, 4, 5].map((par) => (
                          <button
                            key={par}
                            type="button"
                            onClick={() => updateHole(hole.hole_number, 'par', par)}
                            className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                              hole.par === par
                                ? 'bg-[#c9a962] text-[#002418]'
                                : 'bg-[#004d35] text-[#a8d4c0] hover:bg-[#006747]'
                            }`}
                          >
                            {par}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={hole.handicap_index}
                        onChange={(e) =>
                          updateHole(hole.hole_number, 'handicap_index', parseInt(e.target.value))
                        }
                        className="w-14 mx-auto block rounded border border-[#004d35] bg-[#002418] px-1 py-1 text-center text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                      >
                        {Array.from({ length: holeCount }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                    {showOptional && (
                      <>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="50"
                            max="700"
                            placeholder="—"
                            value={hole.yardage || ''}
                            onChange={(e) =>
                              updateHole(
                                hole.hole_number,
                                'yardage',
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="w-16 mx-auto block rounded border border-[#004d35] bg-[#002418] px-1 py-1 text-center text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={hole.pin_placement || ''}
                            onChange={(e) =>
                              updateHole(
                                hole.hole_number,
                                'pin_placement',
                                e.target.value || null
                              )
                            }
                            className="w-20 mx-auto block rounded border border-[#004d35] bg-[#002418] px-1 py-1 text-center text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                          >
                            <option value="">—</option>
                            <option value="front">Front</option>
                            <option value="middle">Middle</option>
                            <option value="back">Back</option>
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="Hazards, tips..."
                            value={hole.notes || ''}
                            onChange={(e) =>
                              updateHole(
                                hole.hole_number,
                                'notes',
                                e.target.value || null
                              )
                            }
                            className="w-full min-w-[120px] rounded border border-[#004d35] bg-[#002418] px-2 py-1 text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? 'Saved!' : 'Save Course Setup'}
        </Button>
      </CardContent>
    </Card>
  );
}
