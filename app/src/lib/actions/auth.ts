'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback${
        redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''
      }`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Ensure profile exists (create if first login)
    let profile = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', data.user.id)
      .single()
      .then(r => r.data);

    // If no profile, create it
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || null,
          account_type: data.user.user_metadata?.account_type || 'player',
        })
        .select('account_type')
        .single();
      profile = newProfile;
    }

    if (profile?.account_type === 'course_admin') {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .limit(1)
        .single();

      if (membership) {
        return { success: true, redirectTo: '/admin' };
      }
      return { success: true, redirectTo: '/admin/register' };
    }
  }

  return { success: true };
}

export async function signUp(
  email: string,
  password: string,
  accountType: 'player' | 'course_admin',
  fullName?: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        account_type: accountType,
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Profile will be created on first login (in callback) when user is authenticated

  return { success: true, user: data.user };
}

// Ensure profile exists for authenticated user - called after login
export async function ensureProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingProfile) return existingProfile;

  // Create profile from user metadata
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || null,
      account_type: user.user_metadata?.account_type || 'player',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create profile:', error);
    return null;
  }

  return profile;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<{
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  handicap: number | null;
  account_type: 'player' | 'course_admin';
  created_at: string;
  updated_at: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as {
    id: string;
    email: string;
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    handicap: number | null;
    account_type: 'player' | 'course_admin';
    created_at: string;
    updated_at: string;
  } | null;
}

export async function updateProfile(data: {
  full_name?: string;
  display_name?: string;
  handicap?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
