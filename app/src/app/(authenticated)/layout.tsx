import { headers } from 'next/headers';
import { getProfile, getMyOrganizations } from '@/lib/actions';
import { PlayerShell } from './player-shell';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Check if we're in the admin section (admin pages have their own layout with sidebar)
  const isAdminRoute = pathname.startsWith('/admin/') && pathname.split('/').length > 2;

  // Skip shell for admin routes since they have their own sidebar
  if (isAdminRoute) {
    return <>{children}</>;
  }

  const [profile, organizations] = await Promise.all([
    getProfile(),
    getMyOrganizations().catch(() => []),
  ]);

  // User is admin if they have any organization with owner/admin/pro_shop role
  const isAdmin = organizations.some((org) =>
    ['owner', 'admin', 'pro_shop'].includes(org.role)
  );

  // Get the first admin org for the admin link
  const adminOrg = organizations.find((org) =>
    ['owner', 'admin', 'pro_shop'].includes(org.role)
  );

  return (
    <PlayerShell
      isAdmin={isAdmin}
      adminOrgSlug={adminOrg?.slug}
      isCourseAdmin={profile?.account_type === 'course_admin'}
    >
      {children}
    </PlayerShell>
  );
}
