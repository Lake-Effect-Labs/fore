import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes (require authentication)
  const protectedPaths = ['/dashboard', '/games', '/profile', '/friends', '/leagues', '/events', '/admin'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Player-only routes (course admins should be redirected)
  const playerOnlyPaths = ['/dashboard', '/games', '/profile', '/friends', '/leagues', '/events'];
  const isPlayerOnlyPath = playerOnlyPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Fetch profile ONCE for routes that need account_type check
  // (instead of two separate queries for player-only and auth routes)
  const needsProfileCheck = user && (isPlayerOnlyPath || request.nextUrl.pathname === '/auth');
  const profile = needsProfileCheck
    ? (await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single()).data
    : null;

  // Check if course admin is trying to access player routes
  if (isPlayerOnlyPath && user) {
    if (profile?.account_type === 'course_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth page
  if (request.nextUrl.pathname === '/auth' && user) {
    const url = request.nextUrl.clone();
    url.pathname = profile?.account_type === 'course_admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Ensure pathname header is set on final response
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname);
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
