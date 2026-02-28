"use client"

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';

export function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border">
        <div className="flex flex-col flex-1 py-4 px-4 bg-background">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-primary">BuildShield AI</h1>
              <p className="text-xs text-muted-foreground">Construction Survival Engine</p>
            </div>
          </div>
          <nav className="space-y-1">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === '/profile' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Profile
            </Link>
          </nav>
        </div>
      </div>
      <div className="lg:pl-64 flex-1">
        <AuthProvider>{children}</AuthProvider>
      </div>
    </div>
  );
}