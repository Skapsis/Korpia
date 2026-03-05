'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/dashboard/studio/TopBar';
import { DashboardCanvas } from '@/components/dashboard/studio/DashboardCanvas';
import { RightPropertiesPanel } from '@/components/dashboard/studio/RightPropertiesPanel';
import { DataSourcePanel } from '@/components/dashboard/DataSourcePanel';
import {
  SemanticModelEditor,
  type SemanticModel,
} from '@/components/dashboard/SemanticModelEditor';
import type { Widget, FinancialRecordSerialized, ChartDataRow } from '@/components/dashboard/studio/AnalyticsDashboard';
import type { LayoutItem } from '@/components/dashboard/studio/DashboardCanvas';

/** Convierte filas genéricas del API de DB en formato esperado por el dashboard. */
function normalizeQueryRows(rows: Record<string, unknown>[]): FinancialRecordSerialized[] {
  const get = (row: Record<string, unknown>, ...keys: string[]) => {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(row, k)) return row[k];
    }
    return undefined;
  };
  return rows.map((row, i) => {
    const id = String(get(row, 'id', 'Id') ?? `${i + 1}`);
    const dateRaw = get(row, 'date', 'Date', 'fecha');
    const date = dateRaw != null ? String(dateRaw) : '2024-01-01';
    const revenue = Number(get(row, 'revenue', 'Revenue', 'revenue')) || 0;
    const target = Number(get(row, 'target', 'Target', 'target')) || 0;
    const region = String(get(row, 'region', 'Region', 'region') ?? '');
    const product = String(get(row, 'product', 'Product') ?? '');
    return { id, date, revenue, target, region, product };
  });
}

const MONTH_SHORT: Record<number, string> = {
  0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr', 4: 'May', 5: 'Jun',
  6: 'Jul', 7: 'Ago', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dic',
};

export type Page = {
  id: string;
  name: string;
  widgets: Widget[];
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

const STORAGE_KEY_PREFIX = 'dashboard_data_';
const SEMANTIC_MODEL_KEY_PREFIX = 'semantic_model_';

function loadSemanticModelFromStorage(tableroId: string): SemanticModel | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${SEMANTIC_MODEL_KEY_PREFIX}${tableroId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SemanticModel;
    if (!parsed?.tables) return null;
    return { tables: parsed.tables, relationships: parsed.relationships ?? [] };
  } catch {
    return null;
  }
}

function saveSemanticModelToStorage(tableroId: string, model: SemanticModel) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${SEMANTIC_MODEL_KEY_PREFIX}${tableroId}`, JSON.stringify(model));
}

function loadPagesFromStorage(tableroId: string): Page[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableroId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Page[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePagesToStorage(tableroId: string, pages: Page[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${tableroId}`, JSON.stringify(pages));
}

const INITIAL_PAGES: Page[] = [{ id: 'page-1', name: 'Página 1', widgets: [] }];

