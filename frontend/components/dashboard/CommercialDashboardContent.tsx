'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';

// Tipos para la estructura de datos
interface DailyRecord {
    id: number;
    fecha: string;
    potenciales?: number;
    presupuestos_cantidad?: number;
    presupuestos_valor?: number;
}

interface DateRange {
    startDate: string;
    endDate: string;
}

// Mock Data - Daily transactional data
const dailyData: DailyRecord[] = [
    { id: 1, fecha: "2026-02-02", potenciales: 3, presupuestos_cantidad: 5, presupuestos_valor: 30000000 },
    { id: 2, fecha: "2026-02-03", potenciales: 2, presupuestos_cantidad: 4, presupuestos_valor: 25000000 },
    { id: 3, fecha: "2026-02-04", potenciales: 3, presupuestos_cantidad: 3, presupuestos_valor: 18000000 },
    { id: 4, fecha: "2026-02-05", potenciales: 2, presupuestos_cantidad: 8, presupuestos_valor: 45000000 },
    { id: 5, fecha: "2026-02-06", potenciales: 1, presupuestos_cantidad: 2, presupuestos_valor: 15000000 },
    { id: 6, fecha: "2026-02-07", potenciales: 4, presupuestos_cantidad: 3, presupuestos_valor: 22000000 },
    { id: 7, fecha: "2026-02-09", potenciales: 3, presupuestos_cantidad: 6, presupuestos_valor: 35000000 },
    { id: 8, fecha: "2026-02-10", potenciales: 2, presupuestos_cantidad: 4, presupuestos_valor: 28000000 },
    { id: 9, fecha: "2026-02-11", potenciales: 1, presupuestos_cantidad: 3, presupuestos_valor: 19000000 },
    { id: 10, fecha: "2026-02-12", potenciales: 5, presupuestos_cantidad: 10, presupuestos_valor: 26700000 },
    { id: 11, fecha: "2026-02-13", potenciales: 2, presupuestos_cantidad: 5, presupuestos_valor: 31000000 },
    { id: 12, fecha: "2026-02-14", potenciales: 1, presupuestos_cantidad: 3, presupuestos_valor: 12000000 },
    { id: 13, fecha: "2026-02-16", potenciales: 3, presupuestos_cantidad: 7, presupuestos_valor: 38000000 },
    { id: 14, fecha: "2026-02-17", potenciales: 2, presupuestos_cantidad: 4, presupuestos_valor: 22000000 },
    { id: 15, fecha: "2026-02-18", potenciales: 4, presupuestos_cantidad: 6, presupuestos_valor: 41000000 },
];

// Metas diarias (average per business day)
const dailyTargets = {
    potenciales: 2,
    presupuestos_cantidad: 4,
    presupuestos_valor: 10000000 // $10M per day
};

// Utility functions
const filterDataByDateRange = (data: DailyRecord[], dateRange: DateRange): DailyRecord[] => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    return data.filter(record => {
        const recordDate = new Date(record.fecha);
        return recordDate >= start && recordDate <= end;
    });
};

const calculateKPIs = (filteredData: DailyRecord[], dateRange: DateRange) => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const totalPotenciales = filteredData.reduce((sum, record) => sum + (record.potenciales || 0), 0);
    const totalPresupuestosCantidad = filteredData.reduce((sum, record) => sum + (record.presupuestos_cantidad || 0), 0);
    const totalPresupuestosValor = filteredData.reduce((sum, record) => sum + (record.presupuestos_valor || 0), 0);
    
    const metaPotenciales = dailyTargets.potenciales * daysDiff;
    const metaPresupuestosCantidad = dailyTargets.presupuestos_cantidad * daysDiff;
    const metaPresupuestosValor = dailyTargets.presupuestos_valor * daysDiff;
    
    return {
        potenciales: {
            total: totalPotenciales,
            meta: metaPotenciales,
            cumplimiento: metaPotenciales > 0 ? (totalPotenciales / metaPotenciales) * 100 : 0
        },
        presupuestos_cantidad: {
            total: totalPresupuestosCantidad,
            meta: metaPresupuestosCantidad,
            cumplimiento: metaPresupuestosCantidad > 0 ? (totalPresupuestosCantidad / metaPresupuestosCantidad) * 100 : 0
        },
        presupuestos_valor: {
            total: totalPresupuestosValor,
            meta: metaPresupuestosValor,
            cumplimiento: metaPresupuestosValor > 0 ? (totalPresupuestosValor / metaPresupuestosValor) * 100 : 0
        }
    };
};

// KPI Card Component
const KPICard = ({ title, value, target, unit, trend, isCurrency = false }: any) => {
    const isPositive = trend >= 100;
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                    {Math.round(trend)}% Meta
                </span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-slate-900">{value}{unit}</span>
                <span className="text-sm text-slate-400">Meta: {target}{unit}</span>
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                        isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(trend, 100)}%` }}
                />
            </div>
        </div>
    );
};

export default function CommercialDashboardContent() {
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: "2026-02-01",
        endDate: "2026-02-28"
    });
    
    const [showTargets, setShowTargets] = useState(true);

    const filteredData = useMemo(() => filterDataByDateRange(dailyData, dateRange), [dateRange]);
    const kpis = useMemo(() => calculateKPIs(filteredData, dateRange), [filteredData, dateRange]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
    };

    const chartDataFormatted = useMemo(() => {
        return filteredData.map(record => ({
            fecha: record.fecha,
            "Valor Presupuestado": record.presupuestos_valor,
            "Meta Valor": 10000000, 
            "Cantidad Presupuestos": record.presupuestos_cantidad,
            "Meta Cantidad": 4 
        }));
    }, [filteredData]);

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center mb-6">
                <button 
                    onClick={() => setShowTargets(!showTargets)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        showTargets 
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {showTargets ? 'Ocultar Metas' : 'Mostrar Metas'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard 
                    title="Oportunidades Potenciales" 
                    value={kpis.potenciales.total} 
                    target={kpis.potenciales.meta}
                    unit=""
                    trend={kpis.potenciales.cumplimiento}
                />
                <KPICard 
                    title="Presupuestos Emitidos" 
                    value={kpis.presupuestos_cantidad.total} 
                    target={kpis.presupuestos_cantidad.meta}
                    unit=""
                    trend={kpis.presupuestos_cantidad.cumplimiento}
                />
                <KPICard 
                    title="Valor Presupuestado" 
                    value={formatCurrency(kpis.presupuestos_valor.total)} 
                    target={formatCurrency(kpis.presupuestos_valor.meta)}
                    unit=""
                    trend={kpis.presupuestos_valor.cumplimiento}
                    isCurrency
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Valor Presupuestos Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolución Valor Presupuestado</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartDataFormatted}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="fecha" 
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                                    fontSize={12}
                                />
                                <YAxis 
                                    tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                                    fontSize={12}
                                />
                                <Tooltip 
                                    formatter={(value: any) => formatCurrency(value as number)}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                />
                                <Legend />
                                <Bar dataKey="Valor Presupuestado" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                {showTargets && <Bar dataKey="Meta Valor" fill="#e5e7eb" radius={[4, 4, 0, 0]} />} 
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cantidad Presupuestos Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Volumen de Presupuestos</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartDataFormatted}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="fecha" 
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })}
                                    fontSize={12}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip 
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="Cantidad Presupuestos" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                {showTargets && <Line type="monotone" dataKey="Meta Cantidad" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

