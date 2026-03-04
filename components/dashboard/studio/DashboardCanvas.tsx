'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartType, ChartDataRow, Widget } from './AnalyticsDashboard';

const COLORS = ['#135bec', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'];

type WidgetCardProps = {
  widget: Widget;
  isSelected: boolean;
  data: ChartDataRow[];
  onSelect: () => void;
  onDelete: () => void;
  onToggleColSpan: () => void;
  isEditing: boolean;
};

function WidgetChart({ widget, data }: { widget: Widget; data: ChartDataRow[] }) {
  const { type: chartType, xAxis: selectedXAxis, yAxis: selectedYAxis } = widget;
  const hasX = !!selectedXAxis;
  const hasY = selectedYAxis.length > 0;
  const hasFields = hasX || hasY;

  if (!hasFields) {
    return (
      <div className="flex items-center justify-center h-[280px] text-slate-400 dark:text-slate-500 text-sm">
        Selecciona ejes en el panel
      </div>
    );
  }

  if (chartType === 'table') {
    return (
      <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
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
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {selectedXAxis && (
                  <td className="px-3 py-1.5 font-medium text-slate-900 dark:text-slate-100">
                    {String((row as Record<string, unknown>)[selectedXAxis])}
                  </td>
                )}
                {selectedYAxis.map((key) => (
                  <td key={key} className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300 font-mono text-xs">
                    {typeof (row as Record<string, unknown>)[key] === 'number'
                      ? Number((row as Record<string, unknown>)[key]).toLocaleString()
                      : String((row as Record<string, unknown>)[key])}
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
    <div className="w-full h-[280px]">
      {chartType === 'bar' && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey={selectedXAxis ?? undefined} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" />
            <YAxis tick={{ fill: 'currentColor', fontSize: 10 }} className="text-slate-500" tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} contentStyle={{ borderRadius: '8px' }} />
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
            <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} contentStyle={{ borderRadius: '8px' }} />
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
              label={({ [selectedXAxis ?? 'date']: label }) => String(label)}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value.toLocaleString(), selectedYAxis[0] ?? '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function WidgetCard({ widget, isSelected, data, onSelect, onDelete, onToggleColSpan, isEditing }: WidgetCardProps) {
  return (
    <div
      role={isEditing ? 'button' : undefined}
      tabIndex={isEditing ? 0 : undefined}
      onClick={isEditing ? () => onSelect() : undefined}
      onKeyDown={isEditing ? (e) => e.key === 'Enter' && onSelect() : undefined}
      className={`min-h-full flex flex-col rounded-lg border-2 bg-white dark:bg-slate-900 overflow-hidden transition-colors ${
        isEditing
          ? `cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`
          : 'border-slate-200 dark:border-slate-700 cursor-default'
      }`}
      style={{ gridColumn: widget.colSpan === 2 ? 'span 2' : undefined }}
      data-selected={isSelected}
      data-widget-id={widget.id}
    >
      {isEditing && (
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
      <div className="p-3 flex-1 min-h-0 flex flex-col">
        <WidgetChart widget={widget} data={data} />
      </div>
    </div>
  );
}

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
};

/** Lienzo en grid: múltiples widgets, vacío amigable, + Add Chart (solo en modo edición). */
export function DashboardCanvas({
  widgets,
  chartData,
  selectedWidgetId,
  setSelectedWidgetId,
  onAddWidget,
  onDeleteWidget,
  onToggleColSpan,
  isEditing = true,
}: CanvasProps) {
  const isEmpty = widgets.length === 0;

  return (
    <main className="flex-1 flex flex-col relative bg-slate-50 dark:bg-[#0b101a] overflow-hidden">
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
        className="flex-1 overflow-auto p-6 min-h-0"
        style={{
          backgroundSize: '20px 20px',
          backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
        }}
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
  );
}
