'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GridLayout, useContainerWidth } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { ChartType, ChartDataRow, Widget, WidgetLayout } from './AnalyticsDashboard';

const COLORS = ['#135bec', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'];

type WidgetCardProps = {
  widget: Widget;
  isSelected: boolean;
  data: ChartDataRow[];
  onSelect: () => void;
  onDelete: () => void;
  onToggleColSpan: () => void;
  isEditing: boolean;
  fullDataForFilter?: ChartDataRow[];
  activeFilters?: Record<string, string | string[]>;
  onFilterChange?: (key: string, value: string | string[]) => void;
};

function computeKpiValue(
  data: ChartDataRow[],
  field: string,
  aggregation: 'sum' | 'avg' | 'count'
): number {
  if (!data?.length) return 0;
  if (aggregation === 'count') return data.length;
  const total = data.reduce((acc, row) => {
    const val = Number((row as Record<string, unknown>)[field]);
    return acc + (Number.isNaN(val) ? 0 : val);
  }, 0);
  if (aggregation === 'avg') return total / data.length;
  return total;
}

function formatKpiValue(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    notation: Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
  }).format(value);
}

const FILTER_FIELD_LABELS: Record<string, string> = {
  region: 'Región',
  product: 'Producto',
  date: 'Fecha',
};

type FilterWidgetProps = {
  widget: Widget & { title?: string };
  filterField: string;
  uniqueValues: string[];
  currentFilterValue: string | string[] | undefined;
  onFilterChange?: (key: string, value: string | string[]) => void;
};

