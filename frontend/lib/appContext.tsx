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

export interface AuthState {
  isAuthenticated: boolean;
  empresa: Empresa | null;
  userName: string;
}

interface AppContextValue {
  auth: AuthState;
  filtroSemana: string;
  login: (empresa: Empresa, usuario: string) => void;
  logout: () => void;
  setFiltroSemana: (s: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

const LS_KEY = 'korpia_auth';

const DEFAULT_AUTH: AuthState = { isAuthenticated: false, empresa: null, userName: '' };

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

  function login(empresa: Empresa, usuario: string) {
    // Simula login exitoso sin backend
    const next: AuthState = { isAuthenticated: true, empresa, userName: usuario };
    setAuth(next);
    setFiltroSemana('Todas');
    localStorage.setItem(LS_KEY, JSON.stringify(next));
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
    <AppContext.Provider value={{ auth, filtroSemana, login, logout, setFiltroSemana }}>
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
