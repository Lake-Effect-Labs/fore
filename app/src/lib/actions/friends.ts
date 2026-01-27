'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Profile, Friendship } from '@/types/database';

export interface FriendWithProfile extends Friendship {
  friend: Profile;
}

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (user.id === addresseeId) {
    return { error: 'Cannot send friend request to yourself' };
  }

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
    )
    .single();

  if (existing) {
    if (existing.status === 'accepted') {
      return { error: 'Already friends' };
    }
    return { error: 'Friend request already exists' };
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/friends');
  return { success: true };
}

export async function respondToFriendRequest(
  friendshipId: string,
  response: 'accepted' | 'declined'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (response === 'declined') {
    // Delete the request
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .eq('addressee_id', user.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Accept the request
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .eq('addressee_id', user.id);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath('/friends');
  return { success: true };
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/friends');
  return { success: true };
}

export async function getFriends(): Promise<FriendWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch both directions in parallel instead of sequentially
  const [{ data: asRequester }, { data: asAddressee }] = await Promise.all([
    supabase
      .from('friendships')
      .select('*, friend:profiles!friendships_addressee_id_fkey(*)')
      .eq('requester_id', user.id)
      .eq('status', 'accepted'),
    supabase
      .from('friendships')
      .select('*, friend:profiles!friendships_requester_id_fkey(*)')
      .eq('addressee_id', user.id)
      .eq('status', 'accepted'),
  ]);

  const friends: FriendWithProfile[] = [];

  if (asRequester) {
    friends.push(
      ...asRequester.map((f) => ({
        ...f,
        friend: f.friend as Profile,
      }))
    );
  }

  if (asAddressee) {
    friends.push(
      ...asAddressee.map((f) => ({
        ...f,
        friend: f.friend as Profile,
      }))
    );
  }

  return friends;
}

export async function getPendingFriendRequests(): Promise<FriendWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: pending } = await supabase
    .from('friendships')
    .select('*, friend:profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending');

  if (!pending) return [];

  return pending.map((f) => ({
    ...f,
    friend: f.friend as Profile,
  }));
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || query.length < 2) return [];

  // Sanitize query: strip characters that could manipulate PostgREST filters
  const sanitizedQuery = query.replace(/[,()]/g, '').trim();
  if (sanitizedQuery.length < 2) return [];

  // Normalize phone number search - strip non-digits for matching
  const normalizedQuery = sanitizedQuery.replace(/\D/g, '');
  const isPhoneSearch = normalizedQuery.length >= 3 && /^\d+$/.test(sanitizedQuery.replace(/[\s\-\.]/g, ''));

  let orFilter = `email.ilike.%${sanitizedQuery}%,full_name.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`;

  // Add phone search if query looks like a phone number
  if (isPhoneSearch) {
    orFilter += `,phone.ilike.%${normalizedQuery}%`;
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .or(orFilter)
    .limit(10);

  return profiles || [];
}
