'use client';

import type { ChartType, Widget } from './AnalyticsDashboard';

const VIS_OPTIONS: { type: ChartType; icon: string; label: string }[] = [
  { type: 'bar', icon: 'bar_chart', label: 'Bar Chart' },
  { type: 'line', icon: 'show_chart', label: 'Line Chart' },
  { type: 'pie', icon: 'pie_chart', label: 'Pie Chart' },
  { type: 'table', icon: 'table_chart', label: 'Table' },
];

const FINANCIAL_RECORD_FIELDS = [
  { key: 'date', label: 'Date', type: 'category' as const, icon: 'calendar_month' },
  { key: 'revenue', label: 'Revenue', type: 'numeric' as const, icon: 'attach_money' },
  { key: 'target', label: 'Target', type: 'numeric' as const, icon: 'track_changes' },
  { key: 'region', label: 'Region', type: 'category' as const, icon: 'public' },
  { key: 'product', label: 'Product', type: 'category' as const, icon: 'inventory_2' },
];

type Props = {
  widgets: Widget[];
  selectedWidgetId: string;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  onCollapse?: () => void;
};

/** Panel derecho: Visualizations + Build Visual (drop zones) + Data (píldoras arrastrables). Sin checkboxes. */
export function RightPropertiesPanel({ widgets, selectedWidgetId, updateWidget, onCollapse }: Props) {
  const activeWidget = widgets.find((w) => w.id === selectedWidgetId);

  if (!activeWidget) {
    return (
      <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Visualizations</span>
          {onCollapse && (
            <button type="button" onClick={onCollapse} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" aria-label="Colapsar panel">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un gráfico en el lienzo para editarlo</p>
        </div>
      </aside>
    );
  }

  const { type: chartType, xAxis: selectedXAxis, yAxis: selectedYAxis } = activeWidget;

  const handleVisualizationClick = (type: ChartType) => {
    updateWidget(selectedWidgetId, { type });
  };

  const removeFromX = () => updateWidget(selectedWidgetId, { xAxis: null });
  const removeFromY = (key: string) => updateWidget(selectedWidgetId, { yAxis: activeWidget.yAxis.filter((k) => k !== key) });

  const xLabel = FINANCIAL_RECORD_FIELDS.find((f) => f.key === selectedXAxis)?.label ?? selectedXAxis;

  const handleDropX = (e: React.DragEvent) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain');
    if (field) updateWidget(selectedWidgetId, { xAxis: field });
  };

  const handleDropY = (e: React.DragEvent) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain');
    if (!field) return;
    const currentY = activeWidget?.yAxis ?? [];
    if (!currentY.includes(field)) updateWidget(selectedWidgetId, { yAxis: [...currentY, field] });
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10">
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-700 h-1/2 min-h-0">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Visualizations</span>
          {onCollapse && (
            <button type="button" onClick={onCollapse} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" aria-label="Colapsar panel">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          )}
        </div>
        <div className="p-4 grid grid-cols-4 gap-2 overflow-y-auto">
          {VIS_OPTIONS.map(({ type, icon, label }) => (
            <button
              key={type}
              type="button"
              title={label}
              onClick={() => handleVisualizationClick(type)}
              className={`p-2 rounded border flex justify-center transition-colors ${
                chartType === type ? 'bg-blue-600 border-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2 flex-1 overflow-y-auto min-h-0">
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">X-Axis</label>
            {selectedXAxis ? (
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">calendar_month</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{xLabel}</span>
                </div>
                <button type="button" onClick={removeFromX} className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5 rounded" aria-label="Remove X">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropX}
                className="min-h-[44px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-2 text-center text-xs text-slate-400 bg-slate-50/80 dark:bg-slate-800/50 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Arrastra un campo aquí
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Y-Axis</label>
            {selectedYAxis.length > 0 ? (
              <div className="space-y-1">
                {selectedYAxis.map((key) => {
                  const field = FINANCIAL_RECORD_FIELDS.find((f) => f.key === key);
                  return (
                    <div key={key} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-slate-400">{field?.icon ?? 'tag'}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{field?.label ?? key}</span>
                      </div>
                      <button type="button" onClick={() => removeFromY(key)} className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5 rounded" aria-label={`Remove ${field?.label ?? key}`}>
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropY}
              className="min-h-[44px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-2 text-center text-xs text-slate-400 bg-slate-50/80 dark:bg-slate-800/50 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {selectedYAxis.length === 0 ? 'Arrastra campos aquí' : 'Suelta más campos'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-1/2 min-h-0 bg-white dark:bg-slate-900">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Data Fields</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="mb-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded mb-2">
              <span className="material-symbols-outlined text-slate-400 text-sm">table_view</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">FinancialRecord</span>
            </div>
            <div className="pl-2 flex flex-wrap gap-2">
              {FINANCIAL_RECORD_FIELDS.map(({ key, label, icon }) => (
                <div
                  key={key}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', key);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
