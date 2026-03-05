'use client';

import { usePathname } from 'next/navigation';
import { useGridEditing } from './GridEditingContext';

export function MainHeader() {
  const pathname = usePathname();
  const { isEditingGrid, setIsEditingGrid } = useGridEditing();
  const isTableroDetail = pathname.includes('/dashboard/tablero');

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-[20px] text-slate-400 dark:text-zinc-400" aria-hidden>search</span>
          <input
            type="text"
            placeholder="Search KPIs..."
            className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-16 text-sm text-slate-900 placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">⌘ K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isTableroDetail && (
          <div className="mr-2 hidden md:flex items-center gap-2">
            <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
              <span className="material-symbols-outlined text-[18px]" aria-hidden>calendar_today</span>
              <span>Live View</span>
            </button>
          </div>
        )}
        <button type="button" className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
          <span className="material-symbols-outlined text-[20px]" aria-hidden>notifications</span>
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white bg-red-500 dark:border-zinc-900" />
        </button>
        <div className="mx-1 h-6 w-px bg-slate-300 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={() => setIsEditingGrid((v) => !v)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isEditingGrid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>tune</span>
          <span>{isEditingGrid ? 'Save Grid' : 'Customize Grid'}</span>
        </button>
      </div>
    </header>
  );
}
