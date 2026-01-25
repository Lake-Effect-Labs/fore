'use client';

import { AppShell, NavItem } from '@/components/app-shell';
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  Users,
  User,
  Building2,
  ClipboardList,
  Gamepad2,
} from 'lucide-react';

interface PlayerShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  adminOrgSlug?: string;
  isCourseAdmin?: boolean;
}

export function PlayerShell({
  children,
  isAdmin,
  adminOrgSlug,
  isCourseAdmin,
}: PlayerShellProps) {
  // Course admins get a minimal nav - mostly use admin section
  const courseAdminNavItems: NavItem[] = [
    {
      label: 'Admin',
      href: adminOrgSlug ? `/admin/${adminOrgSlug}` : '/admin',
      icon: Building2,
    },
  ];

  // Regular players get full player nav
  const playerNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: 'Play',
      href: '/games',
      icon: Gamepad2,
    },
    {
      label: 'My Leagues',
      href: '/leagues',
      icon: Trophy,
    },
    {
      label: 'My Events',
      href: '/events',
      icon: Calendar,
      exact: true,
    },
    {
      label: 'Organizing',
      href: '/events/organize',
      icon: ClipboardList,
    },
    {
      label: 'Friends',
      href: '/friends',
      icon: Users,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  // Add admin link for players who are also admins
  if (isAdmin && adminOrgSlug && !isCourseAdmin) {
    playerNavItems.push({
      label: 'Admin',
      href: `/admin/${adminOrgSlug}`,
      icon: Building2,
    });
  }

  const navItems = isCourseAdmin ? courseAdminNavItems : playerNavItems;

  return (
    <AppShell
      navItems={navItems}
      homeHref={isCourseAdmin ? (adminOrgSlug ? `/admin/${adminOrgSlug}` : '/admin') : '/dashboard'}
      title="Fore"
    >
      {children}
    </AppShell>
  );
}
