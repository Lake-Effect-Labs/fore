'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateOrganizationInput, Organization, OrganizationMember, OrgRole } from '@/types/b2b';

export async function createOrganization(input: CreateOrganizationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Generate slug from name if not provided
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      slug,
      description: input.description || null,
      phone: input.phone || null,
      email: input.email || null,
      address_line1: input.address_line1 || null,
      city: input.city || null,
      state: input.state || null,
      zip_code: input.zip_code || null,
    })
    .select()
    .single();

  if (orgError) {
    if (orgError.code === '23505') {
      return { error: 'An organization with this name already exists' };
    }
    return { error: orgError.message };
  }

  // Add creator as owner using RPC to bypass RLS
  const { error: memberError } = await supabase
    .rpc('add_organization_owner', {
      org_id: org.id,
      owner_id: user.id,
    });

  if (memberError) {
    // Rollback
    await supabase.from('organizations').delete().eq('id', org.id);
    return { error: memberError.message };
  }

  revalidatePath('/dashboard');
  return { success: true, organization: org as Organization };
}

export async function getOrganization(idOrSlug: string): Promise<Organization | null> {
  const supabase = await createClient();

  // Try by ID first, then by slug
  let query = supabase.from('organizations').select('*');

  if (idOrSlug.match(/^[0-9a-f-]{36}$/i)) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data, error } = await query.single();

  if (error) return null;
  return data as Organization;
}

export async function getMyOrganizations(): Promise<(Organization & { role: OrgRole })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organization_id);

  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds);

  if (!orgs) return [];

  return orgs.map((org) => {
    const membership = memberships.find((m) => m.organization_id === org.id);
    return {
      ...org,
      role: membership?.role as OrgRole,
    } as Organization & { role: OrgRole };
  });
}

export async function updateOrganization(
  orgId: string,
  data: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if user is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}`);
  return { success: true };
}

export async function getOrganizationMembers(
  orgId: string
): Promise<(OrganizationMember & { profile: { id: string; email: string; full_name: string | null; avatar_url: string | null } })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Verify user is a member of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return [];

  const { data } = await supabase
    .from('organization_members')
    .select('*, profile:profiles(id, email, full_name, avatar_url)')
    .eq('organization_id', orgId);

  return (data || []) as (OrganizationMember & { profile: { id: string; email: string; full_name: string | null; avatar_url: string | null } })[];
}

export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: OrgRole = 'member'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if requester is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role,
    });

  if (error) {
    if (error.code === '23505') {
      return { error: 'User is already a member' };
    }
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}`);
  return { success: true };
}

export async function removeOrganizationMember(orgId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if requester is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Not authorized' };
  }

  // Can't remove the owner
  const { data: targetMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();

  if (targetMember?.role === 'owner') {
    return { error: 'Cannot remove the owner' };
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}`);
  return { success: true };
}

export async function getUserRole(orgId: string): Promise<OrgRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  return data?.role as OrgRole | null;
}

export async function searchUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('email', email.toLowerCase().trim())
    .single();

  return data as {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: OrgRole
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if requester is admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Not authorized' };
  }

  // Can't change owner's role
  const { data: targetMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();

  if (targetMember?.role === 'owner') {
    return { error: 'Cannot change the owner role' };
  }

  // Only owner can promote to admin
  if (newRole === 'admin' && membership.role !== 'owner') {
    return { error: 'Only owner can promote to admin' };
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin`);
  return { success: true };
}
