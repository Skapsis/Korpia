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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-500/40 mb-4">
                        <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 2a3 3 0 110 6 3 3 0 010-6z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Analytics Platform</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium tracking-widest uppercase">Multi-empresa v3.0</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">Iniciar Sesion</h2>
                    <p className="text-slate-400 text-sm mb-8">Selecciona tu empresa y accede al panel</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Empresa
                            </label>
                            <select
                                value={empresa}
                                onChange={(e) => setEmpresa(e.target.value as Empresa)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                {EMPRESAS.map((emp) => (
                                    <option key={emp} value={emp} className="bg-slate-800 text-white">
                                        {emp}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                            <input
                                type="text"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Ingresa tu usuario"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Contrasena</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="....."
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-2"
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

                <p className="text-center text-slate-600 text-sm mt-6">
                    2026 Korpia Analytics - Multi-empresa
                </p>
            </div>
        </div>
    );
}
