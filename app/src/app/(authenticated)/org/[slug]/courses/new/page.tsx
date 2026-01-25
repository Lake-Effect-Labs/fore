'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createFacility, getOrganization } from '@/lib/actions';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useEffect } from 'react';

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [holes, setHoles] = useState('18');
  const [par, setPar] = useState('72');
  const [slopeRating, setSlopeRating] = useState('');
  const [courseRating, setCourseRating] = useState('');

  useEffect(() => {
    async function loadOrg() {
      const org = await getOrganization(slug);
      if (org) {
        setOrgId(org.id);
      }
    }
    loadOrg();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setError('');
    setIsLoading(true);

    const result = await createFacility({
      organization_id: orgId,
      name,
      holes: parseInt(holes) as 9 | 18,
      par: par ? parseInt(par) : undefined,
      slope_rating: slopeRating ? parseFloat(slopeRating) : undefined,
      course_rating: courseRating ? parseFloat(courseRating) : undefined,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.facility) {
      router.push(`/org/${slug}/courses/${result.facility.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href={`/org/${slug}/courses`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Add New Course</h1>
        <p className="mt-2 text-slate-600">
          Add course details. You can configure holes and tees after creation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>Basic information about this course</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Course Name *
              </label>
              <Input
                className="mt-2"
                placeholder="Championship Course"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Number of Holes *
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={holes}
                  onChange={(e) => setHoles(e.target.value)}
                >
                  <option value="9">9 Holes</option>
                  <option value="18">18 Holes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Total Par
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="72"
                  value={par}
                  onChange={(e) => setPar(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Course Rating
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  step="0.1"
                  placeholder="72.5"
                  value={courseRating}
                  onChange={(e) => setCourseRating(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  USGA course rating (e.g., 72.5)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Slope Rating
                </label>
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="135"
                  value={slopeRating}
                  onChange={(e) => setSlopeRating(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  USGA slope rating (55-155)
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Course
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
