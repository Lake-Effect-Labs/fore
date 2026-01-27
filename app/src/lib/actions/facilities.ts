'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateFacilityInput, Facility, Tee, Hole, HoleYardage } from '@/types/b2b';
import { getUserRole } from './organizations';

export async function createFacility(input: CreateFacilityInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check permission
  const role = await getUserRole(input.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to create facilities' };
  }

  const { data: facility, error } = await supabase
    .from('facilities')
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      holes: input.holes,
      par: input.par ?? null,
      slope_rating: input.slope_rating ?? null,
      course_rating: input.course_rating ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Create default holes
  const holesData = [];
  for (let i = 1; i <= input.holes; i++) {
    holesData.push({
      facility_id: facility.id,
      hole_number: i,
      par: 4, // Default par
      handicap_index: i,
    });
  }

  await supabase.from('holes').insert(holesData);

  revalidatePath(`/org/${input.organization_id}/courses`);
  return { success: true, facility: facility as Facility };
}

export async function getFacility(facilityId: string): Promise<Facility | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .single();

  return data as Facility | null;
}

export async function getOrganizationFacilities(orgId: string): Promise<Facility[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('facilities')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');

  return (data || []) as Facility[];
}

export async function getFacilityWithDetails(
  facilityId: string
): Promise<Facility & { tees: Tee[]; holeDetails: (Hole & { yardages: HoleYardage[] })[] } | null> {
  const supabase = await createClient();

  const { data: facility } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .single();

  if (!facility) return null;

  // Fetch tees and holes in parallel
  const [{ data: tees }, { data: holes }] = await Promise.all([
    supabase
      .from('tees')
      .select('*')
      .eq('facility_id', facilityId)
      .order('total_yards', { ascending: false }),
    supabase
      .from('holes')
      .select('*')
      .eq('facility_id', facilityId)
      .order('hole_number'),
  ]);

  // Batch-fetch all yardages for all holes in a single query instead of N+1
  const holeIds = (holes || []).map((h) => h.id);
  const { data: allYardages } = holeIds.length > 0
    ? await supabase
        .from('hole_yardages')
        .select('*')
        .in('hole_id', holeIds)
    : { data: [] };

  // Index yardages by hole_id
  const yardagesByHoleId = new Map<string, HoleYardage[]>();
  for (const yardage of allYardages || []) {
    if (!yardagesByHoleId.has(yardage.hole_id)) {
      yardagesByHoleId.set(yardage.hole_id, []);
    }
    yardagesByHoleId.get(yardage.hole_id)!.push(yardage);
  }

  const holesWithYardages = (holes || []).map((hole) => ({
    ...hole,
    yardages: yardagesByHoleId.get(hole.id) || [],
  }));

  return {
    ...facility,
    tees: tees || [],
    holeDetails: holesWithYardages,
  } as Facility & { tees: Tee[]; holeDetails: (Hole & { yardages: HoleYardage[] })[] };
}

export async function updateFacility(
  facilityId: string,
  data: Partial<Omit<Facility, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get the facility to find its organization
  const { data: facility } = await supabase
    .from('facilities')
    .select('organization_id')
    .eq('id', facilityId)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  // Check permission
  const role = await getUserRole(facility.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to update this facility' };
  }

  const { error } = await supabase
    .from('facilities')
    .update(data)
    .eq('id', facilityId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/facilities/${facilityId}`);
  return { success: true };
}

// ============================================
// Tees
// ============================================

export async function createTee(
  facilityId: string,
  name: string,
  color?: string,
  totalYards?: number,
  slopeRating?: number,
  courseRating?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check permission via facility -> organization
  const { data: facility } = await supabase
    .from('facilities')
    .select('organization_id')
    .eq('id', facilityId)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  const role = await getUserRole(facility.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to create tees' };
  }

  const { data: tee, error } = await supabase
    .from('tees')
    .insert({
      facility_id: facilityId,
      name,
      color: color ?? null,
      total_yards: totalYards ?? null,
      slope_rating: slopeRating ?? null,
      course_rating: courseRating ?? null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/facilities/${facilityId}`);
  return { success: true, tee: tee as Tee };
}