const FilterWidget = ({
  widget,
  filterField,
  uniqueValues,
  currentFilterValue,
  onFilterChange,
}: FilterWidgetProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Hack para vencer el Stacking Context del Grid
  useEffect(() => {
    if (!dropdownRef.current) return;
    const gridElement =
      dropdownRef.current.closest('.react-grid-item') ||
      dropdownRef.current.closest('[data-grid]') ||
      dropdownRef.current.parentElement?.parentElement?.parentElement;
    const el = gridElement as HTMLElement | null;
    if (el) {
      if (isDropdownOpen) {
        el.style.setProperty('z-index', '99999', 'important');
      } else {
        el.style.removeProperty('z-index');
      }
    }
    return () => {
      if (el) el.style.removeProperty('z-index');
    };
  }, [isDropdownOpen]);

  const currentArray: string[] = Array.isArray(currentFilterValue)
    ? currentFilterValue
    : currentFilterValue
      ? [currentFilterValue]
      : [];

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full h-full flex flex-col justify-center no-drag cancel-drag overflow-visible ${isDropdownOpen ? 'z-[99999]' : 'z-10'}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 truncate cursor-default">
        {widget.title || filterField || 'FILTRO'}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen((open) => !open);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="flex items-center justify-between w-full px-2 py-1.5 bg-white border border-slate-200 rounded shadow-sm text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
      >
        <span className="truncate pr-2">
          {!currentFilterValue ||
          (Array.isArray(currentFilterValue) && currentFilterValue.length === 0)
            ? 'Todos'
            : Array.isArray(currentFilterValue)
              ? currentFilterValue.join(', ')
              : currentFilterValue}
        </span>
        <span className="text-slate-400 text-[10px] shrink-0">▼</span>
      </button>
      {isDropdownOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-600 shadow-2xl ring-1 ring-black/5 rounded-md max-h-56 overflow-y-auto z-[99999] p-1.5 custom-scrollbar no-drag cancel-drag"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <label className="flex items-center px-2 py-1.5 hover:bg-slate-100 cursor-pointer text-xs text-slate-700 rounded transition-colors mb-0.5 w-full">
            <input
              type="checkbox"
              className="mr-2 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              checked={!currentFilterValue || currentArray.length === 0}
              onChange={(e) => {
                e.stopPropagation();
                onFilterChange?.(filterField, []);
              }}
            />
            <span className="font-semibold select-none">Seleccionar todo</span>
          </label>
          {uniqueValues.map((val) => {
            const isChecked = currentArray.includes(val);
            return (
              <label
                key={val}
                className="flex items-center px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 rounded transition-colors w-full"
              >
                <input
                  type="checkbox"
                  className="mr-2 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    const newValues = isChecked
                      ? currentArray.filter((v) => v !== val)
                      : [...currentArray, val];
                    onFilterChange?.(filterField, newValues);
                  }}
                />
                <span className="truncate select-none">{val}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

function WidgetChart({
  widget,
  data,
  fullDataForFilter,
  activeFilters = {},
  onFilterChange,
}: {
  widget: Widget;
  data: ChartDataRow[];
  fullDataForFilter?: ChartDataRow[];
  activeFilters?: Record<string, string | string[]>;
  onFilterChange?: (key: string, value: string | string[]) => void;
}) {
  const { type: chartType, xAxis: selectedXAxis, yAxis: selectedYAxis, aggregation = 'sum' } = widget;
  const filterField = selectedXAxis || selectedYAxis[0] || 'region';
  const rawDataForFilter = fullDataForFilter ?? data;
  const uniqueValues = useMemo(() => {
    if (chartType !== 'filter' || !rawDataForFilter?.length) return [];
    return Array.from(
      new Set(
        rawDataForFilter
          .map((row) => String((row as Record<string, unknown>)[filterField] ?? ''))
          .filter(Boolean)
      )
    ).sort();
  }, [chartType, rawDataForFilter, filterField]);

  const hasX = !!selectedXAxis;
  const hasY = selectedYAxis.length > 0;
  const hasFields = hasX || hasY;

  if (!hasFields && chartType !== 'filter') {
    return (
      <div className="flex items-center justify-center h-[280px] text-slate-400 dark:text-slate-500 text-sm">
        Selecciona ejes en el panel
      </div>
    );
  }

  if (chartType === 'filter') {
    return (
      <FilterWidget
        widget={widget as Widget & { title?: string }}
        filterField={filterField}
        uniqueValues={uniqueValues}
        currentFilterValue={activeFilters[filterField]}
        onFilterChange={onFilterChange}
      />
    );
  }

  if (chartType === 'kpi') {
    const fieldToAggregate = selectedYAxis[0] || selectedXAxis;
    const aggregationType = aggregation || 'sum';
    const kpiValue = computeKpiValue(data, fieldToAggregate || 'revenue', aggregationType);
    const kpiWidget = widget as Widget & { title?: string; format?: string; subtitle?: string };
    const kpiTitle = kpiWidget.title || (fieldToAggregate ? `Total ${fieldToAggregate.charAt(0).toUpperCase() + fieldToAggregate.slice(1)}` : 'Registros');
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-[#111827] rounded-md shadow-sm border border-slate-700/50 no-drag cancel-drag">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
          {kpiTitle}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          {kpiWidget.format === 'currency' && (
            <span className="text-2xl font-bold text-slate-500">$</span>
          )}
          <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm tabular-nums">
            {formatKpiValue(kpiValue)}
          </span>
        </div>
        {kpiWidget.subtitle && (
          <p className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-wide">{kpiWidget.subtitle}</p>
        )}
      </div>
    );
  }

  if (chartType === 'table') {
    const getTableData = (): Record<string, unknown>[] => {
      if (!data?.length) return [];
      const agg = aggregation || 'sum';
      if (!selectedXAxis || !selectedYAxis?.length || agg === 'none') {
        return data.slice(0, 100).map((row) => ({ ...row })) as Record<string, unknown>[];
      }
      type Group = { count: number; sums: Record<string, number>; category: string };
      const grouped: Record<string, Group> = {};
      data.forEach((row) => {
        const raw = row as Record<string, unknown>;
        const categoryValue = raw[selectedXAxis];
        const category =
          categoryValue !== undefined && categoryValue !== null ? String(categoryValue) : 'N/A';
        if (!grouped[category]) {
          grouped[category] = { count: 0, sums: {} as Record<string, number>, category };
          selectedYAxis.forEach((k) => { grouped[category].sums[k] = 0; });
        }
        const g = grouped[category];
        g.count += 1;
        selectedYAxis.forEach((key) => {
          const numValue = Number(raw[key]);
          g.sums[key] = (g.sums[key] ?? 0) + (Number.isNaN(numValue) ? 0 : numValue);
        });
      });
      return Object.values(grouped).map((group) => {
        const row: Record<string, unknown> = { [selectedXAxis]: group.category };
        selectedYAxis.forEach((key) => {
          const s = group.sums[key] ?? 0;
          if (agg === 'sum') row[key] = s;
          else if (agg === 'avg') row[key] = group.count ? s / group.count : 0;
          else row[key] = group.count;
        });
        return row;
      });
    };
    const aggregatedTableData = getTableData();

    return (
      <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0">
            <tr>
              {selectedXAxis && <th className="px-3 py-2 font-semibold capitalize">{selectedXAxis}</th>}
              {selectedYAxis.map((key) => (
                <th key={key} className="px-3 py-2 font-semibold text-right capitalize">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {aggregatedTableData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {selectedXAxis && (
                  <td className="py-2 px-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {String(row[selectedXAxis] ?? '')}
                  </td>
                )}
                {selectedYAxis.map((key) => (
                  <td key={key} className="py-2 px-3 text-sm text-slate-700 dark:text-slate-300 text-right font-mono">
                    {typeof row[key] === 'number'
                      ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(row[key] as number)
                      : String(row[key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {chartType === 'bar' && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey={selectedXAxis ?? undefined} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" />
            <YAxis tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : '', '']} contentStyle={{ borderRadius: '8px' }} />
            <Legend />
            {selectedYAxis.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} name={key.charAt(0).toUpperCase() + key.slice(1)} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
      {chartType === 'line' && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey={selectedXAxis ?? undefined} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" />
            <YAxis tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : '', '']} contentStyle={{ borderRadius: '8px' }} />
            <Legend />
            {selectedYAxis.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} name={key.charAt(0).toUpperCase() + key.slice(1)} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      {chartType === 'pie' && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={selectedYAxis[0] ?? 'revenue'}
              nameKey={selectedXAxis ?? 'date'}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={((props: { name?: string }) => String(props.name ?? '')) as (props: unknown) => React.ReactNode}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : '', selectedYAxis[0] ?? '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
      {chartType === 'area' && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={selectedXAxis ?? undefined} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '6px' }}
              itemStyle={{ color: '#60a5fa' }}
              formatter={(value: number | undefined) => [value != null ? value.toLocaleString() : '', selectedYAxis[0] ?? '']}
            />
            {selectedYAxis.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.3}
                name={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
      {chartType === 'scatter' && (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={selectedXAxis ?? undefined} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey={selectedYAxis[0] ?? 'revenue'} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '6px' }}
            />
            <Scatter
              name={(widget as Widget & { title?: string }).title || 'Datos'}
              data={data}
              fill="#60a5fa"
            />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function WidgetCard({
  widget,
  isSelected,
  data,
  onSelect,
  onDelete,
  onToggleColSpan,
  isEditing,
  fullDataForFilter,
  activeFilters,
  onFilterChange,
}: WidgetCardProps) {
  const isFilter = widget.type === 'filter';
  return (
    <div
      role={isEditing ? 'button' : undefined}
      tabIndex={isEditing ? 0 : undefined}
      onClick={isEditing ? () => onSelect() : undefined}
      onKeyDown={isEditing ? (e) => e.key === 'Enter' && onSelect() : undefined}
      className={`w-full h-full absolute inset-0 flex flex-col rounded-lg transition-colors ${isFilter ? 'overflow-visible z-50 hover:z-[60]' : 'overflow-hidden z-10'} ${
        isEditing
          ? `border-2 cursor-pointer bg-white dark:bg-slate-900 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`
          : 'border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 cursor-default'
      }`}
      data-selected={isSelected}
      data-widget-id={widget.id}
    >
      {isEditing && !isFilter && (
        <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleColSpan(); }}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
            title={widget.colSpan === 1 ? 'Ampliar' : 'Reducir'}
            aria-label={widget.colSpan === 1 ? 'Ampliar' : 'Reducir'}
          >
            <span className="material-symbols-outlined text-lg">{widget.colSpan === 1 ? 'open_in_full' : 'close_fullscreen'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
            title="Eliminar"
            aria-label="Eliminar gráfico"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      )}
      <div className={`flex-1 min-h-0 flex flex-col ${isFilter ? 'p-0 overflow-visible' : 'p-3 overflow-y-auto custom-scrollbar'}`}>
        <div className={`relative flex-1 min-h-0 ${isFilter ? 'overflow-visible' : ''}`}>
          <WidgetChart
            widget={widget}
            data={data}
            fullDataForFilter={fullDataForFilter}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
          />
          {isEditing && !isFilter && <div className="absolute inset-0 z-10 cursor-pointer" />}
        </div>
      </div>
    </div>
  );
}

/** Construye layout para react-grid-layout desde widgets (usa layout guardado o default por índice). Filtros: ultra compactos (w:2, h:1), minH:1 para permitir aplastarlos. */
function buildLayoutFromWidgets(widgets: Widget[]): Layout {
  return widgets.map((w, i) => {
    const isFilter = w.type === 'filter';
    return {
      i: w.id,
      x: w.layout?.x ?? 0,
      y: w.layout?.y ?? i * 3,
      w: w.layout?.w ?? (isFilter ? 2 : (w.colSpan === 2 ? 12 : 6)),
      h: w.layout?.h ?? (isFilter ? 1 : 3),
      minW: isFilter ? 2 : 2,
      minH: isFilter ? 1 : 1,
      maxH: isFilter ? 2 : undefined,
    };
  });
}

export type LayoutItem = { i: string; x: number; y: number; w: number; h: number };

type CanvasProps = {
  widgets: Widget[];
  chartData: ChartDataRow[];
  selectedWidgetId: string;
  setSelectedWidgetId: (id: string) => void;
  onAddWidget: () => void;
  onDeleteWidget: (id: string) => void;
  onToggleColSpan: (id: string) => void;
  /** Si false, oculta + Add Chart, botones eliminar/redimensionar y desactiva selección. Por defecto true. */
  isEditing?: boolean;
  /** Datos sin filtrar para poblar opciones de widgets tipo "filter". */
  fullChartDataForFilters?: ChartDataRow[];
  /** Filtros activos (clave = campo, valor = string o string[] para multi-selección). */
  activeFilters?: Record<string, string | string[]>;
  /** Callback al cambiar un filtro desde un widget tipo "filter". */
  onFilterChange?: (key: string, value: string | string[]) => void;
  /** Callback cuando el usuario mueve/redimensiona (react-grid-layout). */
  onLayoutChange?: (layout: LayoutItem[]) => void;
};

/** Lienzo con react-grid-layout: drag & resize en edición, estático en lectura. */
export function DashboardCanvas({
  widgets,
  chartData,
  selectedWidgetId,
  setSelectedWidgetId,
  onAddWidget,
  onDeleteWidget,
  onToggleColSpan,
  isEditing = true,
  fullChartDataForFilters,
  activeFilters = {},
  onFilterChange,
  onLayoutChange,
}: CanvasProps) {
  const isEmpty = widgets.length === 0;
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: false, initialWidth: 1200 });
  const layout = useMemo(() => buildLayoutFromWidgets(widgets), [widgets]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      onLayoutChange?.(newLayout.map((item) => ({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h })));
    },
    [onLayoutChange]
  );

  return (
    <>
      <style>{`
        .react-resizable-handle {
          z-index: 50 !important;
        }
        .react-resizable-handle-s,
        .react-resizable-handle-n {
          height: 12px !important;
        }
        .react-resizable-handle-e,
        .react-resizable-handle-w {
          width: 12px !important;
        }
        .react-resizable-handle-se,
        .react-resizable-handle-sw,
        .react-resizable-handle-ne,
        .react-resizable-handle-nw {
          width: 20px !important;
          height: 20px !important;
        }
      `}</style>
      <main className={`flex-1 flex flex-col relative overflow-hidden ${isEditing ? 'bg-slate-50 dark:bg-[#0b101a]' : 'bg-slate-50 dark:bg-slate-900'}`}>
      {isEditing && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-12 shrink-0">
          <button
            type="button"
            onClick={onAddWidget}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add_chart</span>
            <span>+ Add Chart</span>
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="material-symbols-outlined text-[20px]">text_fields</span>
            <span>Text Box</span>
          </button>
        </div>
      )}

      <div
        className={`flex-1 overflow-auto p-6 min-h-0 ${isEditing ? '' : 'bg-slate-50 dark:bg-slate-900'}`}
        style={
          isEditing
            ? {
                backgroundSize: '20px 20px',
                backgroundImage:
                  'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
              }
            : undefined
        }
      >
        {isEditing && (
          <button
            type="button"
            onClick={onAddWidget}
            className="mb-6 w-full py-4 border-2 border-dashed border-zinc-400 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-500 text-zinc-500 dark:text-zinc-400 rounded-lg flex items-center justify-center gap-2 transition-all text-base font-medium"
          >
            <span className="material-symbols-outlined text-2xl">add_chart</span>
            + Add New Chart to Canvas
          </button>
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-4">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-3" aria-hidden>bar_chart</span>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {isEditing ? 'No hay gráficos. Usa el botón de arriba para añadir uno.' : 'No hay gráficos en este tablero.'}
            </p>
          </div>
        ) : mounted && width > 0 ? (
          <div ref={containerRef} className="relative w-full max-w-[1400px] mx-auto">
            <GridLayout
              className="layout"
              layout={layout}
              onLayoutChange={handleLayoutChange}
              width={width}
              draggableCancel=".no-drag, .cancel-drag, input, select, textarea, button"
              gridConfig={{
                cols: 12,
                rowHeight: 80,
                margin: [16, 16],
                containerPadding: [0, 0],
                maxRows: Infinity,
              }}
              dragConfig={{ handle: isEditing ? undefined : '.no-drag', enabled: isEditing, bounded: false, threshold: 3, cancel: '.no-drag, .cancel-drag, select, input, textarea, button' }}
              resizeConfig={{
                enabled: isEditing,
                handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'],
              }}
            >
              {widgets.map((w) => (
                <div key={w.id} className="w-full h-full relative">
                  <WidgetCard
                    widget={w}
                    isSelected={selectedWidgetId === w.id}
                    data={chartData}
                    onSelect={() => setSelectedWidgetId(w.id)}
                    onDelete={() => onDeleteWidget(w.id)}
                    onToggleColSpan={() => onToggleColSpan(w.id)}
                    isEditing={isEditing}
                    fullDataForFilter={fullChartDataForFilters}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange}
                  />
                </div>
              ))}
            </GridLayout>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-[400px] max-w-[1400px] mx-auto">
            {widgets.map((w) => (
              <WidgetCard
                key={w.id}
                widget={w}
                isSelected={selectedWidgetId === w.id}
                data={chartData}
                onSelect={() => setSelectedWidgetId(w.id)}
                onDelete={() => onDeleteWidget(w.id)}
                onToggleColSpan={() => onToggleColSpan(w.id)}
                isEditing={isEditing}
                fullDataForFilter={fullChartDataForFilters}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
              />
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="h-10 bg-slate-200 dark:bg-slate-800 flex items-center px-2 gap-1 border-t border-slate-300 dark:border-slate-700 shrink-0 z-10">
          <button type="button" className="flex items-center gap-1 bg-white dark:bg-slate-900 px-4 h-8 rounded-t text-sm font-semibold text-[#135bec] border-t-2 border-[#135bec] shadow-sm">
            Report
          </button>
        </div>
      )}
      </main>
    </>
  );
}
