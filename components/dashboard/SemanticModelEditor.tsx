'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SchemaTable = { name: string; columns: string[] };

export type SemanticColumnType = 'string' | 'number' | 'date' | 'boolean';

export type SemanticTable = {
  id: string;
  name: string;
  sourceType: 'table' | 'sql_query';
  sourceDetail: string;
  columns: Array<{ name: string; type: SemanticColumnType }>;
};

export type SemanticRelationship = {
  id: string;
  fromTableId: string;
  fromColumn: string;
  toTableId: string;
  toColumn: string;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:N';
};

export type SemanticModel = {
  tables: SemanticTable[];
  relationships: SemanticRelationship[];
};

const COLUMN_TYPES: { value: SemanticColumnType; label: string }[] = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'boolean', label: 'Sí/No' },
];

const CARDINALITY_OPTIONS: { value: SemanticRelationship['cardinality']; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '1:N', label: '1:N' },
  { value: 'N:1', label: 'N:1' },
  { value: 'N:N', label: 'N:N' },
];

function newId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type SemanticModelEditorProps = {
  model: SemanticModel;
  onSave: (model: SemanticModel) => void;
  onClose: () => void;
};

export function SemanticModelEditor({ model, onSave, onClose }: SemanticModelEditorProps) {
  const [tables, setTables] = useState<SemanticTable[]>(model.tables);
  const [relationships, setRelationships] = useState<SemanticRelationship[]>(model.relationships);
  const [newRel, setNewRel] = useState<Partial<SemanticRelationship>>({
    fromTableId: '',
    fromColumn: '',
    toTableId: '',
    toColumn: '',
    cardinality: '1:N',
  });
  const [availableTables, setAvailableTables] = useState<SchemaTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/db/schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbType: 'postgres' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.tables)) {
          setAvailableTables(data.data.tables);
        }
      })
      .catch(() => setAvailableTables([]));
  }, []);

  const addTable = useCallback((sourceType: 'table' | 'sql_query') => {
    const name = sourceType === 'sql_query' ? 'Consulta personalizada' : 'Nueva tabla';
    setTables((prev) => [
      ...prev,
      {
        id: newId(),
        name,
        sourceType,
        sourceDetail: sourceType === 'table' ? '' : 'SELECT * FROM ...',
        columns: [],
      },
    ]);
  }, []);

  const updateTable = useCallback((id: string, updates: Partial<SemanticTable>) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const removeTable = useCallback((id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setRelationships((prev) => prev.filter((r) => r.fromTableId !== id && r.toTableId !== id));
  }, []);

  const addColumn = useCallback((tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: [...t.columns, { name: 'nueva_columna', type: 'string' }] }
          : t
      )
    );
  }, []);

  const updateColumn = useCallback(
    (tableId: string, colIndex: number, name: string, type: SemanticColumnType) => {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== tableId) return t;
          const next = [...t.columns];
          next[colIndex] = { name, type };
          return { ...t, columns: next };
        })
      );
    },
    []
  );

  const removeColumn = useCallback((tableId: string, colIndex: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return { ...t, columns: t.columns.filter((_, i) => i !== colIndex) };
      })
    );
  }, []);

  const addRelationship = useCallback(() => {
    if (!newRel.fromTableId || !newRel.fromColumn || !newRel.toTableId || !newRel.toColumn) return;
    setRelationships((prev) => [
      ...prev,
      {
        id: newId(),
        fromTableId: newRel.fromTableId,
        fromColumn: newRel.fromColumn,
        toTableId: newRel.toTableId,
        toColumn: newRel.toColumn,
        cardinality: newRel.cardinality ?? '1:N',
      },
    ]);
    setNewRel({ fromTableId: '', fromColumn: '', toTableId: '', toColumn: '', cardinality: '1:N' });
  }, [newRel]);

  const removeRelationship = useCallback((id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    onSave({ tables, relationships });
    onClose();
  }, [onSave, onClose, tables, relationships]);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-900 text-slate-100">
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400">account_tree</span>
          <h1 className="text-lg font-bold text-white">Modelo Semántico</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Guardar Modelo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Panel izquierdo: Tablas */}
        <div className="w-1/2 flex flex-col border-r border-slate-700 overflow-hidden">
          <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tablas</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => addTable('table')}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                <span className="material-symbols-outlined text-sm">table_chart</span>
                Tabla BD
              </button>
              <button
                type="button"
                onClick={() => addTable('sql_query')}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                <span className="material-symbols-outlined text-sm">code</span>
                Consulta SQL
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {tables.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/30 p-8 text-center">
                <p className="text-sm text-slate-500">Aún no hay tablas en este modelo.</p>
                <p className="text-xs text-slate-600 mt-1">Añade una tabla o una consulta SQL.</p>
              </div>
            ) : (
              tables.map((table) => (
                <div
                  key={table.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800">
                    <input
                      type="text"
                      value={table.name}
                      onChange={(e) => updateTable(table.id, { name: e.target.value })}
                      className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none"
                      placeholder="Nombre de la tabla"
                    />
                    <button
                      type="button"
                      onClick={() => removeTable(table.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700"
                      aria-label="Eliminar tabla"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase text-slate-500 shrink-0">
                        {table.sourceType === 'sql_query' ? 'Consulta SQL' : 'Tabla'}
                      </span>
                      {table.sourceType === 'table' ? (
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            value={activeTableId === table.id ? searchTerm : table.sourceDetail}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSearchTerm(v);
                              updateTable(table.id, { sourceDetail: v });
                              setShowSuggestions(true);
                              setActiveTableId(table.id);
                            }}
                            onFocus={() => {
                              setSearchTerm(table.sourceDetail);
                              setShowSuggestions(true);
                              setActiveTableId(table.id);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowSuggestions(false);
                                setActiveTableId(null);
                              }, 200);
                            }}
                            placeholder="Escribe o elige una tabla..."
                            className="w-full rounded px-2 py-1 text-xs bg-slate-900 border border-slate-600 text-slate-200 font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {showSuggestions && activeTableId === table.id && (
                            <div
                              ref={suggestionRef}
                              className="absolute top-full left-0 right-0 mt-0.5 max-h-48 overflow-y-auto rounded border border-slate-600 bg-slate-800 shadow-xl z-50 py-1"
                            >
                              {availableTables
                                .filter((t) =>
                                  t.name.toLowerCase().includes((searchTerm || '').toLowerCase())
                                )
                                .slice(0, 20)
                                .map((t) => (
                                  <button
                                    key={t.name}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateTable(table.id, {
                                        name: t.name,
                                        sourceDetail: t.name,
                                        columns: t.columns.map((name) => ({ name, type: 'string' as const })),
                                      });
                                      setSearchTerm(t.name);
                                      setShowSuggestions(false);
                                      setActiveTableId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none flex items-center justify-between gap-2"
                                  >
                                    <span className="font-mono truncate">{t.name}</span>
                                    <span className="text-slate-500 shrink-0">
                                      {t.columns.length} cols
                                    </span>
                                  </button>
                                ))}
                              {availableTables.filter((t) =>
                                t.name.toLowerCase().includes((searchTerm || '').toLowerCase())
                              ).length === 0 && (
                                <p className="px-3 py-2 text-xs text-slate-500">
                                  Sin coincidencias. Escribe el nombre de la tabla.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={table.sourceDetail}
                          onChange={(e) => updateTable(table.id, { sourceDetail: e.target.value })}
                          placeholder="SELECT ..."
                          className="flex-1 min-w-0 rounded px-2 py-1 text-xs bg-slate-900 border border-slate-600 text-slate-200 font-mono"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase text-slate-500">Columnas</span>
                      <button
                        type="button"
                        onClick={() => addColumn(table.id)}
                        className="text-[10px] text-blue-400 hover:text-blue-300"
                      >
                        + Añadir columna
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {table.columns.map((col, i) => (
                        <li key={i} className="flex items-center gap-2 py-1">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => updateColumn(table.id, i, e.target.value, col.type)}
                            className="flex-1 min-w-0 rounded px-2 py-0.5 text-xs bg-slate-900 border border-slate-600 text-slate-200"
                          />
                          <select
                            value={col.type}
                            onChange={(e) =>
                              updateColumn(table.id, i, col.name, e.target.value as SemanticColumnType)
                            }
                            className="rounded px-1 py-0.5 text-xs bg-slate-900 border border-slate-600 text-slate-200"
                          >
                            {COLUMN_TYPES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeColumn(table.id, i)}
                            className="p-0.5 text-slate-500 hover:text-red-400"
                            aria-label="Quitar columna"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho: Relaciones */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-none px-4 py-2 border-b border-slate-700 bg-slate-800/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Relaciones</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3">
              <p className="text-xs text-slate-500">Definir relación entre tablas</p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={newRel.fromTableId}
                  onChange={(e) => setNewRel((r) => ({ ...r, fromTableId: e.target.value, fromColumn: '' }))}
                  className="rounded px-2 py-1.5 text-sm bg-slate-900 border border-slate-600 text-slate-200"
                >
                  <option value="">Tabla A</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newRel.fromColumn}
                  onChange={(e) => setNewRel((r) => ({ ...r, fromColumn: e.target.value }))}
                  className="rounded px-2 py-1.5 text-sm bg-slate-900 border border-slate-600 text-slate-200"
                  disabled={!newRel.fromTableId}
                >
                  <option value="">Columna A</option>
                  {tables.find((t) => t.id === newRel.fromTableId)?.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  )) ?? []}
                </select>
                <span className="text-slate-500 text-sm">====</span>
                <select
                  value={newRel.toTableId}
                  onChange={(e) => setNewRel((r) => ({ ...r, toTableId: e.target.value, toColumn: '' }))}
                  className="rounded px-2 py-1.5 text-sm bg-slate-900 border border-slate-600 text-slate-200"
                >
                  <option value="">Tabla B</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newRel.toColumn}
                  onChange={(e) => setNewRel((r) => ({ ...r, toColumn: e.target.value }))}
                  className="rounded px-2 py-1.5 text-sm bg-slate-900 border border-slate-600 text-slate-200"
                  disabled={!newRel.toTableId}
                >
                  <option value="">Columna B</option>
                  {tables.find((t) => t.id === newRel.toTableId)?.columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  )) ?? []}
                </select>
                <select
                  value={newRel.cardinality}
                  onChange={(e) =>
                    setNewRel((r) => ({ ...r, cardinality: e.target.value as SemanticRelationship['cardinality'] }))
                  }
                  className="rounded px-2 py-1.5 text-sm bg-slate-900 border border-slate-600 text-slate-200"
                >
                  {CARDINALITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addRelationship}
                  disabled={
                    !newRel.fromTableId ||
                    !newRel.fromColumn ||
                    !newRel.toTableId ||
                    !newRel.toColumn
                  }
                  className="rounded px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Añadir relación
                </button>
              </div>
            </div>

            {relationships.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/30 p-6 text-center">
                <p className="text-sm text-slate-500">Aún no hay relaciones.</p>
                <p className="text-xs text-slate-600 mt-1">Usa el formulario de arriba para definir cómo se unen las tablas.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {relationships.map((rel) => {
                  const fromTable = tables.find((t) => t.id === rel.fromTableId);
                  const toTable = tables.find((t) => t.id === rel.toTableId);
                  return (
                    <li
                      key={rel.id}
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-300">
                        {fromTable?.name}.{rel.fromColumn} → {toTable?.name}.{rel.toColumn} ({rel.cardinality})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRelationship(rel.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400"
                        aria-label="Eliminar relación"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
