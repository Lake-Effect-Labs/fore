'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  LucideIcon,
} from 'lucide-react';
import { signOut } from '@/lib/actions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  homeHref?: string;
  title?: string;
}

export function AppShell({
  children,
  navItems,
  homeHref = '/dashboard',
  title = 'Fore',
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-[#004d35] h-16',
        !isMobile && collapsed ? 'justify-center px-2' : 'px-4',
        isMobile && 'justify-between'
      )}>
        <Link href={homeHref} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c9a962] text-[#002418] font-bold text-lg flex-shrink-0">
            F
          </div>
          {(isMobile || !collapsed) && (
            <span className="font-bold text-xl text-[#e8f5f0]">{title}</span>
          )}
        </Link>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-[#a8d4c0] hover:text-[#e8f5f0]"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors',
                active
                  ? 'bg-[#004d35] text-[#c9a962]'
                  : 'text-[#a8d4c0] hover:bg-[#003d2a] hover:text-[#e8f5f0]',
                !isMobile && collapsed && 'justify-center px-2'
              )}
              title={!isMobile && collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(isMobile || !collapsed) && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#004d35] p-2 space-y-1">
        {/* Collapse toggle - only on desktop */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-[#a8d4c0] hover:bg-[#003d2a] hover:text-[#e8f5f0] transition-colors w-full',
              collapsed && 'justify-center px-2'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}

        {/* Sign out */}
        <form action={signOut}>
          <button
            type="submit"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-[#a8d4c0] hover:bg-red-900/20 hover:text-red-400 transition-colors w-full',
              !isMobile && collapsed && 'justify-center px-2'
            )}
            title={!isMobile && collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(isMobile || !collapsed) && 'Sign Out'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#002418]">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-[#004d35] bg-[#001a10] px-4 md:hidden">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c9a962] text-[#002418] font-bold">
            F
          </div>
          <span className="font-bold text-lg text-[#e8f5f0]">{title}</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#a8d4c0] hover:text-[#e8f5f0]"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#001a10] transform transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent isMobile />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-[#004d35] bg-[#001a10] transition-all duration-300 hidden md:block',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 w-full min-h-screen transition-all duration-300',
          'pt-14 md:pt-0',
          collapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
