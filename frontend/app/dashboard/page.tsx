'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Download, BarChart3, Users, CheckCircle, Activity, Briefcase, Upload } from 'lucide-react';
import CommercialDashboardContent from '@/components/dashboard/CommercialDashboardContent';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import DrillDownModal from '@/components/DrillDownModal';
import { generateExcelReport } from '../../lib/excelExport';
import DateRangeFilter from '@/components/DateRangeFilter';
import Papa from 'papaparse';
import { toast, Toaster } from 'react-hot-toast';

// Interfaces for CSV Data
interface CSVRecord {
  empresa: string;
  area: string;
  kpi: string;
  semana: string;
  valor_logrado: number;
  valor_meta: number;
  unidad?: string;
}

// Mock Data for Drill Down
const detailedData = {
  sales: [
    { fecha: "02/02/2026", id: "PR-001", responsable: "Juan Perez", monto: 15000000, estado: "Aprobado" },
    { fecha: "05/02/2026", id: "PR-002", responsable: "Maria Lopez", monto: 8500000, estado: "Pendiente" },
    { fecha: "07/02/2026", id: "PR-003", responsable: "Carlos Ruiz", monto: 12300000, estado: "En Revisión" },
    { fecha: "10/02/2026", id: "PR-004", responsable: "Ana Gomez", monto: 45000000, estado: "Aprobado" },
  ],
  operations: [
    { fecha: "Week 1", id: "OP-101", responsable: "Equipo A", detalle: "Mantenimiento Preventivo", estado: "Completado" },
    { fecha: "Week 1", id: "OP-102", responsable: "Equipo B", detalle: "Instalación Fibra", estado: "En Proceso" },
    { fecha: "Week 2", id: "OP-105", responsable: "Equipo C", detalle: "Reparación Nodo", estado: "Pendiente" },
  ],
  quality: [
    { fecha: "03/02/2026", id: "QA-055", responsable: "Soporte N2", detalle: "Falla Masiva Zona Norte", estado: "Resuelto" },
    { fecha: "06/02/2026", id: "QA-058", responsable: "Tec. Campo", detalle: "Intermitencia Cliente VIP", estado: "En Seguimiento" },
  ]
};

const columnsConfig = {
  sales: [
    { header: "Fecha", key: "fecha" },
    { header: "ID Presupuesto", key: "id" },
    { header: "Responsable", key: "responsable" },
    { header: "Monto", key: "monto", format: "currency" },
    { header: "Estado", key: "estado" },
  ],
  operations: [
    { header: "Semana/Fecha", key: "fecha" },
    { header: "ID Orden", key: "id" },
    { header: "Responsable", key: "responsable" },
    { header: "Detalle", key: "detalle" },
    { header: "Estado", key: "estado" },
  ],
  quality: [
    { header: "Fecha Reporte", key: "fecha" },
    { header: "Ticket ID", key: "id" },
    { header: "Asignado A", key: "responsable" },
    { header: "Incidente", key: "detalle" },
    { header: "Estado", key: "estado" },
  ]
};

// Global Data Source (Initial State)
const initialData = {
  empresa: "SOLVEX",
  mes: "Febrero",
  comercial: {
    presupuestos_creados: { valor: 39, meta: 80 },
    valor_presupuestos: { valor: 121700000, meta: 200000000 }
  },
  operaciones: {
    tiempo_efectivo: { valor: 71, meta: 70, unidad: "%" },
    ordenes_ejecutadas: { valor: 167, meta: 167 },
    evolucion_tiempo: [
      { semana: "Week 1", meta: 70, logrado: 60 },
      { semana: "Week 2", meta: 70, logrado: 33 }
    ]
  },
  calidad: {
    cancelacion_tecnica: { valor: 0, meta: 2, unidad: "%" },
    nps: { valor: 85, meta: 50, unidad: "%" },
    deficiencias_cerradas: { valor: 45, meta: 55, unidad: "%" }
  }
};


export default function ConsolidatedDashboard() {
  const [data, setData] = useState(initialData);
  const [showOpTargets, setShowOpTargets] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalCols, setModalCols] = useState<any[]>([]);