export async function getFacilityTees(facilityId: string): Promise<Tee[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('tees')
    .select('*')
    .eq('facility_id', facilityId)
    .order('total_yards', { ascending: false });

  return (data || []) as Tee[];
}

// ============================================
// Holes
// ============================================

export async function updateHole(
  holeId: string,
  data: { par?: number; handicap_index?: number }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get the hole's facility to check permission
  const { data: hole } = await supabase
    .from('holes')
    .select('facility_id')
    .eq('id', holeId)
    .single();

  if (!hole) {
    return { error: 'Hole not found' };
  }

  const { data: facility } = await supabase
    .from('facilities')
    .select('organization_id')
    .eq('id', hole.facility_id)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  const role = await getUserRole(facility.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to update holes' };
  }

  const { error } = await supabase
    .from('holes')
    .update(data)
    .eq('id', holeId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getFacilityHoles(facilityId: string): Promise<Hole[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('holes')
    .select('*')
    .eq('facility_id', facilityId)
    .order('hole_number');

  return (data || []) as Hole[];
}

// ============================================
// Hole Yardages
// ============================================

export async function setHoleYardage(
  holeId: string,
  teeId: string,
  yards: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check permission via hole -> facility -> organization
  const { data: hole } = await supabase
    .from('holes')
    .select('facility_id')
    .eq('id', holeId)
    .single();

  if (!hole) {
    return { error: 'Hole not found' };
  }

  const { data: facility } = await supabase
    .from('facilities')
    .select('organization_id')
    .eq('id', hole.facility_id)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  const role = await getUserRole(facility.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to update yardages' };
  }

  const { error } = await supabase
    .from('hole_yardages')
    .upsert(
      {
        hole_id: holeId,
        tee_id: teeId,
        yards,
      },
      {
        onConflict: 'hole_id,tee_id',
      }
    );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function bulkUpdateHoles(
  facilityId: string,
  holes: {
    hole_number: number;
    par: number;
    handicap_index: number;
    yardage?: number | null;
    pin_placement?: 'front' | 'middle' | 'back' | null;
    notes?: string | null;
  }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check permission
  const { data: facility } = await supabase
    .from('facilities')
    .select('organization_id')
    .eq('id', facilityId)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  const role = await getUserRole(facility.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to update holes' };
  }

  // TODO: PERF - These updates cannot be fully batched into a single query because
  // each hole may have different optional fields set. Using Promise.all for parallelism.
  await Promise.all(
    holes.map((hole) => {
      const updateData: Record<string, unknown> = {
        par: hole.par,
        handicap_index: hole.handicap_index,
      };

      if (hole.yardage !== undefined) {
        updateData.yardage = hole.yardage || null;
      }
      if (hole.pin_placement !== undefined) {
        updateData.pin_placement = hole.pin_placement;
      }
      if (hole.notes !== undefined) {
        updateData.notes = hole.notes || null;
      }

      return supabase
        .from('holes')
        .update(updateData)
        .eq('facility_id', facilityId)
        .eq('hole_number', hole.hole_number);
    })
  );

  revalidatePath(`/facilities/${facilityId}`);
  return { success: true };
}

export async function bulkUpdateYardages(
  facilityId: string,
  teeId: string,
  yardages: { hole_number: number; yards: number }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check permission
  const { data: facility } = await supabase
    .from('facilities')
    .select('organization_id')
    .eq('id', facilityId)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  const role = await getUserRole(facility.organization_id);
  if (!role || !['owner', 'admin'].includes(role)) {
    return { error: 'Not authorized to update yardages' };
  }

  // Get hole IDs
  const { data: holes } = await supabase
    .from('holes')
    .select('id, hole_number')
    .eq('facility_id', facilityId);

  if (!holes) return { error: 'No holes found' };

  // Batch upsert all yardages in a single query instead of N+1
  const upsertData = yardages
    .map((yardage) => {
      const hole = holes.find((h) => h.hole_number === yardage.hole_number);
      if (!hole) return null;
      return {
        hole_id: hole.id,
        tee_id: teeId,
        yards: yardage.yards,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  if (upsertData.length > 0) {
    const { error } = await supabase
      .from('hole_yardages')
      .upsert(upsertData, { onConflict: 'hole_id,tee_id' });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath(`/facilities/${facilityId}`);
  return { success: true };
}
