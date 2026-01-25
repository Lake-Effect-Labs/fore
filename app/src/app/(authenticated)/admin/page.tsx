import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMyOrganizations } from '@/lib/actions';
import { Building2, Plus } from 'lucide-react';

export default async function AdminDashboardPage() {
  const organizations = await getMyOrganizations();

  // If user has an organization, go directly to it
  if (organizations.length > 0) {
    redirect(`/admin/${organizations[0].slug}`);
  }

  // No organization - show registration prompt
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#004d35]">
            <Building2 className="h-8 w-8 text-[#c9a962]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
            Welcome to Fore
          </h3>
          <p className="mt-2 text-center text-[#a8d4c0] max-w-md">
            Register your golf course to start managing leagues, events, and tee times.
          </p>
          <Link href="/admin/register" className="mt-6">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Register Your Course
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
