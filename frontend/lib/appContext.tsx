'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
  login: (empresa: Empresa, usuario: string, role?: 'viewer' | 'gerente' | 'superadmin', permissions?: Permissions) => void;
  logout: () => void;
  setFiltroSemana: (s: string) => void;
  updatePermissions: (permissions: Permissions) => void;
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

  function login(
    empresa: Empresa, 
    usuario: string, 
    role: 'viewer' | 'gerente' | 'superadmin' = 'viewer',
    permissions?: Permissions
  ) {
    // Simula login exitoso sin backend
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
  }

  function updatePermissions(permissions: Permissions) {
    setAuth(prev => {
      const updated = { ...prev, permissions };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function logout() {
    setAuth(DEFAULT_AUTH);
    setFiltroSemana('Todas');
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem('solvex_token');
    localStorage.removeItem('solvex_user');
    localStorage.removeItem('solvex_company');
  }

  // No renderizar hijos hasta rehidratar para evitar hydration mismatch
  if (!hydrated) return null;

  return (
    <AppContext.Provider value={{ auth, filtroSemana, login, logout, setFiltroSemana, updatePermissions }}>
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
