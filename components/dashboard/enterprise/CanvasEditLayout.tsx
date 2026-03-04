'use client';

import Link from 'next/link';

/** Vista de edición del lienzo: header (undo/redo, Share), canvas, panel derecho (Visualizations, Build Visual, Data), strip Filters. */
export function CanvasEditLayout() {
  return (
    <div className="bg-[#f6f6f8] dark:bg-[#121121] text-slate-900 dark:text-slate-100 font-display antialiased overflow-hidden flex flex-col h-screen">
      <header className="flex-none flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a192e] px-4 py-2 h-14 z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center justify-center size-8 rounded bg-[#524ae8]/10 text-[#524ae8]">
            <span className="material-symbols-outlined text-xl">analytics</span>
          </Link>
          <h1 className="text-slate-900 dark:text-white text-base font-semibold tracking-tight">Enterprise BI Dashboard</h1>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Sales Overview Report</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1.5 w-64 mr-4">
            <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
            <input type="text" className="bg-transparent border-none text-xs w-full focus:ring-0 text-slate-700 dark:text-slate-200 placeholder-slate-400" placeholder="Search report pages" />
          </div>
          <button type="button" className="p-2 text-slate-500 hover:text-[#524ae8] hover:bg-[#524ae8]/5 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">undo</span>
          </button>
          <button type="button" className="p-2 text-slate-500 hover:text-[#524ae8] hover:bg-[#524ae8]/5 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">redo</span>
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <button type="button" className="flex items-center gap-2 px-3 py-1.5 bg-[#524ae8] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>Share</span>
          </button>
          <button type="button" className="size-8 ml-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600" aria-label="User" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-slate-50 dark:bg-[#0f0e1b] relative overflow-hidden flex flex-col">
          <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a192e] flex items-center px-4 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <button type="button" className="flex items-center gap-1 hover:text-[#524ae8]">
              <span className="material-symbols-outlined text-[16px]">add_box</span>
              New Page
            </button>
            <button type="button" className="flex items-center gap-1 hover:text-[#524ae8]">
              <span className="material-symbols-outlined text-[16px]">smartphone</span>
              Mobile Layout
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span>Fit to Width</span>
              <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
            <div className="w-full max-w-[900px] aspect-video bg-white dark:bg-[#1a192e] shadow-lg border border-slate-200 dark:border-slate-800 rounded-sm relative group cursor-default">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-10 left-10 right-10 bottom-40 border-2 border-[#524ae8]/50 bg-[#524ae8]/5 rounded border-dashed flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-[#524ae8]/40 mb-2">bar_chart</span>
                  <p className="text-xs text-slate-400 font-medium">Drag fields here to build your visual</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-9 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a192e] flex items-center px-2 overflow-x-auto">
            <button type="button" className="px-4 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-t border-b-2 border-[#524ae8]">Overview</button>
            <button type="button" className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t">Sales Detail</button>
            <button type="button" className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t">Region Map</button>
            <button type="button" className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-[#524ae8]">
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
        </main>
        <aside className="w-[340px] flex-none bg-white dark:bg-[#1a192e] border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-10">
          <div className="flex items-center px-3 py-2 border-b border-slate-200 dark:border-slate-800 gap-4">
            <button type="button" className="text-xs font-bold text-slate-800 dark:text-white border-b-2 border-[#524ae8] pb-2 -mb-2.5 px-1">Visualizations</button>
            <button type="button" className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 pb-2 -mb-2.5 px-1">Format</button>
            <button type="button" className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 pb-2 -mb-2.5 px-1">Analytics</button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {['bar_chart', 'bar_chart', 'show_chart', 'area_chart', 'scatter_plot', 'pie_chart', 'donut_small', 'bento', 'public', 'map', 'speed', '123', 'table_chart', 'grid_on', 'code', 'more_horiz'].map((icon, i) => (
                  <button key={icon + i} type="button" className={`aspect-square flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 ${i === 0 ? 'bg-[#524ae8]/10 text-[#524ae8] ring-1 ring-[#524ae8]/20' : ''}`} title={icon}>
                    <span className={`material-symbols-outlined text-[18px] ${i === 1 ? 'rotate-90' : ''}`}>{icon}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-3 py-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Build Visual</h3>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">X-Axis</label>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 cursor-pointer hover:text-slate-600">close</span>
                </div>
                <div className="min-h-[32px] bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center px-2 py-1 gap-2 hover:border-[#524ae8] transition-colors cursor-pointer">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-0.5 shadow-sm w-full">
                    <span className="material-symbols-outlined text-[12px] text-slate-500">calendar_today</span>
                    <span className="text-[11px] font-medium truncate">Order Date</span>
                    <span className="material-symbols-outlined text-[10px] text-slate-400 ml-auto">expand_more</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Y-Axis</label>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 cursor-pointer hover:text-slate-600">close</span>
                </div>
                <div className="min-h-[32px] bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded flex flex-col p-1 gap-1 hover:border-[#524ae8] transition-colors cursor-pointer">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-2 py-0.5 shadow-sm w-full">
                    <span className="material-symbols-outlined text-[12px] text-slate-500">functions</span>
                    <span className="text-[11px] font-medium truncate">Total Sales</span>
                    <span className="material-symbols-outlined text-[10px] text-slate-400 ml-auto">close</span>
                  </div>
                  <div className="px-2 py-1 text-[10px] text-slate-400 italic">Add data fields here</div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Legend</label>
                <div className="min-h-[32px] bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded flex items-center px-2 py-1 hover:border-[#524ae8] transition-colors cursor-pointer">
                  <span className="text-[10px] text-slate-400 italic">Add data fields here</span>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1a192e]">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#1a192e] z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Data</h3>
                  <button type="button" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500">
                    <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 material-symbols-outlined text-[16px] text-slate-400">search</span>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded pl-8 pr-2 py-1 text-xs focus:ring-1 focus:ring-[#524ae8] focus:border-[#524ae8] text-slate-700 dark:text-slate-300" placeholder="Search" />
                </div>
              </div>
              <div className="px-2 py-2 space-y-0.5">
                <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer group">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-500">table_chart</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1">Financials</span>
                </div>
                <div className="mt-2 flex items-center gap-1 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer group">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-500">table_chart</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1">Sales_Data</span>
                </div>
                <div className="mt-2 flex items-center gap-1 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer group">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-500">table_chart</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1">Calendar</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="w-10 bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-4 z-0">
          <div className="text-[10px] text-slate-500 font-bold uppercase rotate-90 whitespace-nowrap tracking-wider py-8 cursor-pointer hover:text-[#524ae8] transition-colors">Filters</div>
          <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />
          <button type="button" className="p-1.5 text-slate-400 hover:text-[#524ae8] rounded-md hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all" title="Add Filter">
            <span className="material-symbols-outlined text-[20px]">filter_alt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
