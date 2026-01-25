import { notFound } from 'next/navigation';
import { getOrganization, getUserRole } from '@/lib/actions';
import { CreateLeagueForm } from './create-league-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CreateLeaguePage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const role = await getUserRole(org.id);

  if (!role || !['owner', 'admin', 'pro_shop'].includes(role)) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#e8f5f0]">Create League</h1>
        <p className="mt-1 text-sm sm:text-base text-[#a8d4c0]">Set up a new league for {org.name}</p>
      </div>

      <CreateLeagueForm organizationId={org.id} slug={slug} />
    </div>
  );
}
