import { notFound } from 'next/navigation';
import { getOrganization, getUserRole } from '@/lib/actions';
import { getOrganizationFacilities } from '@/lib/actions/facilities';
import { CreateEventForm } from './create-event-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewEventPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);

  // Only allow admin roles to create events
  if (!role || !['owner', 'admin'].includes(role)) {
    notFound();
  }

  const facilities = await getOrganizationFacilities(org.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">Create Event</h1>
        <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">
          Set up a new outing or tournament at {org.name}
        </p>
      </div>

      <CreateEventForm
        organizationId={org.id}
        organizationSlug={slug}
        facilities={facilities}
      />
    </div>
  );
}
