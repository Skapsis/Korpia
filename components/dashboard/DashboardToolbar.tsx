'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-hot-toast';
import type { RefObject } from 'react';

const FILTRO_OPCIONES = [
  { value: '', label: 'Todos' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
];

interface DashboardToolbarProps {
  tableroNombre: string;
  canvasRef: RefObject<HTMLElement | null>;
}

export function DashboardToolbar({ tableroNombre, canvasRef }: DashboardToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filtroActual = searchParams.get('filtro') ?? '';

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

  function handleFiltroChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('filtro', value);
    else params.delete('filtro');
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ''));
  }

  return (
    <div className="no-print sticky top-0 z-20 flex items-center justify-between gap-4 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
      <h1 className="text-lg font-bold text-slate-800 truncate">
        {tableroNombre}
      </h1>
      <div className="flex items-center gap-3 shrink-0">
        <select
          value={filtroActual}
          onChange={(e) => handleFiltroChange(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filtro por período"
        >
          {FILTRO_OPCIONES.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Datos
        </button>
        <button
          type="button"
          onClick={() => handlePrint()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 transition-colors"
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
