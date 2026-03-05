'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TopBar } from './TopBar';
import { DashboardCanvas } from './DashboardCanvas';
import { RightPropertiesPanel } from './RightPropertiesPanel';

export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'kpi' | 'filter' | 'area' | 'scatter';

export type AggregationType = 'sum' | 'avg' | 'count';

export type WidgetLayout = { x: number; y: number; w: number; h: number };

export type Widget = {
  id: string;
  type: ChartType;
  xAxis: string | null;
  yAxis: string[];
  colSpan: number;
  /** Agregación para medidas (por defecto 'sum'). Usado en KPI y opcionalmente en otros. */
  aggregation?: AggregationType;
  /** Posición y tamaño en el grid (react-grid-layout). Si no existe, se deriva de colSpan e índice. */
  layout?: WidgetLayout;
};

const MONTH_SHORT: Record<number, string> = {
  0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr', 4: 'May', 5: 'Jun',
  6: 'Jul', 7: 'Ago', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dic',
};

export type FinancialRecordSerialized = {
  id: string;
  date: string;
  revenue: number;
  target: number;
  region: string;
  product: string;
};

export type ChartDataRow = {
  date: string;
  revenue: number;
  target: number;
  region: string;
  product: string;
};

/** Estado inicial: un widget con Date en X y Revenue en Y para que se vea algo al cargar. */
const INITIAL_WIDGET: Widget = {
  id: '1',
  type: 'bar',
  xAxis: 'date',
  yAxis: ['revenue'],
  colSpan: 1,
};

/**
 * Report Builder: múltiples widgets, filtros globales, lienzo en grid.
 */
export function AnalyticsDashboard({ initialData = [] }: { initialData?: FinancialRecordSerialized[] }) {
  const [widgets, setWidgets] = useState<Widget[]>([INITIAL_WIDGET]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('1');
  const [globalFilter, setGlobalFilter] = useState<{ region: string }>({ region: 'All' });
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const chartData: ChartDataRow[] = useMemo(() => {
    return initialData.map((r) => {
      const d = new Date(r.date);
      const monthLabel = MONTH_SHORT[d.getMonth()] ?? r.date.slice(0, 7);
      return {
        date: monthLabel,
        revenue: r.revenue,
        target: r.target,
        region: r.region,
        product: r.product,
      };
    });
  }, [initialData]);

  const regions = useMemo(() => {
    const set = new Set(chartData.map((r) => r.region).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [chartData]);

  const filteredData = useMemo(() => {
    if (globalFilter.region === 'All') return chartData;
    return chartData.filter((d) => d.region === globalFilter.region);
  }, [chartData, globalFilter.region]);

  const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const addWidget = useCallback(() => {
    const newId = Date.now().toString();
    setWidgets((prev) => [...prev, { id: newId, type: 'bar', xAxis: null, yAxis: [], colSpan: 1 }]);
    setSelectedWidgetId(newId);
  }, []);

  const deleteWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  useEffect(() => {
    const exists = widgets.some((w) => w.id === selectedWidgetId);
    if (widgets.length > 0 && !exists) setSelectedWidgetId(widgets[0].id);
    if (widgets.length === 0) setSelectedWidgetId('');
  }, [widgets, selectedWidgetId]);

  const toggleColSpan = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w))
    );
  }, []);

  const clearCanvas = useCallback(() => {
    setWidgets([]);
    setSelectedWidgetId('');
  }, []);

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId) ?? null;

  return (
    <div className="bg-[#f6f6f8] dark:bg-[#101622] font-display text-slate-900 dark:text-slate-100 flex flex-col h-screen overflow-hidden">
      {/* Modo depuración: estado de selección y cantidad de widgets */}
      <div className="absolute top-2 right-2 p-2 bg-black/90 text-green-400 text-xs font-mono z-[100] pointer-events-none opacity-80 rounded border border-green-500/50">
        <pre>{JSON.stringify({ selectedWidgetId, widgetCount: widgets.length }, null, 2)}</pre>
      </div>
      <TopBar
        onClearCanvas={clearCanvas}
        chartData={filteredData}
        selectedXAxis={selectedWidget?.xAxis ?? null}
        selectedYAxis={selectedWidget?.yAxis ?? []}
        globalFilter={globalFilter}
        regions={regions}
        onGlobalFilterChange={setGlobalFilter}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <DashboardCanvas
          widgets={widgets}
          chartData={filteredData}
          selectedWidgetId={selectedWidgetId}
          setSelectedWidgetId={setSelectedWidgetId}
          onAddWidget={() => {
            const newId = Date.now().toString();
            setWidgets((prev) => [...prev, { id: newId, type: 'bar', xAxis: null, yAxis: [], colSpan: 1 }]);
            setSelectedWidgetId(newId);
          }}
          onDeleteWidget={deleteWidget}
          onToggleColSpan={toggleColSpan}
        />
        {isRightPanelOpen && (
          <RightPropertiesPanel
            widgets={widgets}
            selectedWidgetId={selectedWidgetId}
            updateWidget={updateWidget}
            onCollapse={() => setIsRightPanelOpen(false)}
          />
        )}
        {!isRightPanelOpen && (
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-lg shadow flex items-center justify-center text-slate-500 hover:text-[#135bec] hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Abrir panel"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
        )}
      </div>
    </div>
  );
}
