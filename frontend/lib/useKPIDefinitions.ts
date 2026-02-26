'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchKPIDefinitions,
    createKPIDefinition,
    updateKPIDefinition,
    deleteKPIDefinition,
    type KPIDefinition,
} from '@/lib/api';
import { getKPIData } from '@/lib/kpiData';
import type { Empresa } from '@/lib/appContext';

const QUERY_KEY = 'kpi-definitions';

/**
 * Hook principal para obtener y mutar definiciones de KPI.
 * Si el backend no está disponible, hace fallback a los datos locales de kpiData.ts.
 */
export function useKPIDefinitions(empresa: Empresa | null) {
    const empresaKey   = empresa ?? 'SOLVEX';
    const qc           = useQueryClient();

    // ── build local fallback from kpiData.ts ──────────────────────────────────
    const localFallback = (): KPIDefinition[] => {
        const kd = getKPIData(empresaKey);
        const prefix = empresaKey.toLowerCase().replace(/\s+/g, '');
        const toList = (area: 'comercial' | 'operaciones' | 'calidad') =>
            Object.entries(kd[area]).map(([key, item]) => ({
                id:            `${prefix}-${key}`,
                empresa:       empresaKey,
                area,
                titulo:        item.titulo,
                meta_total:    item.meta_total,
                logrado_total: item.logrado_total,
                unidad:        item.unidad as string,
                semanas:       item.semanas,
            }));
        return [
            ...toList('comercial'),
            ...toList('operaciones'),
            ...toList('calidad'),
        ];
    };

    // ── query ────────────────────────────────────────────────────────────────
    const { data, isLoading, isError } = useQuery<KPIDefinition[]>({
        queryKey: [QUERY_KEY, empresaKey],
        queryFn: async () => {
            try {
                return await fetchKPIDefinitions(empresaKey);
            } catch (err: any) {
                const isNetworkError =
                    !err.response ||
                    err.code === 'ERR_NETWORK' ||
                    err.code === 'ERR_CONNECTION_REFUSED';
                if (isNetworkError) return localFallback();
                throw err;
            }
        },
        staleTime: 1000 * 60 * 2,
        placeholderData: localFallback(),
        retry: false,
    });

    const definitions: KPIDefinition[] = data ?? localFallback();

    // ── mutations ─────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createKPIDefinition,
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, empresaKey] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<KPIDefinition, 'id'>> }) =>
            updateKPIDefinition(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, empresaKey] }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteKPIDefinition,
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, empresaKey] }),
    });

    // ── helpers filtrados por área ───────────────────────────────────────────
    const byArea = (area: 'comercial' | 'operaciones' | 'calidad') =>
        definitions.filter((d) => d.area === area);

    return {
        definitions,
        byArea,
        isLoading,
        isError,
        createKPI:  createMutation.mutateAsync,
        updateKPI:  (id: string, payload: Partial<Omit<KPIDefinition, 'id'>>) =>
                        updateMutation.mutateAsync({ id, payload }),
        deleteKPI:  deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
