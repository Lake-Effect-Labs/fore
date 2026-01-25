import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOrganization, getUserRole, updateOrganization } from '@/lib/actions';
import { ArrowLeft, Building2 } from 'lucide-react';
import { OrganizationSettingsForm } from './organization-settings-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminSettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);

  // Only allow admin roles (owner, admin) to access settings
  if (!role || !['owner', 'admin'].includes(role)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/admin/${slug}`}
        className="mb-4 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        {org.logo_url ? (
          <img
            src={org.logo_url}
            alt={org.name}
            className="h-16 w-16 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#004d35]">
            <Building2 className="h-8 w-8 text-[#c9a962]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#e8f5f0]">Organization Settings</h1>
          <p className="mt-1 text-[#a8d4c0]">
            Manage your organization details and preferences
          </p>
        </div>
      </div>

      {/* Settings Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Update your organization information. This will be visible to members and on public pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationSettingsForm organization={org} />
        </CardContent>
      </Card>
    </div>
  );
}
