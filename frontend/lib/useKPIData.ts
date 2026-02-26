'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getKPIData, type KPIData } from '@/lib/kpiData';
import type { Empresa } from '@/lib/appContext';

/**
 * Obtiene los KPIs del backend para la empresa indicada.
 * Si la petición falla (dev sin backend), hace fallback a los datos locales de kpiData.ts.
 */
export function useKPIData(empresa: Empresa | null) {
  const empresaKey = empresa ?? 'SOLVEX';

  const { data, isLoading, isError, error, refetch } = useQuery<KPIData>({
    queryKey: ['dashboard-kpis', empresaKey],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: KPIData }>(
        `/api/dashboard/${encodeURIComponent(empresaKey)}`
      );
      return res.data.data;
    },
    // Mantener datos previos mientras recarga, staleTime de 2 min
    staleTime: 1000 * 60 * 2,
    placeholderData: () => getKPIData(empresaKey),
    retry: 1,
  });

  // Fallback local si el backend no está disponible
  const kpiData: KPIData = data ?? getKPIData(empresaKey);

  return { kpiData, isLoading, isError, error, refetch };
}
