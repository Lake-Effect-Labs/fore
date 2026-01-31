import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getOrganization,
  getOrganizationFacilities,
  getUserRole,
} from '@/lib/actions';
import { ArrowLeft, Plus, MapPin, ChevronRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursesPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [facilities, role] = await Promise.all([
    getOrganizationFacilities(org.id),
    getUserRole(org.id),
  ]);

  const canManage = role && ['owner', 'admin'].includes(role);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {org.name}
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
            <p className="mt-1 text-slate-600">
              Manage your golf courses and hole information
            </p>
          </div>
          {canManage && (
            <Link href={`/org/${slug}/courses/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </Link>
          )}
        </div>
      </div>

      {facilities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No courses yet
            </h3>
            <p className="mt-2 text-center text-slate-600">
              Add your first course to start managing holes and tees.
            </p>
            {canManage && (
              <Link href={`/org/${slug}/courses/new`} className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Course
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {facilities.map((facility) => (
            <Link key={facility.id} href={`/org/${slug}/courses/${facility.id}`}>
              <Card className="transition-all hover:shadow-md hover:border-blue-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {facility.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500">
                          {facility.holes} holes
                        </span>
                        {facility.par && (
                          <span className="text-sm text-slate-500">
                            Par {facility.par}
                          </span>
                        )}
                        {facility.course_rating && (
                          <Badge variant="secondary">
                            Rating: {facility.course_rating}
                          </Badge>
                        )}
                        {facility.slope_rating && (
                          <Badge variant="secondary">
                            Slope: {facility.slope_rating}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
