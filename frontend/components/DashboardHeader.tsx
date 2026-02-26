'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Upload, Download, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useApp, SEMANA_OPTIONS } from '@/lib/appContext';
import { useDashboard } from '@/lib/dashboardContext';
import DateRangeFilter from '@/components/DateRangeFilter';

const sectionLabels: Record<string, string> = {
  '/dashboard': 'Resumen General',
  '/dashboard/comercial': 'Comercial',
  '/dashboard/operaciones': 'Operaciones',
  '/dashboard/calidad': 'Calidad Tecnica',
};

export default function DashboardHeader() {
  const { auth, filtroSemana, setFiltroSemana, logout } = useApp();
  const { triggerFileUpload, handleExport } = useDashboard();
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 bg-white border-b border-slate-200 gap-3 sticky top-0 z-30 shadow-sm">

        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Dashboard Maestro
              </h1>
              {auth.empresa && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {auth.empresa}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {sectionName}
              {auth.userName && (
                <span className="ml-1 text-slate-300"> - {auth.userName}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={triggerFileUpload}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cargar CSV</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Periodo:</span>
            <select
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
            >
              {SEMANA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <DateRangeFilter />

          <button
            onClick={() => handleExport(sectionKey.replace('/dashboard', '').replace('/', '') || 'general')}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          <button
            onClick={handleLogout}
            title="Cerrar Sesion"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>
    </>
  );
}
