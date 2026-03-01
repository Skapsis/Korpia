'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DynamicDashboard } from '@/components/dashboard/DynamicDashboard';

type ViewMode = 'cards' | 'charts' | 'full';

export default function TableroDynamicPage() {
    const { id } = useParams<{ id: string }>();
    const [mode, setMode] = useState<ViewMode>('cards');

    if (!id) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Barra de modos de vista */}
            <div className="flex items-center gap-1 px-8 pt-6 pb-0">
                {([
                    { key: 'cards',  label: '🃏 Resumen' },
                    { key: 'charts', label: '📈 Gráficos' },
                    { key: 'full',   label: '🔍 Completo' },
                ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setMode(key)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                            mode === key
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Dashboard dinámico */}
            <DynamicDashboard tableroId={id} mode={mode} />
        </div>
    );
}


