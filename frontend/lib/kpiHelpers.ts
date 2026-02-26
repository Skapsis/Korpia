import type { Unidad } from '@/lib/kpiData';

export const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(v);

export const fmtCurrencyFull = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v);

export function formatValue(value: number, unidad: Unidad): string {
  if (unidad === 'moneda') return fmtCurrency(value);
  if (unidad === 'porcentaje' || unidad === 'porcentaje_inverso') return `${value}%`;
  return String(value);
}

export function formatValueFull(value: number, unidad: Unidad): string {
  if (unidad === 'moneda') return fmtCurrencyFull(value);
  if (unidad === 'porcentaje' || unidad === 'porcentaje_inverso') return `${value}%`;
  return String(value);
}

export function isSuccess(logrado: number, meta: number, unidad: Unidad): boolean {
  if (unidad === 'porcentaje_inverso') return logrado <= meta;
  return logrado >= meta;
}

export function getProgress(logrado: number, meta: number, unidad: Unidad): number {
  if (meta === 0) return logrado === 0 ? 100 : 0;
  if (unidad === 'porcentaje_inverso') {
    return Math.min(100, ((meta - logrado) / meta) * 100 + 50);
  }
  return Math.min(100, (logrado / meta) * 100);
}

export const SUCCESS_COLOR = '#10b981';
export const FAIL_COLOR    = '#f43f5e';
export const META_COLOR    = '#94a3b8';
export const BAR_COLOR     = '#6366f1';

// ── Filtro dinámico por semana ────────────────────────────────────────────────
import type { KPIItem } from '@/lib/kpiData';

/**
 * Devuelve una copia de KPIItem con logrado_total / meta_total recalculados:
 *  - 'Todas'  → suma de todas las semanas del array
 *  - 'Week X' → valores de esa semana específica; 0 si no existe
 * El array `semanas` también se filtra para que el gráfico muestre solo
 * las barras correspondientes.
 */
export function getKPIFiltered(kpi: KPIItem, filtroSemana: string): KPIItem {
  if (filtroSemana === 'Todas') {
    const logrado_total = kpi.semanas.reduce((acc, s) => acc + s.logrado, 0);
    const meta_total    = kpi.semanas.reduce((acc, s) => acc + s.meta, 0);
    return { ...kpi, logrado_total, meta_total };
  }
  const semana = kpi.semanas.find((s) => s.name === filtroSemana);
  if (!semana) {
    return { ...kpi, logrado_total: 0, meta_total: kpi.meta_total, semanas: [] };
  }
  return {
    ...kpi,
    logrado_total: semana.logrado,
    meta_total:    semana.meta,
    semanas:       [semana],
  };
}
