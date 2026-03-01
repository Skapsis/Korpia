'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AppProvider } from '@/lib/appContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 2, // 2 min
                retry: 1,
            },
        },
    }));

    return (
        <AppProvider>
            <ErrorBoundary message="Error al cargar este módulo.">
                <QueryClientProvider client={queryClient}>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            className: '',
                            style: {
                                background: '#1e293b',
                                color: '#f8fafc',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                fontSize: '14px',
                            },
                            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                        }}
                    />
                </QueryClientProvider>
            </ErrorBoundary>
        </AppProvider>
    );
}
