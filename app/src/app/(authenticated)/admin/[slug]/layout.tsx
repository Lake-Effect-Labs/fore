'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  Users,
  Settings,
  MapPin,
  Clock,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string;

  const navItems = [
    {
      label: 'Dashboard',
      href: `/admin/${slug}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Leagues',
      href: `/admin/${slug}/leagues`,
      icon: Trophy,
    },
    {
      label: 'Events',
      href: `/admin/${slug}/events`,
      icon: Calendar,
    },
    {
      label: 'Courses',
      href: `/admin/${slug}/courses`,
      icon: MapPin,
    },
    {
      label: 'Tee Times',
      href: `/admin/${slug}/tee-times`,
      icon: Clock,
    },
    {
      label: 'Team',
      href: `/admin/${slug}/team`,
      icon: Users,
    },
    {
      label: 'Settings',
      href: `/admin/${slug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <AppShell
      navItems={navItems}
      homeHref={`/admin/${slug}`}
      title="Fore"
    >
      {children}
    </AppShell>
  );
}