const procesarDatosCSV = (results: any[]) => {
    // Filter out rows that don't match our structure or are empty
    const csvData = results.filter(row => row.empresa && row.area && row.kpi);

    if (csvData.length === 0) {
        toast.error('El CSV no tiene datos válidos');
        return;
    }

    // Clone current structure
    const newState = JSON.parse(JSON.stringify(initialData));
    
    // Helper to sum values for a given KPI
    const sumKpi = (area: string, kpiName: string) => {
        const records = csvData.filter(d => d.area === area && d.kpi === kpiName);
        const logrado = records.reduce((acc, curr) => acc + (curr.valor_logrado || 0), 0);
        const meta = records.reduce((acc, curr) => acc + (curr.valor_meta || 0), 0);
        return { logrado, meta, count: records.length };
    };

    // Helper to average values (for percentages)
    const avgKpi = (area: string, kpiName: string) => {
        const records = csvData.filter(d => d.area === area && d.kpi === kpiName);
        if (records.length === 0) return { logrado: 0, meta: 0 };
        const logrado = records.reduce((acc, curr) => acc + (curr.valor_logrado || 0), 0) / records.length;
        const meta = records.reduce((acc, curr) => acc + (curr.valor_meta || 0), 0) / records.length;
        return { logrado: parseFloat(logrado.toFixed(1)), meta: parseFloat(meta.toFixed(1)) };
    };

    // ------ Process Commercial (Summable) ------
    const presCreados = sumKpi('Comercial', 'Presupuestos Creados');
    if (presCreados.count > 0) {
        newState.comercial.presupuestos_creados.valor = presCreados.logrado;
        newState.comercial.presupuestos_creados.meta = presCreados.meta;
    }

    const valorPres = sumKpi('Comercial', 'Valor Presupuestos');
    if (valorPres.count > 0) {
        newState.comercial.valor_presupuestos.valor = valorPres.logrado;
        newState.comercial.valor_presupuestos.meta = valorPres.meta;
    }

    // ------ Process Operations ------
    // Tiempo Efectivo is a percentage, so we AVERAGE it across weeks
    const tiempoEfectivo = avgKpi('Operaciones', 'Tiempo Efectivo');
    // Ordenes Ejecutadas is a count, so we SUM it
    const ordenes = sumKpi('Operaciones', 'Ordenes Ejecutadas');
    
    // Evolution Graph Data - Mapped directly from rows
    // We look for 'Tiempo Efectivo' rows specifically to populate the graph
    const evolutionData = csvData
        .filter(d => d.area === 'Operaciones' && d.kpi === 'Tiempo Efectivo')
        .map(d => ({
            semana: d.semana || 'Week ?',
            meta: d.valor_meta,
            logrado: d.valor_logrado
        }));

    // If we have data, update state
    const hasOpsData = csvData.some(d => d.area === 'Operaciones');
    if (hasOpsData) {
        newState.operaciones.tiempo_efectivo.valor = tiempoEfectivo.logrado;
        newState.operaciones.tiempo_efectivo.meta = tiempoEfectivo.meta;
        newState.operaciones.ordenes_ejecutadas.valor = ordenes.logrado;
        newState.operaciones.ordenes_ejecutadas.meta = ordenes.meta;
        
        if (evolutionData.length > 0) {
            newState.operaciones.evolucion_tiempo = evolutionData;
        }
    }

    // ------ Process Quality (Averages) ------
    const nps = avgKpi('Calidad', 'NPS');
    const cancelacion = avgKpi('Calidad', 'Cancelacion Tecnica'); // Note: CSV might use "Cancelación" or "Cancelacion"
    const deficiencias = avgKpi('Calidad', 'Deficiencias Cerradas');

    if (csvData.some(d => d.area === 'Calidad')) {
        newState.calidad.nps.valor = nps.logrado;
        newState.calidad.nps.meta = nps.meta;
        
        newState.calidad.cancelacion_tecnica.valor = cancelacion.logrado;
        newState.calidad.cancelacion_tecnica.meta = cancelacion.meta;
        
        newState.calidad.deficiencias_cerradas.valor = deficiencias.logrado;
        newState.calidad.deficiencias_cerradas.meta = deficiencias.meta;
    }

    setData(newState);
    toast.success('Datos actualizados correctamente');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
           console.log('Parsed Results:', results.data);
           procesarDatosCSV(results.data as CSVRecord[]);
        },
        error: (error) => {
            console.error('Error parsing CSV:', error);
            toast.error('Error al leer el archivo CSV');
        }
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Load default CSV on mount
  useEffect(() => {
    const defaultCsvUrl = '/datos_solvex_limpio.csv';
    
    fetch(defaultCsvUrl)
        .then(response => {
            if (!response.ok) {
                console.log("No default CSV found or error loading it.");
                return null;
            }
            return response.text();
        })
        .then(csvText => {
            if (!csvText) return;
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                     // Auto-process if valid data found
                     if (results.data && results.data.length > 0) {
                        console.log("Auto-loading CSV data...");
                        procesarDatosCSV(results.data);
                     }
                },
                error: (err: any) => console.error("Error parsing default CSV:", err)
            });
        })
        .catch((err: any) => console.error("Error fetching default CSV:", err));
  }, []);

  // Export Handler
  const handleExport = () => {
    let reportTitle = `Reporte General - ${data.empresa}`;
    let exportData: any[] = [];
    let exportColumns: any[] = [];
    
    // Determine data based on active tab
    // Ideally we would export a summary for "general", but for now let's export Sales as default or all consolidated
    if (activeTab === 'general' || activeTab === 'comercial') {
        reportTitle = `Reporte Comercial - ${data.empresa}`;
        exportData = detailedData.sales;
        exportColumns = columnsConfig.sales;
    } else if (activeTab === 'operaciones') {
        reportTitle = `Reporte Operaciones - ${data.empresa}`;
        exportData = detailedData.operations;
        exportColumns = columnsConfig.operations;
    } else if (activeTab === 'calidad') {
        reportTitle = `Reporte Calidad - ${data.empresa}`;
        exportData = detailedData.quality;
        exportColumns = columnsConfig.quality;
    }

    generateExcelReport(
        reportTitle,
        activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
        exportColumns,
        exportData,
        `Periodo: ${data.mes} - Generado el ${new Date().toLocaleDateString()}`
    );
  };

  // Drill Down Handler
  const handleOpenDetails = (category: string, title: string) => {
    setModalTitle(`Detalle de: ${title}`);
    
    // Select mock data based on category
    let selectedData: any[] = [];
    let selectedCols: any[] = [];
    
    if (category === 'sales') {
        selectedData = detailedData.sales;
        selectedCols = columnsConfig.sales;
    } else if (category === 'operations') {
        selectedData = detailedData.operations;
        selectedCols = columnsConfig.operations;
    } else if (category === 'quality') {
        selectedData = detailedData.quality;
        selectedCols = columnsConfig.quality;
    }
    
    setModalData(selectedData);
    setModalCols(selectedCols);
    setIsModalOpen(true);
  };
  
  // Helper for formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0,
      notation: "compact",
      compactDisplay: "short"
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans text-slate-900">
      
      <Toaster position="top-right" />
      
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Drill Down Modal */}
      <DrillDownModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalTitle} 
        data={modalData} 
        columns={modalCols}
      />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Maestro {data.empresa}</h1>
            <p className="text-slate-500 mt-1">Visión consolidada - Periodo: {data.mes}</p>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={triggerFileUpload}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Cargar Datos (CSV)</span>
            </button>
            <DateRangeFilter />
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md"
            >
                <Download className="w-4 h-4" />
                <span>Exportar Excel</span>
            </button>
        </div>
      </header>

      {/* Tabs System */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Tabs.List className="flex flex-wrap border-b border-slate-200 mb-8" aria-label="Dashboard Sections">
          <Tabs.Trigger 
            value="general" 
            className="group flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-500 hover:text-indigo-600 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-all outline-none"
          >
            <BarChart3 className="w-4 h-4 group-data-[state=active]:text-indigo-600" />
            Resumen General
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="comercial" 
            className="group flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-500 hover:text-indigo-600 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-all outline-none"
          >
            <Briefcase className="w-4 h-4 group-data-[state=active]:text-indigo-600" />
            Comercial
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="operaciones" 
            className="group flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-500 hover:text-indigo-600 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-all outline-none"
          >
            <Activity className="w-4 h-4 group-data-[state=active]:text-indigo-600" />
            Operaciones
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="calidad" 
            className="group flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-500 hover:text-indigo-600 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-all outline-none"
          >
            <CheckCircle className="w-4 h-4 group-data-[state=active]:text-indigo-600" />
            Calidad Técnica
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab Content: Resumen General */}
        <Tabs.Content value="general" className="outline-none animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Comercial */}
                <div onClick={() => handleOpenDetails('sales', 'Cumplimiento Ventas')} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <BigSummaryCard 
                        title="Cumplimiento Ventas"
                        value={formatCurrency(data.comercial.valor_presupuestos.valor)}
                        target={formatCurrency(data.comercial.valor_presupuestos.meta)}
                        headerValue={data.comercial.valor_presupuestos.valor}
                        headerTarget={data.comercial.valor_presupuestos.meta}
                        icon={<Briefcase className="w-6 h-6 text-white" />} 
                        color="indigo"
                        type="currency"
                    />
                </div>

                {/* Card 2: Operaciones */}
                <div onClick={() => handleOpenDetails('operations', 'Tiempo Efectivo Global')} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <BigSummaryCard 
                        title="Tiempo Efectivo Global"
                        value={`${data.operaciones.tiempo_efectivo.valor}%`}
                        target={`${data.operaciones.tiempo_efectivo.meta}%`}
                        headerValue={data.operaciones.tiempo_efectivo.valor}
                        headerTarget={data.operaciones.tiempo_efectivo.meta}
                        icon={<Activity className="w-6 h-6 text-white" />}
                        color="emerald"
                        type="percentage"
                        isBetterHigher={true}
                    />
                </div>

                {/* Card 3: Calidad */}
                <div onClick={() => handleOpenDetails('quality', 'NPS (Satisfacción)')} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <BigSummaryCard 
                        title="NPS (Satisfacción)"
                        value={`${data.calidad.nps.valor}%`}
                        target={`>${data.calidad.nps.meta}%`}
                        headerValue={data.calidad.nps.valor}
                        headerTarget={data.calidad.nps.meta}
                        icon={<Users className="w-6 h-6 text-white" />}
                        color="blue"
                        type="percentage"
                        isBetterHigher={true}
                    />
                </div>
            </div>

        </Tabs.Content>

        {/* Tab Content: Comercial */}
        <Tabs.Content value="comercial" className="outline-none animate-in fade-in duration-300">
            <CommercialDashboardContent />
        </Tabs.Content>

        {/* Tab Content: Operaciones */}
        <Tabs.Content value="operaciones" className="outline-none animate-in fade-in duration-300">
            <div className="space-y-6">
                
                {/* Top Cards for Operations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => handleOpenDetails('operations', 'Tiempo Efectivo')} className="cursor-pointer">
                        <KPICard 
                            title="Tiempo Efectivo de Trabajo"
                            value={`${data.operaciones.tiempo_efectivo.valor}%`}
                            metaLabel={`Meta: ${data.operaciones.tiempo_efectivo.meta}%`}
                            isPositive={data.operaciones.tiempo_efectivo.valor >= data.operaciones.tiempo_efectivo.meta}
                        />
                    </div>
                    <div onClick={() => handleOpenDetails('operations', 'Órdenes Ejecutadas')} className="cursor-pointer">
                        <KPICard 
                            title="Órdenes Ejecutadas"
                            value={data.operaciones.ordenes_ejecutadas.valor}
                            metaLabel={`Meta: ${data.operaciones.ordenes_ejecutadas.meta}`}
                            isPositive={data.operaciones.ordenes_ejecutadas.valor >= data.operaciones.ordenes_ejecutadas.meta}
                        />
                    </div>
                </div>

                {/* Operations Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800">Evolución del Tiempo Efectivo</h3>
                         <button 
                            onClick={() => setShowOpTargets(!showOpTargets)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                showOpTargets ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {showOpTargets ? 'Ocultar Metas' : 'Mostrar Metas'}
                        </button>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={data.operaciones.evolucion_tiempo}
                                // Add click handler to chart
                                onClick={(e: any) => {
                                   if (e && e.activePayload && e.activePayload[0]) {
                                      handleOpenDetails('operations', `Evolución ${e.activePayload[0].payload.semana}`);
                                   }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="semana" fontSize={12} />
                                <YAxis domain={[0, 100]} fontSize={12} tickFormatter={(val) => `${val}%`} />
                                <Tooltip />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="logrado" 
                                  name="Tiempo Logrado %" 
                                  stroke="#10b981" 
                                  strokeWidth={3} 
                                  activeDot={{ 
                                      r: 8, 
                                      onClick: (e: any) => {
                                          e.stopPropagation && e.stopPropagation();
                                          // Note: onClick on activeDot might not fire reliably depending on recharts version/events.
                                          // The Chart onClick is safer.
                                      } 
                                  }} 
                                />
                                {showOpTargets && (
                                     <Line type="step" dataKey="meta" name="Meta %" stroke="#94a3b8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Tabs.Content>

        {/* Tab Content: Calidad */}
        <Tabs.Content value="calidad" className="outline-none animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div onClick={() => handleOpenDetails('quality', 'Cancelación Técnica')} className="cursor-pointer">
                    <KPICard 
                        title="Cancelación por Causas Técnicas"
                        value={`${data.calidad.cancelacion_tecnica.valor}%`}
                        metaLabel={`Meta: <${data.calidad.cancelacion_tecnica.meta}%`}
                        // Lower is better for cancellation. 0 <= 2 is TRUE (Positive/Green)
                        isPositive={data.calidad.cancelacion_tecnica.valor <= data.calidad.cancelacion_tecnica.meta}
                    />
                </div>

                <div onClick={() => handleOpenDetails('quality', 'NPS')} className="cursor-pointer">
                    <KPICard 
                        title="NPS (Satisfacción)"
                        value={`${data.calidad.nps.valor}%`}
                        metaLabel={`Meta: >${data.calidad.nps.meta}%`}
                        isPositive={data.calidad.nps.valor >= data.calidad.nps.meta}
                    />
                </div>

                <div onClick={() => handleOpenDetails('quality', 'Deficiencias')} className="cursor-pointer">
                    <KPICard 
                        title="Resolución de Deficiencias"
                        value={`${data.calidad.deficiencias_cerradas.valor}%`}
                        // "45% vs Meta <55%". 
                        // Assume lower is better based on "Meta < 55%" usually implying "Should be less than".
                        // If target < 55 and value is 45, then 45 < 55 is good.
                        metaLabel={`Meta: <${data.calidad.deficiencias_cerradas.meta}%`}
                        isPositive={data.calidad.deficiencias_cerradas.valor <= data.calidad.deficiencias_cerradas.meta}
                    />
                </div>
            </div>
        </Tabs.Content>

      </Tabs.Root>
    </div>
  );
}

