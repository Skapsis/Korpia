'use client';

import { useState, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';

// Lazy load Recharts components
const BarChart = lazy(() => import('recharts').then(mod => ({ default: mod.BarChart })));
const Bar = lazy(() => import('recharts').then(mod => ({ default: mod.Bar })));
const LineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));
const Line = lazy(() => import('recharts').then(mod => ({ default: mod.Line })));
const XAxis = lazy(() => import('recharts').then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import('recharts').then(mod => ({ default: mod.YAxis })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const Legend = lazy(() => import('recharts').then(mod => ({ default: mod.Legend })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));
const CartesianGrid = lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })));

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

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
};

// Helper function to format currency
const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
};

// Helper function to format full currency for exports
const formatFullCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

// Export to CSV function
const exportToCSV = (data: DailyRecord[], dateRange: DateRange) => {
    // Prepare CSV headers
    const headers = ['Fecha', 'Potenciales', 'Presupuestos Cantidad', 'Presupuestos Valor'];
    
    // Prepare CSV rows
    const rows = data.map(record => [
        new Date(record.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        record.potenciales || 0,
        record.presupuestos_cantidad || 0,
        record.presupuestos_valor || 0
    ]);
    
    // Add summary row
    const totalPotenciales = data.reduce((sum, r) => sum + (r.potenciales || 0), 0);
    const totalPresupuestos = data.reduce((sum, r) => sum + (r.presupuestos_cantidad || 0), 0);
    const totalValor = data.reduce((sum, r) => sum + (r.presupuestos_valor || 0), 0);
    
    rows.push([]);
    rows.push(['TOTALES', totalPotenciales, totalPresupuestos, totalValor]);
    
    // Convert to CSV string
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `Solvex_Comercial_${dateRange.startDate}_${dateRange.endDate}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Custom Tooltip Component for Charts
interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    type?: 'currency' | 'number';
}

function CustomTooltip({ active, payload, label, type = 'number' }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border-2 border-slate-200 rounded-xl shadow-2xl p-4 min-w-[200px]">
                <p className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-200 pb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 py-1">
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium text-slate-700">{entry.name}:</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                            {type === 'currency' 
                                ? formatFullCurrency(entry.value * (entry.name.includes('$M') ? 1000000 : 1))
                                : entry.value
                            }
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

// Date Range Picker Component
interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
}

function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    return (
        <div className="flex items-center gap-4 bg-white rounded-xl border-2 border-slate-200 px-5 py-3 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-slate-600">Desde:</span>
                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                />
            </div>
            
            <div className="w-px h-6 bg-slate-300"></div>
            
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">Hasta:</span>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                />
            </div>
            
            <button
                onClick={() => onDateRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' })}
                className="ml-2 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
                Todo el mes
            </button>
        </div>
    );
}

export default function CommercialBoardPage() {
    // State for date range - initialize with current month
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: '2026-02-01',
        endDate: '2026-02-18'
    });

    // State for showing/hiding metas (targets) in charts
    const [showMetas, setShowMetas] = useState(true);

    // Handle legend click to toggle meta visibility
    const handleLegendClick = (data: any) => {
        if (data.dataKey === 'Meta' || data.dataKey === 'Meta ($M)') {
            setShowMetas(!showMetas);
        }
    };

    // Filter data based on selected date range
    const filteredData = useMemo(() => 
        filterDataByDateRange(dailyData, dateRange),
        [dateRange]
    );

    // Calculate KPIs from filtered data
    const kpis = useMemo(() => 
        calculateKPIs(filteredData, dateRange),
        [filteredData, dateRange]
    );

    // Prepare data for charts with dates
    const presupuestosChartData = useMemo(() => 
        filteredData.map(item => ({
            fecha: formatDate(item.fecha),
            Meta: dailyTargets.presupuestos_cantidad,
            Creados: item.presupuestos_cantidad || 0
        })),
        [filteredData]
    );

    const valorChartData = useMemo(() => 
        filteredData.map(item => ({
            fecha: formatDate(item.fecha),
            'Meta ($M)': dailyTargets.presupuestos_valor / 1000000,
            'Valor Real ($M)': (item.presupuestos_valor || 0) / 1000000
        })),
        [filteredData]
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Link 
                        href="/dashboard"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900">Tablero Comercial</h1>
                </div>
                <div className="flex items-center justify-between ml-14">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <p className="text-slate-500 text-sm font-medium">
                            SOLVEX · Análisis Personalizado
                        </p>
                    </div>
                    
                    {/* Date Range Picker and Export Button */}
                    <div className="flex items-center gap-4">
                        <DateRangePicker 
                            dateRange={dateRange} 
                            onDateRangeChange={setDateRange}
                        />
                        
                        {/* Export to Excel Button */}
                        <button
                            onClick={() => exportToCSV(filteredData, dateRange)}
                            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Exportar a Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Card 1: Nuevos Potenciales */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">
                                Nuevos Potenciales
                            </p>
                            <h2 className="text-4xl font-black text-slate-900">
                                {kpis.potenciales.cumplimiento.toFixed(0)}%
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm font-medium">
                        <span className="text-blue-600 font-bold">{kpis.potenciales.total}</span> logrados / 
                        <span className="text-slate-400"> {kpis.potenciales.meta} meta</span>
                    </p>
                </div>

                {/* Card 2: Presupuestos Creados */}
                <div className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border-2 border-violet-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">
                                # Presupuestos Creados
                            </p>
                            <h2 className="text-4xl font-black text-slate-900">
                                {kpis.presupuestos_cantidad.total}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-medium">Meta: {kpis.presupuestos_cantidad.meta}</span>
                            <span className="text-violet-600 font-bold">{kpis.presupuestos_cantidad.cumplimiento.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-violet-500 to-violet-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(kpis.presupuestos_cantidad.cumplimiento, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Valor de Presupuestos */}
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                $ Valor de Presupuestos
                            </p>
                            <h2 className="text-4xl font-black text-slate-900">
                                {formatCurrency(kpis.presupuestos_valor.total)}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-medium">Meta: {formatCurrency(kpis.presupuestos_valor.meta)}</span>
                            <span className="text-emerald-600 font-bold">{kpis.presupuestos_valor.cumplimiento.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(kpis.presupuestos_valor.cumplimiento, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Bar Chart - Presupuestos Diarios */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Evolución Diaria de Presupuestos</h3>
                        <p className="text-sm text-slate-500 mt-1"># de presupuestos creados vs meta diaria</p>
                    </div>
                    <div className="h-[320px]">
                        <Suspense fallback={
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={presupuestosChartData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="fecha" 
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip type="number" />} />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                                        iconType="circle"
                                        onClick={handleLegendClick}
                                        formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
                                    />
                                    <Bar 
                                        dataKey="Meta" 
                                        fill="#cbd5e1" 
                                        name="Meta"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={60}
                                        animationBegin={0}
                                        animationDuration={800}
                                        hide={!showMetas}
                                    />
                                    <Bar 
                                        dataKey="Creados" 
                                        fill="#8b5cf6" 
                                        name="Creados"
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={60}
                                        animationBegin={200}
                                        animationDuration={800}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Suspense>
                    </div>
                </div>

                {/* Chart 2: Line Chart - Valor Monetario */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Valor Monetario Generado vs Meta</h3>
                        <p className="text-sm text-slate-500 mt-1">Valor en millones de pesos por día</p>
                    </div>
                    <div className="h-[320px]">
                        <Suspense fallback={
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        }>                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={valorChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="fecha" 
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        label={{ value: 'Millones ($M)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }}
                                    />
                                    <Tooltip content={<CustomTooltip type="currency" />} />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
                                        iconType="line"
                                        onClick={handleLegendClick}
                                        formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Meta ($M)" 
                                        stroke="#94a3b8" 
                                        name="Meta"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#94a3b8', r: 3 }}
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                        animationBegin={0}
                                        animationDuration={1000}
                                        hide={!showMetas}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Valor Real ($M)" 
                                        stroke="#10b981" 
                                        name="Valor Real"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                                        animationBegin={200}
                                        animationDuration={1000}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Suspense>
                    </div>
                </div>
            </div>

            {/* Daily Details Table */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Detalle Diario</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Mostrando {filteredData.length} días del rango seleccionado
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Potenciales</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Presupuestos</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No hay datos disponibles para el rango seleccionado
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {new Date(record.fecha).toLocaleDateString('es-ES', { 
                                                weekday: 'short', 
                                                day: '2-digit', 
                                                month: 'short' 
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {record.potenciales || 0}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Meta: {dailyTargets.potenciales}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {record.presupuestos_cantidad || 0}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Meta: {dailyTargets.presupuestos_cantidad}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-sm font-bold text-emerald-600">
                                                    {formatCurrency(record.presupuestos_valor || 0)}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Meta: {formatCurrency(dailyTargets.presupuestos_valor)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
