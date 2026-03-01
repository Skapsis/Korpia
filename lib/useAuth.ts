'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/appContext';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthCompany {
    id: string;
    name: string;
    slug: string;
}

/**
 * Puente de compatibilidad hacia useApp / appContext.
 * Ya NO lee solvex_token — usa la sesión centralizada en korpia_auth.
 * La protección de rutas la gestiona dashboard/layout.tsx.
 */
export function useAuth() {
    const router = useRouter();
    const { auth, logout: appLogout } = useApp();

    const empresa = auth.empresa ?? 'SOLVEX';
    const companySlug = empresa.toLowerCase().replace(/\s+/g, '-');

    const user: AuthUser | null = auth.isAuthenticated
        ? {
              id: 'local',
              name: auth.userName || 'Usuario',
              email: '',
              role: auth.role ?? 'user',
          }
        : null;

    const company: AuthCompany | null = auth.isAuthenticated
        ? {
              id: companySlug,
              name: empresa,
              slug: companySlug,
          }
        : null;

    const logout = useCallback(() => {
        appLogout();
        router.push('/login');
    }, [appLogout, router]);

    return {
        user,
        company,
        token: auth.isAuthenticated ? 'local-auth' : null,
        ready: auth.isAuthenticated,
        logout,
        companySlug,
        isAdmin: auth.role === 'superadmin',
    };
}
