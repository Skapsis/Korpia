'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getKPIs } from '@/lib/queries';
import { useAuth } from '@/lib/useAuth';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import Link from 'next/link';
import toast from 'react-hot-toast';

const typeConfig: Record<string, { title: string; color: string; description: string }> = {
    commercial: {
        title: 'Detalle Comercial',
        color: '#3b82f6',
        description: 'Análisis profundo de potenciales, presupuestos y volumen de ventas.',
    },
    operation: {
        title: 'Detalle de Operaciones',
        color: '#10b981',
        description: 'Eficiencia operativa, tiempos efectivos y estado de órdenes.',
    },
    quality: {
        title: 'Detalle de Calidad',
        color: '#8b5cf6',
        description: 'Métricas de satisfacción (NPS), deficiencias y cancelaciones técnicas.',
    },
};

export default function DetailPage() {
    const params = useParams();
    const router = useRouter();
    const { companySlug } = useAuth();
    const type = params.type as string;
    const config = typeConfig[type] || typeConfig.commercial;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['kpis', companySlug],
        queryFn: () => getKPIs(companySlug),
    });

    if (isLoading) return <div className="p-8 text-center text-slate-400">Cargando detalles...</div>;
    if (isError) return <div className="p-8 text-center text-red-500">Error al cargar datos.</div>;

    const seriesData = data?.series?.[type === 'commercial' ? 'commercial' : type === 'operation' ? 'operations' : 'quality'] || [];
    const reversedData = seriesData.slice().reverse();

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900">{config.title}</h1>
                    <p className="text-slate-400 text-sm mt-1">{config.description}</p>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-800">Evolución Histórica</h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></span>
                            Métrica Principal
                        </span>
                    </div>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reversedData}>
                            <defs>
                                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={config.color} stopOpacity={0.1} />
                                    <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={type === 'commercial' ? 'potenciales' : type === 'operation' ? 'tiempoEfectivo' : 'nps'}
                                stroke={config.color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorMetric)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Datos Desglosados</h3>
                    <button onClick={() => toast('Funcionalidad en desarrollo 🚧', { icon: '⚙️' })} className="text-sm text-blue-600 font-bold hover:underline">Exportar Excel</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-8 py-4">Período</th>
                                {type === 'commercial' ? (
                                    <>
                                        <th className="px-8 py-4 text-right">Potenciales</th>
                                        <th className="px-8 py-4 text-right">Presupuestos</th>
                                        <th className="px-8 py-4 text-right">Monto</th>
                                        <th className="px-8 py-4 text-right">Cumplimiento</th>
                                    </>
                                ) : type === 'operation' ? (
                                    <>
                                        <th className="px-8 py-4 text-right">T. Efectivo</th>
                                        <th className="px-8 py-4 text-right">Órdenes Prog.</th>
                                        <th className="px-8 py-4 text-right">Órdenes Ejec.</th>
                                        <th className="px-8 py-4 text-right">Canc.</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-8 py-4 text-right">NPS</th>
                                        <th className="px-8 py-4 text-right">Conc. Técnicas</th>
                                        <th className="px-8 py-4 text-right">Deficiencias</th>
                                        <th className="px-8 py-4 text-right">Satisfacción</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reversedData.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4 font-bold text-slate-700">{row.period}</td>
                                    {type === 'commercial' ? (
                                        <>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.potenciales}</td>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.presupuestos}</td>
                                            <td className="px-8 py-4 text-right text-slate-500">${row.monto?.toLocaleString()}</td>
                                            <td className="px-8 py-4 text-right">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${row.cumplimiento > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {row.cumplimiento?.toFixed(1)}%
                                                </span>
                                            </td>
                                        </>
                                    ) : type === 'operation' ? (
                                        <>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.tiempoEfectivo?.toFixed(1)}%</td>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.ordenesProgramadas}</td>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.ordenesEjecutadas}</td>
                                            <td className="px-8 py-4 text-right">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${row.cancelaciones < 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {row.cancelaciones}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.nps?.toFixed(0)}</td>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.cancelacionesTecnicas}</td>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.deficiencias}</td>
                                            <td className="px-8 py-4 text-right text-slate-500">{row.satisfaccion?.toFixed(1)}%</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
