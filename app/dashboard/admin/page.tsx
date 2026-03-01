'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirige a la página unificada de Administración */
export default function AdminPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/config');
    }, [router]);
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
    );
}
