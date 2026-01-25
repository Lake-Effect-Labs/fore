'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Plus,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Trophy,
  Calendar,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import type { Profile } from '@/types/database';
import { signOut } from '@/lib/actions';
import { GolfBall } from '@/components/ui/golf-ball';

interface HeaderProps {
  profile: Profile | null;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
}

export function Header({ profile, isAdmin, isAuthenticated }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCourseAdmin = profile?.account_type === 'course_admin';

  // Player navigation - hidden for course admins
  const playerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leagues', href: '/leagues', icon: Trophy },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Friends', href: '/friends', icon: Users },
  ];

  // Course admin gets a simplified navigation
  const navigation = isCourseAdmin ? [] : playerNavigation;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#004d35] bg-[#002418]/95 backdrop-blur supports-[backdrop-filter]:bg-[#002418]/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={isCourseAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <GolfBall size={36} className="text-[#e8f5f0]" />
          <span className="text-xl font-bold text-[#e8f5f0]">Fore</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#004d35] text-[#c9a962]'
                    : 'text-[#a8d4c0] hover:bg-[#003d2a] hover:text-[#e8f5f0]'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          {(isAdmin || isCourseAdmin) && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-[#004d35] text-[#c9a962]'
                  : 'text-[#a8d4c0] hover:bg-[#003d2a] hover:text-[#e8f5f0]'
              )}
            >
              <Building2 className="h-4 w-4" />
              {isCourseAdmin ? 'My Course' : 'Admin'}
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden md:flex md:items-center md:gap-3">
              {!isCourseAdmin && (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#a8d4c0] hover:bg-[#003d2a] hover:text-[#e8f5f0]"
                >
                  <Avatar
                    src={profile?.avatar_url}
                    name={profile?.full_name || profile?.email || 'User'}
                    size="sm"
                  />
                  <span className="max-w-[100px] truncate">
                    {profile?.display_name || profile?.full_name || 'Profile'}
                  </span>
                </Link>
              )}
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden rounded-lg p-2 text-[#a8d4c0] hover:bg-[#003d2a]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#004d35] bg-[#002418] px-4 py-4">
          <div className="flex flex-col gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#004d35] text-[#c9a962]'
                      : 'text-[#a8d4c0] hover:bg-[#003d2a]'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            {(isAdmin || isCourseAdmin) && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-[#004d35] text-[#c9a962]'
                    : 'text-[#a8d4c0] hover:bg-[#003d2a]'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 className="h-5 w-5" />
                {isCourseAdmin ? 'My Course' : 'Admin'}
              </Link>
            )}
            {isAuthenticated && (
              <>
                {!isCourseAdmin && (
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#a8d4c0] hover:bg-[#003d2a]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                )}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
