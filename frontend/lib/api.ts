import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request (para rutas autenticadas del backend)
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // El backend legacy usa solvex_token; para el nuevo flujo no hay token Bearer.
        // Si en el futuro se añade JWT al nuevo auth, se enviará aquí.
        const token = localStorage.getItem('solvex_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 — limpia la sesión y redirige al login
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('korpia_auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── KPI Definitions CRUD ──────────────────────────────────────────────────────

export interface KPIDefinition {
    id: string;
    empresa: string;
    area: 'comercial' | 'operaciones' | 'calidad';
    titulo: string;
    meta_total: number;
    logrado_total: number;
    unidad: string;
    semanas: { name: string; logrado: number; meta: number }[];
}

function adminHeaders() {
    if (typeof window === 'undefined') return {};
    const auth = localStorage.getItem('korpia_auth');
    const role = auth ? (JSON.parse(auth).role ?? 'user') : 'user';
    return { 'x-user-role': role };
}

export async function fetchKPIDefinitions(empresa?: string): Promise<KPIDefinition[]> {
    const params = empresa ? `?empresa=${encodeURIComponent(empresa)}` : '';
    const res = await api.get<{ success: boolean; data: KPIDefinition[] }>(
        `/api/kpi-definitions${params}`
    );
    return res.data.data;
}

export async function createKPIDefinition(
    payload: Omit<KPIDefinition, 'id'>
): Promise<KPIDefinition> {
    const res = await api.post<{ success: boolean; data: KPIDefinition }>(
        '/api/kpi-definitions',
        payload,
        { headers: adminHeaders() }
    );
    return res.data.data;
}

export async function updateKPIDefinition(
    id: string,
    payload: Partial<Omit<KPIDefinition, 'id'>>
): Promise<KPIDefinition> {
    const res = await api.put<{ success: boolean; data: KPIDefinition }>(
        `/api/kpi-definitions/${id}`,
        payload,
        { headers: adminHeaders() }
    );
    return res.data.data;
}

export async function deleteKPIDefinition(id: string): Promise<void> {
    await api.delete(`/api/kpi-definitions/${id}`, { headers: adminHeaders() });
}

export default api;
