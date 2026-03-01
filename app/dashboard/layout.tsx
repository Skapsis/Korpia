'use client';

import { Sidebar } from '@/components/Sidebar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/appContext';
import { DashboardProvider } from '@/lib/dashboardContext';
import DashboardHeader from '@/components/DashboardHeader';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { auth } = useApp();
    const router = useRouter();
    const [sidebarVisible, setSidebarVisible] = useState(true);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            router.replace('/login');
        }
    }, [auth.isAuthenticated, router]);

    if (!auth.isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#FAFAFA]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <DashboardProvider>
            <div className="flex h-screen w-full overflow-hidden bg-[#FAFAFA] relative">
                {/* Sidebar with transition */}
                <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${sidebarVisible ? 'w-64' : 'w-0 overflow-hidden'}`}>
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Global Header — always visible */}
                    <DashboardHeader />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto relative">
                        {/* Presentation Toggle Button */}
                        <button
                            onClick={() => setSidebarVisible(!sidebarVisible)}
                            className="absolute top-4 left-4 z-50 p-2 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900"
                            title={sidebarVisible ? 'Modo Presentación' : 'Mostrar Menú'}
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

                        <div className={`${!sidebarVisible ? 'pl-12' : ''} transition-all duration-300 p-8 md:p-10`}>
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </DashboardProvider>
    );
}
