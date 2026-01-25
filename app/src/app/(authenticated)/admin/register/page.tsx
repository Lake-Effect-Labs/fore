import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions';
import { RegisterCourseForm } from './register-course-form';

export default async function RegisterCoursePage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/auth');
  }

  return <RegisterCourseForm userEmail={profile.email} />;
}
