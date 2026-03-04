'use client';

import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/appContext';
import { useEffect, useState } from 'react';
import { fetchConfigDynamic, Tablero } from '@/lib/configDrivenApi';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { MainHeader } from './MainHeader';
import { GridEditingProvider } from './GridEditingContext';

/** Shell compartido: Sidebar + Header + área de contenido. Usado en el layout del dashboard. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { auth } = useApp();
  const pathname = usePathname();
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    fetchConfigDynamic()
      .then((res) => {
        let count = 0;
        (res.tableros ?? []).forEach((t: Tablero) => {
          count += (t.indicadores ?? []).length;
        });
        setIsEmpty(count === 0);
      })
      .catch(() => setIsEmpty(true));
  }, [auth.isAuthenticated, pathname]);

  return (
    <GridEditingProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <EnterpriseSidebar isEmpty={isEmpty} />
        <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950">
          <MainHeader />
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </GridEditingProvider>
  );
}
