'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchConfigDynamic, fetchConfigPublic, type ConfigResponse } from '@/lib/configDrivenApi';
import { registerSessionExpirationHandler } from '@/lib/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type Empresa = 'SOLVEX' | 'EL MEJOR';

export const EMPRESAS: Empresa[] = ['SOLVEX', 'EL MEJOR'];

export const SEMANA_OPTIONS = [
  { value: 'Todas', label: 'Todas las semanas' },
  { value: 'Week 1', label: 'Week 1' },
  { value: 'Week 2', label: 'Week 2' },
  { value: 'Week 3', label: 'Week 3' },
  { value: 'Week 4', label: 'Week 4' },
  { value: 'Week 5', label: 'Week 5' },
];

export interface Permissions {
  canAccessAdmin: boolean;
  canManageKPIs: boolean;
  areas: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  empresa: Empresa | null;
  userName: string;
  role: 'viewer' | 'gerente' | 'superadmin';
  permissions: Permissions;
}

interface AppContextValue {
  auth: AuthState;
  filtroSemana: string;
  /** Árbol JSON completo de la empresa: tableros → indicadores → datos */
  systemConfig: ConfigResponse | null;
  login: (empresa: Empresa, usuario: string, role?: 'viewer' | 'gerente' | 'superadmin', permissions?: Permissions) => void;
  logout: () => void;
  setFiltroSemana: (s: string) => void;
  updatePermissions: (permissions: Permissions) => void;
  /** Recarga el systemConfig desde el backend (llama a GET /api/config con el JWT activo) */
  refreshSystemConfig: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

const LS_KEY = 'korpia_auth';

const DEFAULT_AUTH: AuthState = { 
  isAuthenticated: false, 
  empresa: null, 
  userName: '', 
  role: 'viewer',
  permissions: {
    canAccessAdmin: false,
    canManageKPIs: false,
    areas: []
  }
};

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(DEFAULT_AUTH);
  const [filtroSemana, setFiltroSemana] = useState('Todas');
  const [hydrated, setHydrated] = useState(false);
  const [systemConfig, setSystemConfig] = useState<ConfigResponse | null>(null);

  // Rehidratar desde localStorage solo en cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setAuth(JSON.parse(stored));
    } catch {
      // silent
    }
    setHydrated(true);
  }, []);

  // Cargar systemConfig al hidratar: con JWT usa GET /api/config/dynamic, sin JWT usa /api/config/public
  useEffect(() => {
    if (!hydrated) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('solvex_token') : null;
    const authStored = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (token && token !== 'local-auth') {
      refreshSystemConfig();
    } else if (authStored) {
      try {
        const { empresa } = JSON.parse(authStored);
        const slug = empresa ? String(empresa).toLowerCase().replace(/\s+/g, '-') : 'solvex';
        fetchConfigPublic(slug).then((c) => c.success && setSystemConfig(c)).catch(() => {});
      } catch {
        // silent
      }
    }
  }, [hydrated]);

  /**
   * Recarga el systemConfig desde el backend.
   * Con JWT: GET /api/config. Sin JWT: GET /api/config/public/:slug
   */
  async function refreshSystemConfig(): Promise<void> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('solvex_token') : null;
      if (token && token !== 'local-auth') {
        const config = await fetchConfigDynamic();
        if (config.success) setSystemConfig(config);
        return;
      }
      const authStored = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
      if (authStored) {
        try {
          const { empresa } = JSON.parse(authStored);
          const slug = empresa ? String(empresa).toLowerCase().replace(/\s+/g, '-') : 'solvex';
          const config = await fetchConfigPublic(slug);
          if (config.success) setSystemConfig(config);
        } catch {
          // silent
        }
      }
    } catch {
      // Sin token o error de red
    }
  }

  function login(
    empresa: Empresa, 
    usuario: string, 
    role: 'viewer' | 'gerente' | 'superadmin' = 'viewer',
    permissions?: Permissions
  ) {
    const defaultPermissions: Permissions = {
      canAccessAdmin: role === 'superadmin',
      canManageKPIs: role === 'superadmin' || role === 'gerente',
      areas: role === 'superadmin' ? ['comercial', 'operaciones', 'calidad'] : []
    };

    const next: AuthState = { 
      isAuthenticated: true, 
      empresa, 
      userName: usuario, 
      role,
      permissions: permissions || defaultPermissions
    };
    setAuth(next);
    setFiltroSemana('Todas');
    localStorage.setItem(LS_KEY, JSON.stringify(next));

    // Cargar config: con JWT usa GET /api/config/dynamic, sin JWT usa endpoint público
    const token = typeof window !== 'undefined' ? localStorage.getItem('solvex_token') : null;
    if (token && token !== 'local-auth') {
      refreshSystemConfig();
    } else {
      const slug = String(empresa).toLowerCase().replace(/\s+/g, '-');
      fetchConfigPublic(slug).then((c) => c.success && setSystemConfig(c)).catch(() => {});
    }
  }

  function updatePermissions(permissions: Permissions) {
    setAuth(prev => {
      const updated = { ...prev, permissions };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  const logout = useCallback(() => {
    setAuth(DEFAULT_AUTH);
    setSystemConfig(null);
    setFiltroSemana('Todas');
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem('solvex_token');
    localStorage.removeItem('solvex_user');
    localStorage.removeItem('solvex_company');
  }, []);

  useEffect(() => {
    registerSessionExpirationHandler(() => {
      logout();
    });
    return () => registerSessionExpirationHandler(null);
  }, [logout]);

  // No renderizar hijos hasta rehidratar para evitar hydration mismatch
  if (!hydrated) return null;

  return (
    <AppContext.Provider value={{ auth, filtroSemana, systemConfig, login, logout, setFiltroSemana, updatePermissions, refreshSystemConfig }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
