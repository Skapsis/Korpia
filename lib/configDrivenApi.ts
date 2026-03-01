/**
 * Configuration-Driven UI — API client
 * Wraps the /api/config, /api/tableros, /api/indicadores, /api/datos endpoints.
 */
import { api } from './api';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IndicadorDato {
    id: string;
    indicadorId: string;
    periodo: string;
    valorLogrado: number;
    valorMetaEspecifica: number | null;
    createdAt: string;
}

export interface Indicador {
    id: string;
    tableroId: string;
    titulo: string;
    descripcion?: string | null;
    tipoGrafico: 'bar' | 'line' | 'combo' | 'pie' | 'area' | 'gauge' | 'scorecard';
    unidad: 'num' | '$' | '%' | 'USD' | 'pct' | string;
    metaGlobal: number;
    colorPrincipal: string;
    esMejorMayor: boolean;
    orden: number;
    datos: IndicadorDato[];
    createdAt?: string;
}

export interface Tablero {
    id: string;
    empresaId: string;
    nombre: string;
    descripcion?: string | null;
    icono: string;
    orden: number;
    indicadores: Indicador[];
    _count?: { indicadores: number };
    createdAt?: string;
}

export interface EmpresaConfig {
    id: string;
    nombre: string;
    slug: string;
    logo?: string;
}

export interface ConfigResponse {
    success: boolean;
    empresa: EmpresaConfig;
    tableros: Tablero[];
}

export interface CompanyOption {
    id: string;
    name: string;
    slug: string;
}

/** Lista empresas (superadmin: todas; otros: solo la suya) */
export async function fetchCompanies(): Promise<CompanyOption[]> {
    const res = await api.get<{ success: boolean; companies: CompanyOption[] }>('/api/companies');
    return res.data.companies;
}

// ─── Config ──────────────────────────────────────────────────────────────────
/** Fetch config dinámica del usuario logueado (GET /api/config/dynamic). Fuente única para BI. */
export async function fetchConfigDynamic(): Promise<ConfigResponse> {
    const res = await api.get<ConfigResponse>('/api/config/dynamic');
    return res.data;
}

/** Fetch config usando el JWT del usuario autenticado. Usa /api/config/dynamic como fuente única. */
export async function fetchCurrentUserConfig(): Promise<ConfigResponse> {
    return fetchConfigDynamic();
}

/** Fetch config por slug/id de empresa (requiere JWT) */
export async function fetchConfig(empresaId: string): Promise<ConfigResponse> {
    const res = await api.get<ConfigResponse>(`/api/config/${empresaId}`);
    return res.data;
}

/** Fetch config público por slug (sin auth, para login simulado/demo) */
export async function fetchConfigPublic(empresaSlug: string): Promise<ConfigResponse> {
    const base = typeof window !== 'undefined' ? '' : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${base}/api/config/public/${empresaSlug}`);
    if (!res.ok) throw new Error('Error al cargar configuración');
    const data = await res.json();
    return data;
}

// ─── Tableros ────────────────────────────────────────────────────────────────

export async function fetchTableros(empresaId?: string): Promise<Tablero[]> {
    const params = empresaId ? `?empresaId=${empresaId}` : '';
    const res = await api.get<{ success: boolean; tableros: Tablero[] }>(`/api/tableros${params}`);
    return res.data.tableros;
}

export async function createTablero(data: {
    empresaId: string;
    nombre: string;
    icono?: string;
    orden?: number;
}): Promise<Tablero> {
    const res = await api.post<{ success: boolean; tablero: Tablero }>('/api/tableros', data);
    return res.data.tablero;
}

export async function updateTablero(
    id: string,
    data: Partial<{ nombre: string; icono: string; orden: number }>
): Promise<Tablero> {
    const res = await api.put<{ success: boolean; tablero: Tablero }>(`/api/tableros/${id}`, data);
    return res.data.tablero;
}

export async function deleteTablero(id: string): Promise<void> {
    await api.delete(`/api/tableros/${id}`);
}

// ─── Indicadores ─────────────────────────────────────────────────────────────

export async function createIndicador(data: {
    tableroId: string;
    titulo: string;
    tipoGrafico?: 'bar' | 'line' | 'combo' | 'pie' | 'area' | 'gauge' | 'scorecard' | 'scorecard';
    unidad?: string;
    metaGlobal?: number;
    colorPrincipal?: string;
    esMejorMayor?: boolean;
    orden?: number;
}): Promise<Indicador> {
    const res = await api.post<{ success: boolean; indicador: Indicador }>('/api/indicadores', data);
    return res.data.indicador;
}

export async function updateIndicador(
    id: string,
    data: Partial<{
        titulo: string;
        tipoGrafico: 'bar' | 'line' | 'combo' | 'pie' | 'area' | 'gauge' | 'scorecard';
        unidad: string;
        metaGlobal: number;
        colorPrincipal: string;
        esMejorMayor: boolean;
        orden: number;
        tableroId: string;
    }>
): Promise<Indicador> {
    const res = await api.put<{ success: boolean; indicador: Indicador }>(`/api/indicadores/${id}`, data);
    return res.data.indicador;
}

export async function deleteIndicador(id: string): Promise<void> {
    await api.delete(`/api/indicadores/${id}`);
}

export async function fetchIndicador(id: string): Promise<Indicador> {
    const res = await api.get<{ success: boolean; indicador: Indicador }>(`/api/indicadores/${id}`);
    return res.data.indicador;
}

// ─── Datos ───────────────────────────────────────────────────────────────────

export type DatoInput = {
    indicadorId: string;
    periodo: string;
    valorLogrado: number;
    valorMetaEspecifica?: number | null;
};

export async function upsertDatos(datos: DatoInput | DatoInput[]): Promise<IndicadorDato[]> {
    const res = await api.post<{ success: boolean; datos: IndicadorDato[] }>('/api/datos', datos);
    return res.data.datos;
}

export async function updateDato(
    id: string,
    data: Partial<{ periodo: string; valorLogrado: number; valorMetaEspecifica: number | null }>
): Promise<IndicadorDato> {
    const res = await api.put<{ success: boolean; dato: IndicadorDato }>(`/api/datos/${id}`, data);
    return res.data.dato;
}

export async function deleteDato(id: string): Promise<void> {
    await api.delete(`/api/datos/${id}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formatea un valor numérico según la unidad del indicador */
export function formatValue(value: number, unidad: string): string {
    if (unidad === '$' || unidad === 'USD') {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    }
    if (unidad === '%' || unidad === 'pct') {
        return `${value.toFixed(1)}%`;
    }
    return new Intl.NumberFormat('es-MX').format(value);
}

/** Calcula el porcentaje de cumplimiento */
export function calcCumplimiento(logrado: number, meta: number, esMejorMayor: boolean): number {
    if (meta <= 0) return 100;
    if (esMejorMayor) return Math.min((logrado / meta) * 100, 200);
    // Menor es mejor: 100% si logrado <= meta, decrece si logrado > meta
    return logrado <= meta ? 100 : Math.max(0, (2 - logrado / meta) * 100);
}

/** True si el indicador está en meta */
export function isOnTarget(logrado: number, meta: number, esMejorMayor: boolean): boolean {
    return esMejorMayor ? logrado >= meta : logrado <= meta;
}
