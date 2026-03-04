'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TopBar } from '@/components/dashboard/studio/TopBar';
import { DashboardCanvas } from '@/components/dashboard/studio/DashboardCanvas';
import { RightPropertiesPanel } from '@/components/dashboard/studio/RightPropertiesPanel';
import type { Widget, FinancialRecordSerialized, ChartDataRow } from '@/components/dashboard/studio/AnalyticsDashboard';

const MONTH_SHORT: Record<number, string> = {
  0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr', 4: 'May', 5: 'Jun',
  6: 'Jul', 7: 'Ago', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dic',
};

/** Mock para tablero: mismo formato que FinancialRecord para que el lienzo funcione. */
const MOCK_INITIAL_DATA: FinancialRecordSerialized[] = [
  { id: '1', date: '2024-01-01', revenue: 42000, target: 40000, region: 'Norte', product: 'A' },
  { id: '2', date: '2024-02-01', revenue: 38500, target: 40000, region: 'Sur', product: 'B' },
  { id: '3', date: '2024-03-01', revenue: 51200, target: 45000, region: 'Norte', product: 'A' },
  { id: '4', date: '2024-04-01', revenue: 47800, target: 48000, region: 'Centro', product: 'C' },
  { id: '5', date: '2024-05-01', revenue: 55100, target: 50000, region: 'Norte', product: 'B' },
  { id: '6', date: '2024-06-01', revenue: 48900, target: 52000, region: 'Sur', product: 'A' },
  { id: '7', date: '2024-07-01', revenue: 62300, target: 55000, region: 'Centro', product: 'B' },
  { id: '8', date: '2024-08-01', revenue: 59800, target: 58000, region: 'Norte', product: 'C' },
  { id: '9', date: '2024-09-01', revenue: 54100, target: 56000, region: 'Sur', product: 'A' },
  { id: '10', date: '2024-10-01', revenue: 67200, target: 60000, region: 'Centro', product: 'B' },
  { id: '11', date: '2024-11-01', revenue: 58900, target: 62000, region: 'Norte', product: 'C' },
  { id: '12', date: '2024-12-01', revenue: 71400, target: 65000, region: 'Sur', product: 'A' },
];

const INITIAL_WIDGET: Widget = {
  id: '1',
  type: 'bar',
  xAxis: 'date',
  yAxis: ['revenue'],
  colSpan: 1,
};

export function TableroDetailView({ tableroId, tableroNombre = 'Ventas Totales', initialData = MOCK_INITIAL_DATA }: {
  tableroId: string;
  tableroNombre?: string;
  initialData?: FinancialRecordSerialized[];
}) {
  const [isEditing, setIsEditing] = useState(false);
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#f6f6f8] dark:bg-[#101622] font-display text-slate-900 dark:text-slate-100">
      <header className="flex h-14 flex-none items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex size-8 items-center justify-center rounded bg-blue-600/20 text-blue-500">
            <span className="material-symbols-outlined text-xl" aria-hidden>analytics</span>
          </Link>
          <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Tablero</span>
          <span className="text-slate-400">|</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{tableroNombre}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Tablero
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              Guardar Cambios
            </button>
          )}
          <button type="button" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" title="Share">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button type="button" className="ml-2 size-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700" aria-label="User" />
        </div>
      </header>

      {isEditing && (
        <TopBar
          onClearCanvas={clearCanvas}
          chartData={filteredData}
          selectedXAxis={selectedWidget?.xAxis ?? null}
          selectedYAxis={selectedWidget?.yAxis ?? []}
          globalFilter={globalFilter}
          regions={regions}
          onGlobalFilterChange={setGlobalFilter}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <DashboardCanvas
          widgets={widgets}
          chartData={filteredData}
          selectedWidgetId={selectedWidgetId}
          setSelectedWidgetId={setSelectedWidgetId}
          onAddWidget={addWidget}
          onDeleteWidget={deleteWidget}
          onToggleColSpan={toggleColSpan}
          isEditing={isEditing}
        />
        {isEditing && isRightPanelOpen && (
          <RightPropertiesPanel
            widgets={widgets}
            selectedWidgetId={selectedWidgetId}
            updateWidget={updateWidget}
            onCollapse={() => setIsRightPanelOpen(false)}
          />
        )}
        {isEditing && !isRightPanelOpen && (
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-lg shadow flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Abrir panel"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
        )}
      </div>
    </div>
  );
}
