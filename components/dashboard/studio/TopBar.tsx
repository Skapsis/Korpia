'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { ChartDataRow } from './AnalyticsDashboard';

type TopBarProps = {
  onClearCanvas?: () => void;
  chartData?: ChartDataRow[];
  selectedXAxis?: string | null;
  selectedYAxis?: string[];
  globalFilter?: { region: string };
  regions?: string[];
  onGlobalFilterChange?: (f: { region: string }) => void;
};

/** Top navigation bar (Power BI / Tableau style). Filtros, Share, Export, Notifications. */
export function TopBar({
  onClearCanvas,
  chartData = [],
  selectedXAxis = null,
  selectedYAxis = [],
  globalFilter = { region: 'All' },
  regions = [],
  onGlobalFilterChange,
}: TopBarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleExportCSV = () => {
    const cols = [...(selectedXAxis ? [selectedXAxis] : []), ...selectedYAxis];
    if (cols.length === 0) {
      toast.error('Selecciona al menos un campo en el panel derecho para exportar');
      return;
    }
    const header = cols.join(',');
    const rows = chartData.map((row) =>
      cols.map((key) => {
        const v = (row as Record<string, unknown>)[key];
        const s = typeof v === 'number' ? String(v) : String(v ?? '');
        return s.includes(',') ? `"${s}"` : s;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  const handleExportPrint = () => {
    window.print();
    toast.success('Usa la opción Guardar como PDF de tu navegador');
  };

  const handleNotifications = () => {
    toast('No hay notificaciones nuevas', { icon: '🔔' });
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 h-14 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-[#135bec]">
            <span className="material-symbols-outlined text-3xl">analytics</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
            Analytics Studio
          </h2>
        </div>
        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2" />
        <Link
          className="text-slate-900 dark:text-white text-sm font-medium border-b-2 border-[#135bec] pb-[18px] -mb-[18px] hover:text-[#135bec] transition-colors"
          href="/dashboard"
        >
          Home
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {onClearCanvas && (
          <button
            type="button"
            onClick={onClearCanvas}
            className="flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 h-8 px-3 text-sm font-semibold transition-colors"
          >
            Limpiar Lienzo
          </button>
        )}
        {onGlobalFilterChange && regions.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Region</span>
            <select
              value={globalFilter.region}
              onChange={(e) => onGlobalFilterChange({ region: e.target.value })}
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-1.5 pl-2 pr-7 text-sm text-slate-800 dark:text-slate-200 focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec]"
            >
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 h-8 px-3 text-sm font-semibold transition-colors"
        >
          Share
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 h-8 px-3 text-sm font-semibold transition-colors"
          >
            Export
          </button>
          {exportOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setExportOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                <button
                  type="button"
                  onClick={() => { handleExportCSV(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg"
                >
                  Descargar CSV
                </button>
                <button
                  type="button"
                  onClick={() => { handleExportPrint(); setExportOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg"
                >
                  Imprimir / PDF
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-3">
          <button
            type="button"
            onClick={handleNotifications}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <Link
            href="/dashboard/settings"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#135bec] text-white flex items-center justify-center font-bold text-xs ml-2">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
