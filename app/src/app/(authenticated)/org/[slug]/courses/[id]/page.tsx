import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getOrganization,
  getFacilityWithDetails,
  getUserRole,
} from '@/lib/actions';
import { ArrowLeft, MapPin, Settings } from 'lucide-react';
import { CourseEditor } from '@/components/course/course-editor';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const org = await getOrganization(slug);

  if (!org) {
    notFound();
  }

  const [facility, role] = await Promise.all([
    getFacilityWithDetails(id),
    getUserRole(org.id),
  ]);

  if (!facility) {
    notFound();
  }

  const canManage = role && ['owner', 'admin'].includes(role);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}/courses`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
              <MapPin className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{facility.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{facility.holes} holes</Badge>
                {facility.par && <Badge variant="secondary">Par {facility.par}</Badge>}
                {facility.course_rating && (
                  <Badge>Rating: {facility.course_rating}</Badge>
                )}
                {facility.slope_rating && (
                  <Badge>Slope: {facility.slope_rating}</Badge>
                )}
              </div>
            </div>
          </div>
          {canManage && (
            <Link href={`/org/${slug}/courses/${id}/settings`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tees Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tee Boxes</CardTitle>
        </CardHeader>
        <CardContent>
          {facility.tees.length === 0 ? (
            <p className="text-slate-500">
              No tee boxes configured yet.{' '}
              {canManage && 'Add tees to set yardages for each hole.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {facility.tees.map((tee) => (
                <div
                  key={tee.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  {tee.color && (
                    <div
                      className="h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: tee.color.toLowerCase() }}
                    />
                  )}
                  <span className="font-medium text-slate-900">{tee.name}</span>
                  {tee.total_yards && (
                    <span className="text-sm text-slate-500">
                      {tee.total_yards.toLocaleString()} yds
                    </span>
                  )}
                  {tee.course_rating && (
                    <Badge variant="secondary" className="text-xs">
                      {tee.course_rating}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hole Details */}
      <Card>
        <CardHeader>
          <CardTitle>Hole Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEditor
            facilityId={facility.id}
            holes={facility.holes}
            tees={facility.tees}
            holesData={facility.holeDetails}
            canEdit={canManage || false}
            slug={slug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
