'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type FilterDropdownProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** Dropdown premium para widget Filtro: trigger + menú flotante + búsqueda si > 5 opciones. */
export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const showSearch = options.length > 5;
  const filteredOptions = useMemo(() => {
    if (!showSearch || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, showSearch, search]);

  const displayValue = value ? value : placeholder;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className={`flex flex-col min-w-0 shrink-0 ${className}`} ref={containerRef}>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block shrink-0">
        {label}
      </label>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full min-h-[32px] flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-2 px-3 text-sm shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shrink-0"
        >
          <span className={value ? 'font-medium' : 'text-slate-500 dark:text-slate-400'}>{displayValue}</span>
          <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px] shrink-0">
            expand_more
          </span>
        </button>
        {open && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl overflow-hidden"
            role="listbox"
          >
            {showSearch && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <div className="max-h-56 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${!value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-200'}`}
                role="option"
                aria-selected={!value}
              >
                {!value && <span className="material-symbols-outlined text-[18px]">check</span>}
                <span className={!value ? 'ml-6' : 'pl-6'}>Todos</span>
              </button>
              {filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-200'}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {isSelected && <span className="material-symbols-outlined text-[18px]">check</span>}
                    <span className={isSelected ? 'ml-6' : 'pl-6'}>{opt}</span>
                  </button>
                );
              })}
              {showSearch && filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                  Sin resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
