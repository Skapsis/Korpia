'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/appContext';
import { useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/enterprise/DashboardShell';

/** Layout dashboard: auth + Sidebar + Header + contenido. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { auth } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace('/login');
    }
  }, [auth.isAuthenticated, router]);

  if (!auth.isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
