'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, RefObject } from 'react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import DrillDownModal from '@/components/DrillDownModal';
import { generateExcelReport } from '@/lib/excelExport';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CSVRecord {
  empresa: string;
  area: string;
  kpi: string;
  semana: string;
  valor_logrado: number;
  valor_meta: number;
  unidad?: string;
}

export interface DashboardData {
  empresa: string;
  mes: string;
  comercial: {
    presupuestos_creados: { valor: number; meta: number };
    valor_presupuestos: { valor: number; meta: number };
  };
  operaciones: {
    tiempo_efectivo: { valor: number; meta: number; unidad: string };
    ordenes_ejecutadas: { valor: number; meta: number };
    evolucion_tiempo: { semana: string; meta: number; logrado: number }[];
  };
  calidad: {
    cancelacion_tecnica: { valor: number; meta: number; unidad: string };
    nps: { valor: number; meta: number; unidad: string };
    deficiencias_cerradas: { valor: number; meta: number; unidad: string };
  };
}

interface DashboardContextType {
  data: DashboardData;
  showOpTargets: boolean;
  setShowOpTargets: (v: boolean) => void;
  formatCurrency: (val: number) => string;
  handleOpenDetails: (category: string, title: string) => void;
  triggerFileUpload: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleExport: (section: string) => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────
export const initialData: DashboardData = {
  empresa: 'SOLVEX',
  mes: 'Febrero',
  comercial: {
    presupuestos_creados: { valor: 39, meta: 80 },
    valor_presupuestos: { valor: 121700000, meta: 200000000 },
  },
  operaciones: {
    tiempo_efectivo: { valor: 71, meta: 70, unidad: '%' },
    ordenes_ejecutadas: { valor: 167, meta: 167 },
    evolucion_tiempo: [
      { semana: 'Week 1', meta: 70, logrado: 60 },
      { semana: 'Week 2', meta: 70, logrado: 33 },
    ],
  },
  calidad: {
    cancelacion_tecnica: { valor: 0, meta: 2, unidad: '%' },
    nps: { valor: 85, meta: 50, unidad: '%' },
    deficiencias_cerradas: { valor: 45, meta: 55, unidad: '%' },
  },
};

// ─── Mock detail data ─────────────────────────────────────────────────────────
const detailedData = {
  sales: [
    { fecha: '02/02/2026', id: 'PR-001', responsable: 'Juan Perez', monto: 15000000, estado: 'Aprobado' },
    { fecha: '05/02/2026', id: 'PR-002', responsable: 'Maria Lopez', monto: 8500000, estado: 'Pendiente' },
    { fecha: '07/02/2026', id: 'PR-003', responsable: 'Carlos Ruiz', monto: 12300000, estado: 'En Revisión' },
    { fecha: '10/02/2026', id: 'PR-004', responsable: 'Ana Gomez', monto: 45000000, estado: 'Aprobado' },
  ],
  operations: [
    { fecha: 'Week 1', id: 'OP-101', responsable: 'Equipo A', detalle: 'Mantenimiento Preventivo', estado: 'Completado' },
    { fecha: 'Week 1', id: 'OP-102', responsable: 'Equipo B', detalle: 'Instalación Fibra', estado: 'En Proceso' },
    { fecha: 'Week 2', id: 'OP-105', responsable: 'Equipo C', detalle: 'Reparación Nodo', estado: 'Pendiente' },
  ],
  quality: [
    { fecha: '03/02/2026', id: 'QA-055', responsable: 'Soporte N2', detalle: 'Falla Masiva Zona Norte', estado: 'Resuelto' },
    { fecha: '06/02/2026', id: 'QA-058', responsable: 'Tec. Campo', detalle: 'Intermitencia Cliente VIP', estado: 'En Seguimiento' },
  ],
};

const columnsConfig = {
  sales: [
    { header: 'Fecha', key: 'fecha' },
    { header: 'ID Presupuesto', key: 'id' },
    { header: 'Responsable', key: 'responsable' },
    { header: 'Monto', key: 'monto', format: 'currency' },
    { header: 'Estado', key: 'estado' },
  ],
  operations: [
    { header: 'Semana/Fecha', key: 'fecha' },
    { header: 'ID Orden', key: 'id' },
    { header: 'Responsable', key: 'responsable' },
    { header: 'Detalle', key: 'detalle' },
    { header: 'Estado', key: 'estado' },
  ],
  quality: [
    { header: 'Fecha Reporte', key: 'fecha' },
    { header: 'Ticket ID', key: 'id' },
    { header: 'Asignado A', key: 'responsable' },
    { header: 'Incidente', key: 'detalle' },
    { header: 'Estado', key: 'estado' },
  ],
};

// ─── Context ──────────────────────────────────────────────────────────────────
const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [showOpTargets, setShowOpTargets] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalCols, setModalCols] = useState<any[]>([]);

  // ── CSV Processing ────────────────────────────────────────────────────────
  const procesarDatosCSV = (results: any[]) => {
    const csvData = results.filter((row) => row.empresa && row.area && row.kpi);
    if (csvData.length === 0) { toast.error('El CSV no tiene datos válidos'); return; }

    const newState = JSON.parse(JSON.stringify(initialData)) as DashboardData;

    const sumKpi = (area: string, kpiName: string) => {
      const records = csvData.filter((d) => d.area === area && d.kpi === kpiName);
      const logrado = records.reduce((acc: number, curr: any) => acc + (curr.valor_logrado || 0), 0);
      const meta = records.reduce((acc: number, curr: any) => acc + (curr.valor_meta || 0), 0);
      return { logrado, meta, count: records.length };
    };

    const avgKpi = (area: string, kpiName: string) => {
      const records = csvData.filter((d) => d.area === area && d.kpi === kpiName);
      if (records.length === 0) return { logrado: 0, meta: 0 };
      const logrado = records.reduce((acc: number, curr: any) => acc + (curr.valor_logrado || 0), 0) / records.length;
      const meta = records.reduce((acc: number, curr: any) => acc + (curr.valor_meta || 0), 0) / records.length;
      return { logrado: parseFloat(logrado.toFixed(1)), meta: parseFloat(meta.toFixed(1)) };
    };

    // Comercial
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

    // Operaciones
    const tiempoEfectivo = avgKpi('Operaciones', 'Tiempo Efectivo');
    const ordenes = sumKpi('Operaciones', 'Ordenes Ejecutadas');
    const evolutionData = csvData
      .filter((d: any) => d.area === 'Operaciones' && d.kpi === 'Tiempo Efectivo')
      .map((d: any) => ({ semana: d.semana || 'Week ?', meta: d.valor_meta, logrado: d.valor_logrado }));

    if (csvData.some((d: any) => d.area === 'Operaciones')) {
      newState.operaciones.tiempo_efectivo.valor = tiempoEfectivo.logrado;
      newState.operaciones.tiempo_efectivo.meta = tiempoEfectivo.meta;
      newState.operaciones.ordenes_ejecutadas.valor = ordenes.logrado;
      newState.operaciones.ordenes_ejecutadas.meta = ordenes.meta;
      if (evolutionData.length > 0) newState.operaciones.evolucion_tiempo = evolutionData;
    }

    // Calidad
    const nps = avgKpi('Calidad', 'NPS');
    const cancelacion = avgKpi('Calidad', 'Cancelacion Tecnica');
    const deficiencias = avgKpi('Calidad', 'Deficiencias Cerradas');
    if (csvData.some((d: any) => d.area === 'Calidad')) {
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
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results: Papa.ParseResult<CSVRecord>) => procesarDatosCSV(results.data),
      error: () => toast.error('Error al leer el archivo CSV'),
    });
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  // Auto-load default CSV on mount
  useEffect(() => {
    fetch('/datos_solvex_limpio.csv')
      .then((r) => (r.ok ? r.text() : null))
      .then((csvText) => {
        if (!csvText) return;
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<CSVRecord>) => {
            if (results.data && results.data.length > 0) procesarDatosCSV(results.data);
          },
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = (section: string) => {
    let reportTitle = `Reporte General - ${data.empresa}`;
    let exportData: any[] = [];
    let exportColumns: any[] = [];

    if (section === 'general' || section === 'comercial') {
      reportTitle = `Reporte Comercial - ${data.empresa}`;
      exportData = detailedData.sales;
      exportColumns = columnsConfig.sales;
    } else if (section === 'operaciones') {
      reportTitle = `Reporte Operaciones - ${data.empresa}`;
      exportData = detailedData.operations;
      exportColumns = columnsConfig.operations;
    } else if (section === 'calidad') {
      reportTitle = `Reporte Calidad - ${data.empresa}`;
      exportData = detailedData.quality;
      exportColumns = columnsConfig.quality;
    }

    generateExcelReport(
      reportTitle,
      section.charAt(0).toUpperCase() + section.slice(1),
      exportColumns,
      exportData,
      `Periodo: ${data.mes} - Generado el ${new Date().toLocaleDateString()}`
    );
  };

  // ── Drill Down ────────────────────────────────────────────────────────────
  const handleOpenDetails = (category: string, title: string) => {
    setModalTitle(`Detalle de: ${title}`);
    let selectedData: any[] = [];
    let selectedCols: any[] = [];

    if (category === 'sales') { selectedData = detailedData.sales; selectedCols = columnsConfig.sales; }
    else if (category === 'operations') { selectedData = detailedData.operations; selectedCols = columnsConfig.operations; }
    else if (category === 'quality') { selectedData = detailedData.quality; selectedCols = columnsConfig.quality; }

    setModalData(selectedData);
    setModalCols(selectedCols);
    setIsModalOpen(true);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(val);

  return (
    <DashboardContext.Provider
      value={{ data, showOpTargets, setShowOpTargets, formatCurrency, handleOpenDetails, triggerFileUpload, handleFileUpload, fileInputRef, handleExport }}
    >
      {children}
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      <DrillDownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        data={modalData}
        columns={modalCols}
      />
    </DashboardContext.Provider>
  );
}
