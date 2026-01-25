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
      par: input.par || null,
      slope_rating: input.slope_rating || null,
      course_rating: input.course_rating || null,
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

  const { data: tees } = await supabase
    .from('tees')
    .select('*')
    .eq('facility_id', facilityId)
    .order('total_yards', { ascending: false });

  const { data: holes } = await supabase
    .from('holes')
    .select('*')
    .eq('facility_id', facilityId)
    .order('hole_number');

  // Get yardages for all holes
  const holesWithYardages = await Promise.all(
    (holes || []).map(async (hole) => {
      const { data: yardages } = await supabase
        .from('hole_yardages')
        .select('*')
        .eq('hole_id', hole.id);
      return {
        ...hole,
        yardages: yardages || [],
      };
    })
  );

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

  const { data: tee, error } = await supabase
    .from('tees')
    .insert({
      facility_id: facilityId,
      name,
      color: color || null,
      total_yards: totalYards || null,
      slope_rating: slopeRating || null,
      course_rating: courseRating || null,
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
  holes: { hole_number: number; par: number; handicap_index: number }[]
) {
  const supabase = await createClient();

  for (const hole of holes) {
    await supabase
      .from('holes')
      .update({ par: hole.par, handicap_index: hole.handicap_index })
      .eq('facility_id', facilityId)
      .eq('hole_number', hole.hole_number);
  }

  revalidatePath(`/facilities/${facilityId}`);
  return { success: true };
}

export async function bulkUpdateYardages(
  facilityId: string,
  teeId: string,
  yardages: { hole_number: number; yards: number }[]
) {
  const supabase = await createClient();

  // Get hole IDs
  const { data: holes } = await supabase
    .from('holes')
    .select('id, hole_number')
    .eq('facility_id', facilityId);

  if (!holes) return { error: 'No holes found' };

  for (const yardage of yardages) {
    const hole = holes.find((h) => h.hole_number === yardage.hole_number);
    if (hole) {
      await supabase
        .from('hole_yardages')
        .upsert(
          {
            hole_id: hole.id,
            tee_id: teeId,
            yards: yardage.yards,
          },
          { onConflict: 'hole_id,tee_id' }
        );
    }
  }

  revalidatePath(`/facilities/${facilityId}`);
  return { success: true };
}
