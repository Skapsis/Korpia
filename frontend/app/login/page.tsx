'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { login } from '@/lib/queries';
import { getErrorMessage } from '@/lib/errorHandling';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('admin@solvex.com');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Por favor ingresa tu email y contraseña.');
            return;
        }
        setLoading(true);
        try {
            const data = await login(email, password);
            localStorage.setItem('solvex_token', data.token);
            localStorage.setItem('solvex_user', JSON.stringify(data.user));
            if (data.company) {
                localStorage.setItem('solvex_company', JSON.stringify(data.company));
            }
            toast.success(`Bienvenido, ${data.user.name}!`);
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(getErrorMessage(err, 'Error al iniciar sesión. Verifica tus credenciales.'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            {/* Brand Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-500/40 mb-4">
                        <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 2a3 3 0 110 6 3 3 0 010-6z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">SOLVEX</h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium tracking-widest uppercase">Analytics Platform</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-1">Iniciar Sesión</h2>
                    <p className="text-slate-400 text-sm mb-8">Accede a tu panel de análisis</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="admin@solvex.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            )}
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-sm mt-6">
                    © 2025 SOLVEX Analytics · v2.0
                </p>
            </div>
        </div>
    );
}
