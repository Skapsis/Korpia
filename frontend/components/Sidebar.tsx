'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/useAuth';
import { useApp } from '@/lib/appContext';

interface MenuItem {
    id: string;
    menuKey: string;
    label: string;
    href: string;
    emoji: string;
    icon: string;
    enabled: boolean;
    minRole: string;
}

// Menús por defecto (fallback)
const defaultNavItems: MenuItem[] = [
    {
        id: 'dashboard',
        menuKey: 'dashboard',
        label: 'Dashboard General',
        href: '/dashboard',
        emoji: '📊',
        enabled: true,
        minRole: 'viewer',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />',
    },
    {
        id: 'comercial',
        menuKey: 'comercial',
        label: 'Comercial',
        href: '/dashboard/comercial',
        emoji: '💰',
        enabled: true,
        minRole: 'viewer',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
    },
    {
        id: 'operaciones',
        menuKey: 'operaciones',
        label: 'Operaciones',
        href: '/dashboard/operaciones',
        emoji: '⚙️',
        enabled: true,
        minRole: 'viewer',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
    },
    {
        id: 'calidad',
        menuKey: 'calidad',
        label: 'Calidad Técnica',
        href: '/dashboard/calidad',
        emoji: '🛠️',
        enabled: true,
        minRole: 'viewer',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />',
    },
    {
        id: 'upload',
        menuKey: 'upload',
        label: 'Carga de Datos',
        href: '/dashboard/upload',
        emoji: '📤',
        enabled: true,
        minRole: 'viewer',
        icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />',
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, company, logout, token } = useAuth();
    const { auth } = useApp();
    const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultNavItems);
    const [loading, setLoading] = useState(false);

    // Cargar menús desde configuración
    useEffect(() => {
        if (!auth.isAuthenticated) return;
        loadMenuConfiguration();
    }, [auth.isAuthenticated]);

    const loadMenuConfiguration = async () => {
        // Si no hay token, usar menús por defecto
        if (!token || token === 'local-auth') {
            setMenuItems(filterMenusByRole(defaultNavItems, auth.role));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/configuration/menus', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const menus = data.menus.map((m: any) => ({
                    id: m.id,
                    menuKey: m.menuKey,
                    label: m.label,
                    href: m.path,
                    emoji: m.icon,
                    icon: getIconSVG(m.menuKey),
                    enabled: m.enabled,
                    minRole: m.minRole
                }));
                setMenuItems(filterMenusByRole(menus, auth.role));
            } else {
                // Fallback a menús por defecto
                setMenuItems(filterMenusByRole(defaultNavItems, auth.role));
            }
        } catch (error) {
            console.error('Error loading menu configuration:', error);
            setMenuItems(filterMenusByRole(defaultNavItems, auth.role));
        } finally {
            setLoading(false);
        }
    };

    const filterMenusByRole = (menus: MenuItem[], userRole: string): MenuItem[] => {
        const roleLevel = getRoleLevel(userRole);
        return menus.filter(menu => {
            if (!menu.enabled) return false;
            const minRoleLevel = getRoleLevel(menu.minRole);
            return roleLevel >= minRoleLevel;
        });
    };

    const getRoleLevel = (role: string): number => {
        const levels: Record<string, number> = {
            'viewer': 0,
            'gerente': 1,
            'superadmin': 2,
            'admin': 2
        };
        return levels[role] || 0;
    };

    const getIconSVG = (menuKey: string): string => {
        const icons: Record<string, string> = {
            'dashboard': '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />',
            'comercial': '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />',
            'operaciones': '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />',
            'calidad': '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />',
            'upload': '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />'
        };
        return icons[menuKey] || icons['dashboard'];
    };

    function handleLogout() {
        logout();
        toast.success('Sesión cerrada.');
    }

    const isAdmin = auth.role === 'superadmin';
    const isSuperAdmin = auth.role === 'superadmin';

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
                    <h1 className="text-slate-900 font-bold text-lg leading-none">{company?.name || auth.empresa || 'KORPIA'}</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Analytics</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Menú Principal</p>
                {loading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : (
                    menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" dangerouslySetInnerHTML={{ __html: item.icon }} />
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span>{item.emoji}</span>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })
                )}

                {/* Sección Admin — visible solo para superadmin */}
                {isSuperAdmin && (
                    <>
                        <div className="pt-4 pb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Administración</p>
                        </div>
                        <Link
                            href="/dashboard/admin"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                                ${pathname === '/dashboard/admin'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className={pathname === '/dashboard/admin' ? 'text-indigo-600' : 'text-slate-400'}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span>⚙️</span>
                                Configuración KPIs
                            </span>
                        </Link>
                        <Link
                            href="/dashboard/launcher"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                                ${pathname === '/dashboard/launcher'
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className={pathname === '/dashboard/launcher' ? 'text-purple-600' : 'text-slate-400'}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                                </svg>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span>🚀</span>
                                Admin Launcher
                            </span>
                        </Link>
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
