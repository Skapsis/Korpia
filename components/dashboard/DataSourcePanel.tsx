'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export type DbType = 'postgres' | 'mysql' | 'sqlite';

export type DataSourceFormState = {
  dbType: DbType;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  sqlQuery: string;
};

const DEFAULT_FORM: DataSourceFormState = {
  dbType: 'postgres',
  host: 'localhost',
  port: '5432',
  user: '',
  password: '',
  database: '',
  sqlQuery: 'SELECT * FROM sales LIMIT 100;',
};

type DataSourcePanelProps = {
  onDataLoaded?: (data: Record<string, unknown>[]) => void;
  onClose?: () => void;
  isOpen?: boolean;
};

export function DataSourcePanel({ onDataLoaded, onClose, isOpen = true }: DataSourcePanelProps) {
  const [form, setForm] = useState<DataSourceFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const update = (updates: Partial<DataSourceFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbType: form.dbType,
          host: form.host || 'localhost',
          port: form.port ? Number(form.port) : (form.dbType === 'mysql' ? 3306 : 5432),
          user: form.user,
          password: form.password,
          database: form.database,
          sqlQuery: form.sqlQuery.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Error al ejecutar la consulta');
        return;
      }

      if (json.success && Array.isArray(json.data)) {
        toast.success(`Se obtuvieron ${json.data.length} filas`);
        onDataLoaded?.(json.data);
      } else {
        toast.error('Respuesta inesperada del servidor');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de red';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Fuente de datos
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Tipo de base de datos
          </label>
          <select
            value={form.dbType}
            onChange={(e) => update({ dbType: e.target.value as DbType, port: e.target.value === 'mysql' ? '3306' : '5432' })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite (local)</option>
          </select>
        </div>

        {form.dbType !== 'sqlite' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Host</label>
                <input
                  type="text"
                  value={form.host}
                  onChange={(e) => update({ host: e.target.value })}
                  placeholder="localhost"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Puerto</label>
                <input
                  type="text"
                  value={form.port}
                  onChange={(e) => update({ port: e.target.value })}
                  placeholder={form.dbType === 'mysql' ? '3306' : '5432'}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Usuario</label>
              <input
                type="text"
                value={form.user}
                onChange={(e) => update({ user: e.target.value })}
                placeholder="usuario"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update({ password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la base de datos</label>
              <input
                type="text"
                value={form.database}
                onChange={(e) => update({ database: e.target.value })}
                placeholder="mi_base"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        <div className="flex-1 min-h-[140px] flex flex-col">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Consulta SQL
          </label>
          <textarea
            value={form.sqlQuery}
            onChange={(e) => update({ sqlQuery: e.target.value })}
            placeholder="SELECT * FROM mi_tabla LIMIT 100;"
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm font-mono placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              Conectando…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">database</span>
              Probar conexión y traer datos
            </>
          )}
        </button>
      </form>
    </div>
  );
}
