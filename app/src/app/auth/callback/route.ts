import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect');
  const error_description = searchParams.get('error_description');

  // Handle error from Supabase (e.g., expired link)
  if (error_description) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error_description)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists (create if first login)
        let profile = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single()
          .then(r => r.data);

        // If no profile, create it
        if (!profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
              account_type: 'player',
            })
            .select('account_type')
            .single();
          profile = newProfile;
        }

        if (profile?.account_type === 'course_admin') {
          // Check if they already have an organization
          const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (membership) {
            return NextResponse.redirect(`${origin}/admin`);
          }
          return NextResponse.redirect(`${origin}/admin/register`);
        }
      }

      // Regular player - use redirect param or dashboard
      // Validate redirect is a relative path to prevent open redirect attacks
      const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/dashboard';
      return NextResponse.redirect(`${origin}${safeRedirect}`);
    }
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/auth?error=No authentication code provided`);
}
