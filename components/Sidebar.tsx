'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/useAuth';
import { useApp } from '@/lib/appContext';
import { fetchConfigDynamic, fetchConfig, fetchConfigPublic, Tablero } from '@/lib/configDrivenApi';

export function Sidebar() {
    const pathname = usePathname();
    const { user, company, logout } = useAuth();
    const { auth, systemConfig } = useApp();
    const [localTableros, setLocalTableros] = useState<Tablero[]>([]);
    const [loadingTableros, setLoadingTableros] = useState(false);

    const isSuperAdmin = auth.role === 'superadmin';

    // Usar tableros del systemConfig global si está disponible;
    // de lo contrario, hacer fetch directo como fallback.
    const tableros: Tablero[] = systemConfig?.tableros ?? localTableros;
    const isLoading = !systemConfig && loadingTableros;
    const companySlug = company?.slug ?? null;

    useEffect(() => {
        // Solo hacer fetch propio si systemConfig no está cargado
        if (systemConfig || !auth.isAuthenticated) return;
        loadTableros();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isAuthenticated, companySlug, systemConfig]);

    async function loadTableros() {
        setLoadingTableros(true);
        try {
            const slug = companySlug ?? (auth.empresa ? String(auth.empresa).toLowerCase().replace(/\s+/g, '-') : 'solvex');
            const token = typeof window !== 'undefined' ? localStorage.getItem('solvex_token') : null;
            const config = (token && token !== 'local-auth')
                ? await fetchConfigDynamic()
                : await fetchConfigPublic(slug);
            setLocalTableros(config.tableros ?? []);
        } catch {
            // fallback silencioso
        } finally {
            setLoadingTableros(false);
        }
    }

    function handleLogout() {
        logout();
        toast.success('Sesión cerrada.');
    }

    const navLink = (href: string, emoji: string, label: string, colorActive = 'blue') => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        const activeMap: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-700',
            indigo: 'bg-indigo-50 text-indigo-700',
            purple: 'bg-purple-50 text-purple-700',
            amber: 'bg-amber-50 text-amber-700',
        };
        return (
            <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                    ${isActive ? (activeMap[colorActive] ?? activeMap.blue) : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
                <span className="text-base">{emoji}</span>
                <span className="truncate">{label}</span>
            </Link>
        );
    };

    return (
        <aside className="flex flex-col w-64 bg-white border-r border-slate-200 h-full shadow-sm flex-shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
                <div className="flex items-center justify-center bg-blue-600 w-10 h-10 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 2a3 3 0 110 6 3 3 0 010-6z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-slate-900 font-bold text-lg leading-none">
                        {systemConfig?.empresa?.nombre || company?.name || auth.empresa || 'KORPIA'}
                    </h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Analytics</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-1">

                {/* overview */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">General</p>
                {navLink('/dashboard', '📊', 'Dashboard General')}

                {/* Tableros dinámicos */}
                <div className="pt-4 pb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Tableros</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-3">
                        <div className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                    </div>
                ) : tableros.length === 0 ? (
                    <p className="text-xs text-slate-400 px-3 py-2 italic">Sin tableros configurados</p>
                ) : (
                    tableros.map((t) => navLink(`/dashboard/tablero/${t.id}`, t.icono, t.nombre))
                )}

                {/* Admin */}
                {isSuperAdmin && (
                    <>
                        <div className="pt-4 pb-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Administración</p>
                        </div>
                        {navLink('/dashboard/config', '⚙️', 'Administración', 'indigo')}
                    </>
                )}
            </nav>

            {/* User + Logout */}
            <div className="p-4 border-t border-slate-100">
                {user && (
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{auth.role}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 hover:text-red-600 py-2 text-xs font-bold text-slate-400 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}


