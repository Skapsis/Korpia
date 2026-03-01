'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-hot-toast';
import type { RefObject } from 'react';

interface DashboardToolbarProps {
  tableroNombre: string;
  canvasRef: RefObject<HTMLElement | null>;
}

export function DashboardToolbar({ tableroNombre, canvasRef }: DashboardToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startActual = searchParams.get('start') ?? '';
  const endActual = searchParams.get('end') ?? '';

  const handlePrint = useReactToPrint({
    contentRef: canvasRef,
    documentTitle: `Tablero - ${tableroNombre}`,
    pageStyle: `
      @page { size: landscape; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `,
  });

  function handleRefresh() {
    router.refresh();
    toast.success('Datos actualizados');
  }

  function handleStartChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('start', value);
    else params.delete('start');
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ''));
  }

  function handleEndChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('end', value);
    else params.delete('end');
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ''));
  }

  return (
    <div className="no-print sticky top-0 z-50 flex items-center justify-between gap-4 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3">
      <h1 className="section-title truncate">
        {tableroNombre}
      </h1>
      <div className="flex items-center gap-4 shrink-0 flex-wrap justify-end">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 label-mini">
            <span>Desde</span>
            <input
              type="date"
              value={startActual}
              onChange={(e) => handleStartChange(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              aria-label="Fecha desde"
            />
          </label>
          <label className="flex items-center gap-2 label-mini">
            <span>Hasta</span>
            <input
              type="date"
              value={endActual}
              onChange={(e) => handleEndChange(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              aria-label="Fecha hasta"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Datos
        </button>
        <button
          type="button"
          onClick={() => handlePrint()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Exportar a PDF
        </button>
      </div>
    </div>
  );
}
