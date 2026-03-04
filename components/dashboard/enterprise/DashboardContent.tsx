'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { deleteIndicador } from '@/app/actions/kpiActions';
import { useGridEditing } from './GridEditingContext';

export interface IndicadorCard {
  id: string;
  titulo: string;
  valor?: string;
  tendencia?: string;
  tendenciaUp?: boolean | null;
  tipoGrafico?: string;
}

interface DashboardContentProps {
  indicadores?: IndicadorCard[];
  /** Título arriba (ej. nombre de carpeta). Por defecto "Key Performance Indicators". */
  title?: string;
  /** Cuando se muestran KPIs de Prisma, pasar onDelete (deleteKpi + refresh). */
  onDelete?: (id: string) => void | Promise<void>;
  /** Cuando se muestran Indicadores de config API, pasar onIndicadorDeleted. */
  onIndicadorDeleted?: (id: string) => void;
}

function TrendBadge({ trend, trendUp }: { trend: string; trendUp: boolean | null }) {
  if (trendUp === true) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">{trend}</span>;
  if (trendUp === false) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400">{trend}</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700 px-2 py-0.5 text-xs font-semibold text-zinc-400">{trend}</span>;
}

function Sparkline({ tipo }: { tipo?: string }) {
  if (tipo === 'line') return <svg className="h-full w-full stroke-emerald-500 fill-none stroke-[2]" preserveAspectRatio="none" viewBox="0 0 100 30"><path d="M0 25 C 20 25, 30 10, 50 15 S 80 5, 100 2" vectorEffect="non-scaling-stroke" /></svg>;
  if (tipo === 'bar') return <div className="flex h-full w-full items-end gap-1 opacity-80"><div className="h-[40%] w-1/6 rounded-sm bg-zinc-700" /><div className="h-[60%] w-1/6 rounded-sm bg-zinc-700" /><div className="h-[75%] w-1/6 rounded-sm bg-blue-600/40" /><div className="h-[90%] w-1/6 rounded-sm bg-blue-600" /></div>;
  return <svg className="h-full w-full stroke-emerald-500 fill-none stroke-[2]" preserveAspectRatio="none" viewBox="0 0 100 30"><path d="M0 28 L 20 20 L 40 22 L 60 15 L 80 18 L 100 5" vectorEffect="non-scaling-stroke" /></svg>;
}

/** Dashboard: estado vacío o grid de indicadores. */
export function DashboardContent({ indicadores = [], title, onDelete, onIndicadorDeleted }: DashboardContentProps) {
  const router = useRouter();
  const isEmpty = indicadores.length === 0;
  const { isEditingGrid } = useGridEditing();

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
      router.refresh();
      return;
    }
    const result = await deleteIndicador(id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Indicador eliminado');
    onIndicadorDeleted?.(id);
    router.refresh();
  };

  if (isEmpty) {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center overflow-y-auto bg-slate-50 p-6 scroll-smooth dark:bg-zinc-950">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-zinc-600" aria-hidden>add_chart</span>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-zinc-100">No hay KPIs activos</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">Comienza creando tu primer indicador para visualizar tus métricas.</p>
          <Link
            href="/dashboard/kpi/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>add_circle</span>
            <span>Crear KPI</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 scroll-smooth dark:bg-zinc-950">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{title ?? 'Key Performance Indicators'}</h2>
          <span className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">Last updated: Just now</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((ind) => (
            <div
              key={ind.id}
              className={`group relative flex h-[180px] flex-col justify-between rounded-lg border bg-white p-5 shadow-sm transition-all dark:bg-zinc-900 ${
                isEditingGrid
                  ? 'border-2 border-dashed border-blue-500/50 hover:border-blue-500'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-zinc-700'
              }`}
            >
              {isEditingGrid && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(ind.id);
                  }}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 dark:bg-zinc-700 dark:text-zinc-400"
                  aria-label="Remove card"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
              <Link
                href={isEditingGrid ? '#' : `/dashboard/tablero/${ind.id}?nombre=${encodeURIComponent(ind.titulo)}`}
                onClick={(e) => isEditingGrid && e.preventDefault()}
                className="flex flex-1 flex-col"
              >
                <div className="flex items-start justify-between">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{ind.titulo}</p>
                  {ind.tendencia != null && <TrendBadge trend={ind.tendencia} trendUp={ind.tendenciaUp ?? null} />}
                </div>
                <div className="mt-2">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{ind.valor ?? '—'}</h3>
                </div>
                <div className="mt-auto h-12 w-full pt-4">
                  <Sparkline tipo={ind.tipoGrafico} />
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="h-10" />
      </div>
    </div>
  );
}
