'use client';

import { Sidebar } from '@/components/Sidebar';
import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { ready } = useAuth();
    const [sidebarVisible, setSidebarVisible] = useState(true);

    // useAuth handles the redirect to /login if not authenticated
    if (!ready) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 relative">
            {/* Sidebar with transition */}
            <div className={`transition-all duration-300 ease-in-out ${sidebarVisible ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Presentation Toggle Button */}
                <button
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                    className="absolute top-8 left-4 z-50 p-2 bg-white border border-slate-200 rounded-xl shadow-lg hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 group"
                    title={sidebarVisible ? "Modo Presentación" : "Mostrar Menú"}
                >
                    {sidebarVisible ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    )}
                </button>

                <div className={`${!sidebarVisible ? 'pl-12' : ''} transition-all duration-300`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
