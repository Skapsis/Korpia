'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

export function useAuth() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [company, setCompany] = useState<AuthCompany | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('solvex_token');
        const storedUser = localStorage.getItem('solvex_user');
        const storedCompany = localStorage.getItem('solvex_company');

        if (!storedToken) {
            router.replace('/login');
            return;
        }

        setToken(storedToken);
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
        }
        if (storedCompany) {
            try { setCompany(JSON.parse(storedCompany)); } catch { /* ignore */ }
        }
        setReady(true);
    }, [router]);

    const logout = useCallback(() => {
        localStorage.removeItem('solvex_token');
        localStorage.removeItem('solvex_user');
        localStorage.removeItem('solvex_company');
        router.push('/login');
    }, [router]);

    return { user, company, token, ready, logout, companySlug: company?.slug ?? 'solvex' };
}
