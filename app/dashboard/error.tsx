'use client';

import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Error en dashboard:', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">
                        Error al cargar el dashboard
                    </h2>
                    <p className="text-slate-400 text-sm mb-4">
                        No pudimos cargar los datos del dashboard.
                    </p>
                    {error.message && (
                        <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                            <p className="text-slate-300 text-xs font-mono break-words">
                                {error.message}
                            </p>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                    <a
                        href="/dashboard"
                        className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                        Recargar dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
