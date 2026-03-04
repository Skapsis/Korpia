'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, EMPRESAS, type Empresa } from '@/lib/appContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useApp();

    const [empresa, setEmpresa]   = useState<Empresa>('SOLVEX');
    const [usuario, setUsuario]   = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const sessionMsg = sessionStorage.getItem('korpia_session_msg');
        if (sessionMsg) {
            setError(sessionMsg);
            sessionStorage.removeItem('korpia_session_msg');
        }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!usuario || !password) {
            setError('Por favor ingresa tu usuario y contraseña.');
            return;
        }
        setLoading(true);

        // ── Paso 1: intentar autenticación real contra el backend ────────────
        const companySlug = empresa.toLowerCase().replace(/\s+/g, '-');
        const emailGuess = `${usuario.toLowerCase()}@${companySlug}.com`;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailGuess, password }),
            });

            if (res.ok) {
                const data = await res.json();
                // Guardar JWT real — el interceptor de api.ts lo usará en todas las requests
                localStorage.setItem('solvex_token', data.token);
                if (data.user)   localStorage.setItem('solvex_user', JSON.stringify(data.user));
                if (data.company) localStorage.setItem('solvex_company', JSON.stringify(data.company));

                // Mapear rol del backend al tipo del frontend
                const roleMap: Record<string, 'viewer' | 'gerente' | 'superadmin'> = {
                    superadmin: 'superadmin',
                    admin: 'superadmin',
                    gerente: 'gerente',
                    viewer: 'viewer',
                };
                const realRole = roleMap[data.user?.role] ?? 'viewer';
                login(empresa, data.user?.name ?? usuario, realRole);
                router.push('/dashboard');
                return;
            }

            // Backend disponible pero credenciales incorrectas → mostrar error
            if (res.status === 401 || res.status === 400) {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message ?? 'Credenciales incorrectas.');
                setLoading(false);
                return;
            }
        } catch {
            // Backend no disponible → continuar con login simulado
        }

        // ── Paso 2: fallback — login simulado (sin JWT real) ─────────────────
        await new Promise((r) => setTimeout(r, 400));
        const isAdmin = usuario.toLowerCase() === 'admin' && password === 'admin123';
        if (!isAdmin && password.length < 3) {
            setError('Contraseña incorrecta. (Usa "admin123" para modo admin)');
            setLoading(false);
            return;
        }
        login(empresa, usuario, isAdmin ? 'superadmin' : 'viewer');
        router.push('/dashboard');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="relative w-full max-w-md">
                <div className="mb-12 text-center">
                    <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-600 bg-blue-600">
                        <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 2a3 3 0 110 6 3 3 0 010-6z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Analytics Platform</h1>
                    <p className="label-mini mt-2 text-zinc-400">Multi-empresa</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10">
                    <h2 className="section-title text-zinc-100">Iniciar sesión</h2>
                    <p className="label-mini mt-2 mb-8 text-zinc-400">Selecciona tu empresa y accede al panel</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label-mini mb-2 block text-zinc-400">
                                Empresa
                            </label>
                            <select
                                value={empresa}
                                onChange={(e) => setEmpresa(e.target.value as Empresa)}
                                className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {EMPRESAS.map((emp) => (
                                    <option key={emp} value={emp} className="bg-zinc-800 text-zinc-100">
                                        {emp}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label-mini mb-2 block text-zinc-400">Usuario</label>
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Ingresa tu usuario"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-mini mb-2 block text-zinc-400">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 placeholder-zinc-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="·····"
                                required
                            />
                        </div>

                        {error && (
                            <p className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 py-4 font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-blue-800"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : null}
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>

                <p className="label-mini mt-8 text-center text-zinc-500">
                    2026 Korpia Analytics · Multi-empresa
                </p>
            </div>
        </div>
    );
}