export function TableroDetailView({ tableroId, tableroNombre = 'Ventas Totales', initialData = MOCK_INITIAL_DATA }: {
  tableroId: string;
  tableroNombre?: string;
  initialData?: FinancialRecordSerialized[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [currentPageId, setCurrentPageId] = useState<string>('page-1');
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('');
  const [globalFilter, setGlobalFilter] = useState<{ region: string }>({ region: 'All' });
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [dataSourceData, setDataSourceData] = useState<FinancialRecordSerialized[] | null>(null);
  const [isDataSourcePanelOpen, setIsDataSourcePanelOpen] = useState(false);
  const [semanticModel, setSemanticModel] = useState<SemanticModel>(() => ({ tables: [], relationships: [] }));
  const [isSemanticModelOpen, setIsSemanticModelOpen] = useState(false);

  const currentPage = useMemo(() => pages.find((p) => p.id === currentPageId), [pages, currentPageId]);
  const currentWidgets = useMemo(() => currentPage?.widgets ?? [], [currentPage]);

  useEffect(() => {
    const stored = loadPagesFromStorage(tableroId);
    if (stored) {
      setPages(stored);
      setCurrentPageId(stored[0].id);
      const firstWidget = stored[0].widgets[0];
      setSelectedWidgetId(firstWidget?.id ?? '');
    }
  }, [tableroId]);

  useEffect(() => {
    const stored = loadSemanticModelFromStorage(tableroId);
    if (stored) setSemanticModel(stored);
  }, [tableroId]);

  const rawDataForCharts = dataSourceData ?? initialData;
  const chartData: ChartDataRow[] = useMemo(() => {
    return rawDataForCharts.map((r) => {
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
  }, [rawDataForCharts]);

  const regions = useMemo(() => {
    const set = new Set(chartData.map((r) => r.region).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [chartData]);

  const filteredData = useMemo(() => {
    let result = chartData;
    if (globalFilter.region !== 'All') result = result.filter((d) => d.region === globalFilter.region);
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const set = new Set(value);
          result = result.filter((row) => set.has(String((row as Record<string, unknown>)[key])));
        }
      } else if (value && value !== 'Todos') {
        result = result.filter((row) => String((row as Record<string, unknown>)[key]) === value);
      }
    });
    return result;
  }, [chartData, globalFilter.region, activeFilters]);

  const handleFilterChange = useCallback((key: string, value: string | string[]) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value || value === 'Todos';
      if (isEmpty) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const updateCurrentPageWidgets = useCallback((updater: (widgets: Widget[]) => Widget[]) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === currentPageId ? { ...p, widgets: updater(p.widgets) } : p
      )
    );
  }, [currentPageId]);

  const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
    updateCurrentPageWidgets((widgets) =>
      widgets.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, [updateCurrentPageWidgets]);

  const addWidget = useCallback(() => {
    const newId = Date.now().toString();
    updateCurrentPageWidgets((widgets) => {
      const nextY = widgets.length === 0 ? 0 : widgets.reduce((max, w) => Math.max(max, (w.layout?.y ?? 0) + (w.layout?.h ?? 3)), 0);
      return [
        ...widgets,
        { id: newId, type: 'bar', xAxis: null, yAxis: [], colSpan: 1, layout: { x: 0, y: nextY, w: 6, h: 3 } },
      ];
    });
    setSelectedWidgetId(newId);
  }, [updateCurrentPageWidgets]);

  const deleteWidget = useCallback((id: string) => {
    updateCurrentPageWidgets((widgets) => widgets.filter((w) => w.id !== id));
  }, [updateCurrentPageWidgets]);

  useEffect(() => {
    const exists = currentWidgets.some((w) => w.id === selectedWidgetId);
    if (currentWidgets.length > 0 && !exists) setSelectedWidgetId(currentWidgets[0].id);
    if (currentWidgets.length === 0) setSelectedWidgetId('');
  }, [currentWidgets, selectedWidgetId]);

  const toggleColSpan = useCallback((id: string) => {
    updateCurrentPageWidgets((widgets) =>
      widgets.map((w) => (w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w))
    );
  }, [updateCurrentPageWidgets]);

  const handleLayoutChange = useCallback(
    (newLayout: LayoutItem[]) => {
      updateCurrentPageWidgets((widgets) =>
        widgets.map((w) => {
          const item = newLayout.find((l) => l.i === w.id);
          if (!item) return w;
          return {
            ...w,
            layout: { x: item.x, y: item.y, w: item.w, h: item.h },
            colSpan: item.w >= 12 ? 2 : 1,
          };
        })
      );
    },
    [updateCurrentPageWidgets]
  );

  const clearCanvas = useCallback(() => {
    updateCurrentPageWidgets(() => []);
    setSelectedWidgetId('');
  }, [updateCurrentPageWidgets]);

  const addPage = useCallback(() => {
    const newId = Date.now().toString();
    const newName = `Página ${pages.length + 1}`;
    setPages((prev) => [...prev, { id: newId, name: newName, widgets: [] }]);
    setCurrentPageId(newId);
    setSelectedWidgetId('');
  }, [pages.length]);

  const renamePage = useCallback((pageId: string, newName: string) => {
    if (!newName.trim()) return;
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, name: newName.trim() } : p))
    );
    setEditingPageId(null);
  }, []);

  const handleSave = useCallback(() => {
    savePagesToStorage(tableroId, pages);
    toast.success('Guardado exitosamente');
    setIsEditing(false);
  }, [tableroId, pages]);

  const selectedWidget = currentWidgets.find((w) => w.id === selectedWidgetId) ?? null;

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
            <>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setIsDataSourcePanelOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Conectar fuente de datos"
              >
                <span className="material-symbols-outlined text-[18px]">database</span>
                Fuente de datos
              </button>
              <button
                type="button"
                onClick={() => setIsSemanticModelOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-slate-800 dark:bg-slate-700 border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                title="Editar modelo semántico"
              >
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                Modelo Semántico
              </button>
            </>
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

      {/* Modal full-screen Modelo Semántico */}
      {isSemanticModelOpen && (
        <SemanticModelEditor
          model={semanticModel}
          onSave={(model) => {
            setSemanticModel(model);
            saveSemanticModelToStorage(tableroId, model);
            toast.success('Modelo semántico guardado');
          }}
          onClose={() => setIsSemanticModelOpen(false)}
        />
      )}

      {/* Panel deslizante Fuente de datos */}
      {isDataSourcePanelOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDataSourcePanelOpen(false)} aria-hidden />
          <aside className="relative w-full max-w-md bg-slate-900 shadow-2xl flex flex-col">
            <DataSourcePanel
              isOpen
              onClose={() => setIsDataSourcePanelOpen(false)}
              onDataLoaded={(data) => {
                const normalized = normalizeQueryRows(data as Record<string, unknown>[]);
                setDataSourceData(normalized);
                setIsDataSourcePanelOpen(false);
              }}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <DashboardCanvas
          widgets={currentWidgets}
          chartData={filteredData}
          selectedWidgetId={selectedWidgetId}
          setSelectedWidgetId={setSelectedWidgetId}
          onAddWidget={addWidget}
          onDeleteWidget={deleteWidget}
          onToggleColSpan={toggleColSpan}
          isEditing={isEditing}
          fullChartDataForFilters={chartData}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onLayoutChange={handleLayoutChange}
        />
        {isEditing && isRightPanelOpen && (
          <RightPropertiesPanel
            widgets={currentWidgets}
            selectedWidgetId={selectedWidgetId}
            updateWidget={updateWidget}
            onCollapse={() => setIsRightPanelOpen(false)}
            semanticModel={semanticModel}
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

      {/* Barra de pestañas inferior (estilo Excel) */}
      <div className="flex-none h-10 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center px-2 gap-0.5 overflow-x-auto shrink-0 z-10">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-t min-w-0 max-w-[160px] border border-b-0 transition-colors ${
              page.id === currentPageId
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium shadow-sm -mb-px'
                : 'bg-slate-200/80 dark:bg-slate-800/80 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
            }`}
          >
            {editingPageId === page.id ? (
              <input
                type="text"
                value={editingPageName}
                onChange={(e) => setEditingPageName(e.target.value)}
                onBlur={() => renamePage(page.id, editingPageName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renamePage(page.id, editingPageName);
                  if (e.key === 'Escape') setEditingPageId(null);
                }}
                className="flex-1 min-w-0 bg-transparent border-none text-sm focus:ring-0 focus:outline-none px-0 py-0"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => page.id !== currentPageId && setCurrentPageId(page.id)}
                onDoubleClick={() => {
                  setEditingPageId(page.id);
                  setEditingPageName(page.name);
                }}
                className="flex-1 min-w-0 text-left text-sm truncate"
              >
                {page.name}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addPage}
          className="flex items-center justify-center w-8 h-8 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title="Nueva página"
          aria-label="Nueva página"
        >
          <span className="material-symbols-outlined text-xl">add</span>
        </button>
      </div>
    </div>
  );
}
