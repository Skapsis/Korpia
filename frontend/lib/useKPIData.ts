'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchKPIDefinitions } from '@/lib/api';
import { getKPIData, type KPIData, type KPIItem } from '@/lib/kpiData';
import type { Empresa } from '@/lib/appContext';

// ── Transformar lista plana → KPIData ─────────────────────────────────────────
// KPIData = { comercial: Record<string, KPIItem>, operaciones: ..., calidad: ... }
function defsToKPIData(defs: any[]): KPIData {
  const toRecord = (area: string): Record<string, KPIItem> => {
    const result: Record<string, KPIItem> = {};
    defs
      .filter((d) => d.area === area)
      .forEach((d) => {
        const parts = d.id.split('-');
        const key   = parts.length > 1 ? parts.slice(1).join('_') : d.id;
        result[key] = {
          titulo:        d.titulo,
          meta_total:    Number(d.meta_total    ?? 0),
          logrado_total: Number(d.logrado_total ?? 0),
          unidad:        d.unidad,
          semanas:       Array.isArray(d.semanas) ? d.semanas : [],
        };
      });
    return result;
  };

  return {
    comercial:   toRecord('comercial'),
    operaciones: toRecord('operaciones'),
    calidad:     toRecord('calidad'),
  };
}

/**
 * Obtiene los KPIs del backend para la empresa indicada.
 * Usa el mismo queryKey que useKPIDefinitions para compartir caché.
 * Fallback silencioso a kpiData.ts si el backend no responde.
 */
export function useKPIData(empresa: Empresa | null) {
  const empresaKey = empresa ?? 'SOLVEX';
  const localData  = getKPIData(empresaKey);

  const { data, isLoading, isError, error, refetch } = useQuery<KPIData>({
    queryKey: ['kpi-definitions', empresaKey],   // mismo key que useKPIDefinitions
    queryFn: async () => {
      try {
        const defs = await fetchKPIDefinitions(empresaKey);
        if (!defs.length) return localData;
        return defsToKPIData(defs);
      } catch (err: any) {
        const isNetworkError =
          !err.response ||
          err.code === 'ERR_NETWORK' ||
          err.code === 'ERR_CONNECTION_REFUSED';

        if (isNetworkError) return localData;
        throw err;
      }
    },
    staleTime:       1000 * 60 * 2,
    placeholderData: localData,
    retry:           false,
  });

  const kpiData: KPIData = data ?? localData;

  return { kpiData, isLoading, isError, error, refetch };
}