// --- Sub-components ---

function BigSummaryCard({ title, value, target, headerValue, headerTarget, icon, color, type = 'currency', isBetterHigher = true }: any) {
  
  // Calculate percentage for progress bar
  let progressPercentage = 0;
  if (headerTarget > 0) {
      progressPercentage = (headerValue / headerTarget) * 100;
  } else if (headerTarget === 0 && headerValue === 0) {
      progressPercentage = 100; // 0/0 target met?
  }
  
  // Status Logic
  let isSuccess = false;
  if (type === 'currency' || isBetterHigher) {
      isSuccess = headerValue >= headerTarget;
  } else {
      isSuccess = headerValue <= headerTarget;
  }

  // Color mapping
  const colorMap: any = {
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50', bar: 'bg-indigo-500' },
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', bar: 'bg-emerald-500' },
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', bar: 'bg-blue-500' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-600', light: 'bg-rose-50', bar: 'bg-rose-500' },
      amber: { bg: 'bg-amber-600', text: 'text-amber-600', light: 'bg-amber-50', bar: 'bg-amber-500' },
  };

  const theme = colorMap[color] || colorMap.indigo;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute -right-6 -top-6 p-8 rounded-full ${theme.light} opacity-50 group-hover:scale-110 transition-transform`}>
        {/* Decorative circle */}
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${theme.bg} text-white shadow-lg shadow-slate-100`}>
                {icon}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isSuccess ? 'Meta Cumplida' : 'Atención'}
            </span>
        </div>

        <h3 className="text-slate-500 font-medium text-sm mb-1">{title}</h3>
        <div className="flex items-baseline gap-2 mb-4">
             <span className="text-3xl font-bold text-slate-900">{value}</span>
             <span className="text-sm text-slate-400 font-medium">/ {target}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isSuccess ? theme.bar : 'bg-rose-500'}`} 
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
        </div>
        <div className="mt-2 text-xs flex justify-between text-slate-400">
            <span>Progreso Actual</span>
            <span className={`font-bold ${isSuccess ? theme.text : 'text-rose-500'}`}>
                {Math.round(progressPercentage)}%
            </span>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, metaLabel, isPositive }: any) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-all ${isPositive ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <div className={`p-1 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                     {isPositive ? <CheckCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-slate-900">{value}</span>
                <span className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {metaLabel}
                </span>
            </div>
        </div>
    );
}
