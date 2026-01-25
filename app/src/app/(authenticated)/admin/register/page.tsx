import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/actions';
import { GolfBall } from '@/components/ui/golf-ball';
import { RegisterCourseForm } from './register-course-form';

export default async function RegisterCoursePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-[#002418]">
      <header className="border-b border-[#004d35] bg-[#003d2a]">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <GolfBall className="h-8 w-8" />
            <span className="text-lg font-bold text-[#e8f5f0]">Fore</span>
          </Link>
        </div>
      </header>
      <RegisterCourseForm userEmail={profile.email} />
    </div>
  );
}
