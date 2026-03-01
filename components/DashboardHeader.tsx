'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Download, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useApp } from '@/lib/appContext';
import { useDashboard } from '@/lib/dashboardContext';
import DateRangeFilter from '@/components/DateRangeFilter';

const sectionLabels: Record<string, string> = {
  '/dashboard/config': 'Administración',
  '/dashboard/upload': 'Carga de datos',
  '/dashboard/admin': 'Admin',
  '/dashboard': 'Dashboard',
};

export default function DashboardHeader() {
  const { auth, logout } = useApp();
  const { handleExport } = useDashboard();
  const pathname = usePathname();
  const router   = useRouter();

  const sectionKey  = Object.keys(sectionLabels).reverse().find((k) => pathname.startsWith(k)) ?? '/dashboard';
  const sectionName = sectionLabels[sectionKey] ?? 'Dashboard';

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <>
      <Toaster position="top-right" />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-8 py-4 bg-white border-b border-slate-100 gap-4 sticky top-0 z-30 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">

        {/* ── Título + empresa ── */}
        <div className="flex items-center gap-3 min-w-0">
          {auth.empresa && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 shrink-0">
              <span className="text-white text-base font-black">{auth.empresa.charAt(0)}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Dashboard Maestro
              </h1>
              {auth.empresa && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {auth.empresa}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {sectionName}
              {auth.userName && (
                <span className="ml-1.5 text-slate-300 font-medium">{auth.userName}</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Controles ── */}
        <div className="flex items-center gap-3">

          {/* DateRange */}
          <DateRangeFilter />

          {/* Separador */}
          <div className="h-7 w-px bg-slate-200" />

          {/* Exportar */}
          <button
            onClick={() => handleExport(sectionKey.replace('/dashboard', '').replace('/', '') || 'general')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all duration-150 shadow-md shadow-indigo-200"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            title="Cerrar Sesion"
            className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-150 shadow-sm"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>
    </>
  );
}
