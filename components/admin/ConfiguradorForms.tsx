'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { crearTablero, agregarDatosKPI } from '@/app/actions/adminActions';
import { CreateKPIWizard } from './CreateKPIWizard';
import {
  crearFuenteDatos,
  eliminarFuenteDatos,
  actualizarIndicadorFuente,
  sincronizarIndicador,
} from '@/app/actions/syncActions';

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface Tablero {
  id: string;
  nombre: string;
  icono: string;
  empresaId: string;
  _count?: { indicadores: number };
}

interface IndicadorOption {
  id: string;
  titulo: string;
  tableroNombre: string;
  tableroIcono: string;
  fuenteDatosId: string | null;
  consultaSql: string;
}

interface FuenteDatosOption {
  id: string;
  nombre: string;
  tipo: string;
  empresaNombre: string;
}

interface ConfiguradorFormsProps {
  companies: Company[];
  tableros: Tablero[];
  indicadores: IndicadorOption[];
  fuentesDatos: FuenteDatosOption[];
}

export function ConfiguradorForms({ companies, tableros, indicadores, fuentesDatos }: ConfiguradorFormsProps) {
  const [creatingTablero, setCreatingTablero] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [savingDato, setSavingDato] = useState(false);
  const [savingFuente, setSavingFuente] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fuentes, setFuentes] = useState(fuentesDatos);
  const router = useRouter();

  useEffect(() => {
    setFuentes(fuentesDatos);
  }, [fuentesDatos]);

  const [fuenteForm, setFuenteForm] = useState({
    empresaId: companies[0]?.id ?? '',
    nombre: '',
    tipo: 'POSTGRES',
    cadenaConexion: '',
  });

  const [sqlForm, setSqlForm] = useState({
    indicadorId: (indicadores[0]?.id ?? '') as string,
    fuenteDatosId: (indicadores[0]?.fuenteDatosId ?? fuentes[0]?.id ?? '') as string,
    consultaSql: (indicadores[0]?.consultaSql ?? '') as string,
  });

  const [tableroForm, setTableroForm] = useState({
    empresaId: companies[0]?.id ?? '',
    nombre: '',
    icono: '📊',
  });

  const [datoForm, setDatoForm] = useState({
    indicadorId: (indicadores[0]?.id ?? '') as string,
    periodo: '',
    valorLogrado: '',
    valorMeta: '',
  });

  async function handleCrearTablero(e: React.FormEvent) {
    e.preventDefault();
    if (!tableroForm.nombre.trim()) {
      toast.error('El nombre del tablero es obligatorio');
      return;
    }
    setCreatingTablero(true);
    try {
      const result = await crearTablero(
        tableroForm.empresaId,
        tableroForm.nombre.trim(),
        tableroForm.icono || '📊'
      );
      if ('error' in result) {
        toast.error(result.error ?? 'Error al crear el tablero');
        return;
      }
      toast.success('Tablero creado correctamente');
      setTableroForm((prev) => ({ ...prev, nombre: '' }));
      router.refresh();
    } finally {
      setCreatingTablero(false);
    }
  }

  async function handleCargarDato(e: React.FormEvent) {
    e.preventDefault();
    if (!datoForm.indicadorId || !datoForm.periodo.trim()) {
      toast.error('Indicador y periodo son obligatorios');
      return;
    }
    const valorLogrado = Number(datoForm.valorLogrado);
    if (Number.isNaN(valorLogrado)) {
      toast.error('Valor logrado debe ser un número');
      return;
    }
    setSavingDato(true);
    try {
      const valorMeta = datoForm.valorMeta.trim() === '' ? undefined : Number(datoForm.valorMeta);
      const result = await agregarDatosKPI(
        datoForm.indicadorId,
        datoForm.periodo.trim(),
        valorLogrado,
        valorMeta != null && !Number.isNaN(valorMeta) ? valorMeta : undefined
      );
      if ('error' in result) {
        toast.error(result.error ?? 'Error al cargar el dato');
        return;
      }
      toast.success('Dato cargado correctamente');
      setDatoForm((prev) => ({
        ...prev,
        periodo: '',
        valorLogrado: '',
        valorMeta: '',
      }));
      router.refresh();
    } finally {
      setSavingDato(false);
    }
  }

  async function handleCrearFuente(e: React.FormEvent) {
    e.preventDefault();
    if (!fuenteForm.nombre.trim() || !fuenteForm.cadenaConexion.trim()) {
      toast.error('Nombre y cadena de conexión son obligatorios');
      return;
    }
    setSavingFuente(true);
    try {
      const result = await crearFuenteDatos(
        fuenteForm.empresaId,
        fuenteForm.nombre.trim(),
        fuenteForm.tipo,
        fuenteForm.cadenaConexion.trim()
      );
      if ('error' in result) {
        toast.error(result.error ?? 'Error al crear la fuente');
        return;
      }
      toast.success('Fuente de datos creada');
      setFuenteForm((p) => ({ ...p, nombre: '', cadenaConexion: '' }));
      router.refresh();
    } finally {
      setSavingFuente(false);
    }
  }

  async function handleEliminarFuente(id: string) {
    try {
      const result = await eliminarFuenteDatos(id);
      if ('error' in result) {
        toast.error(result.error ?? 'Error al eliminar');
        return;
      }
      toast.success('Fuente eliminada');
      router.refresh();
    } catch {
      toast.error('Error al eliminar');
    }
  }

  async function handleProbarYSincronizar(e: React.FormEvent) {
    e.preventDefault();
    const indicadorId = sqlForm.indicadorId || indicadores[0]?.id;
    if (!indicadorId) {
      toast.error('Selecciona un indicador');
      return;
    }
    if (!sqlForm.consultaSql.trim()) {
      toast.error('Escribe la consulta SQL (debe retornar columnas periodo, logrado y opcionalmente meta)');
      return;
    }
    setSyncing(true);
    try {
      const updateResult = await actualizarIndicadorFuente(
        indicadorId,
        sqlForm.fuenteDatosId || null,
        sqlForm.consultaSql.trim()
      );
      if ('error' in updateResult) {
        toast.error(updateResult.error ?? 'Error al guardar configuración');
        setSyncing(false);
        return;
      }
      const syncResult = await sincronizarIndicador(indicadorId);
      if ('error' in syncResult) {
        toast.error(syncResult.error ?? 'Error al sincronizar');
        setSyncing(false);
        return;
      }
      toast.success(`Sincronizados ${syncResult.rowsSynced} registros`);
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Fuentes de Datos ───────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Fuentes de datos</h2>
        <p className="text-slate-500 text-sm mb-4">
          Conecta bases de datos externas (Postgres o MySQL) para sincronizar indicadores.
        </p>
        <form onSubmit={handleCrearFuente} className="flex flex-wrap items-end gap-4 mb-6">
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Empresa</label>
            <select
              value={fuenteForm.empresaId}
              onChange={(e) => setFuenteForm((p) => ({ ...p, empresaId: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
            <input
              type="text"
              value={fuenteForm.nombre}
              onChange={(e) => setFuenteForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Warehouse Postgres"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select
              value={fuenteForm.tipo}
              onChange={(e) => setFuenteForm((p) => ({ ...p, tipo: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="POSTGRES">PostgreSQL</option>
              <option value="MYSQL">MySQL</option>
              <option value="SQLSERVER">SQL Server</option>
            </select>
          </div>
          <div className="min-w-[280px] flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Cadena de conexión</label>
            <input
              type="password"
              value={fuenteForm.cadenaConexion}
              onChange={(e) => setFuenteForm((p) => ({ ...p, cadenaConexion: e.target.value }))}
              placeholder="postgresql://...  mysql://...  o  Server=host,1433;Database=db;User Id=u;Password=p"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={savingFuente}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50"
          >
            {savingFuente ? 'Guardando…' : 'Guardar fuente'}
          </button>
        </form>
        {fuentes.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {fuentes.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{f.nombre}</span>
                <span className="text-xs text-slate-400">{f.tipo} · {f.empresaNombre}</span>
                <button
                  type="button"
                  onClick={() => handleEliminarFuente(f.id)}
                  className="text-xs text-rose-600 hover:text-rose-700"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Form Crear Tablero */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Crear nuevo tablero</h2>
        <form onSubmit={handleCrearTablero} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Empresa</label>
            <select
              value={tableroForm.empresaId}
              onChange={(e) => setTableroForm((p) => ({ ...p, empresaId: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
            <input
              type="text"
              value={tableroForm.nombre}
              onChange={(e) => setTableroForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Comercial"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-slate-500 mb-1">Icono</label>
            <input
              type="text"
              value={tableroForm.icono}
              onChange={(e) => setTableroForm((p) => ({ ...p, icono: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-center"
            />
          </div>
          <button
            type="submit"
            disabled={creatingTablero}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {creatingTablero ? 'Creando…' : 'Crear tablero'}
          </button>
        </form>
      </section>

      {/* Crear KPI (wizard) */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Indicadores (KPIs)</h2>
        {tableros.length === 0 ? (
          <p className="text-slate-500 text-sm">Crea primero un tablero para poder agregar indicadores.</p>
        ) : (
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            Crear KPI
          </button>
        )}
      </section>
      {wizardOpen && (
        <CreateKPIWizard
          tableros={tableros.map((t) => ({ id: t.id, nombre: t.nombre, icono: t.icono }))}
          fuentesDatos={fuentes.map((f) => ({ id: f.id, nombre: f.nombre, tipo: f.tipo }))}
          onClose={() => setWizardOpen(false)}
        />
      )}

      {/* Form Cargar Datos a Indicador */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Cargar datos a indicador</h2>
        {indicadores.length === 0 ? (
          <p className="text-slate-500 text-sm">Crea primero un indicador para poder cargar datos.</p>
        ) : (
          <form onSubmit={handleCargarDato} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[260px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Indicador</label>
              <select
                value={datoForm.indicadorId || indicadores[0]?.id}
                onChange={(e) => setDatoForm((p) => ({ ...p, indicadorId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {indicadores.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.tableroIcono} {ind.tableroNombre} → {ind.titulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Periodo</label>
              <input
                type="text"
                value={datoForm.periodo}
                onChange={(e) => setDatoForm((p) => ({ ...p, periodo: e.target.value }))}
                placeholder="Ej. Semana 1, Enero"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Valor logrado</label>
              <input
                type="number"
                step="any"
                value={datoForm.valorLogrado}
                onChange={(e) => setDatoForm((p) => ({ ...p, valorLogrado: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-500 mb-1">Valor meta (opc.)</label>
              <input
                type="number"
                step="any"
                value={datoForm.valorMeta}
                onChange={(e) => setDatoForm((p) => ({ ...p, valorMeta: e.target.value }))}
                placeholder="Opcional"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingDato}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50"
            >
              {savingDato ? 'Guardando…' : 'Cargar dato'}
            </button>
          </form>
        )}
      </section>

      {/* ── Configurar SQL del Indicador (sincronización externa) ───────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Configurar SQL del indicador</h2>
        <p className="text-slate-500 text-sm mb-4">
          Asocia un indicador a una fuente de datos y define la query. La consulta debe retornar columnas <code className="bg-slate-100 px-1 rounded">periodo</code>, <code className="bg-slate-100 px-1 rounded">logrado</code> y opcionalmente <code className="bg-slate-100 px-1 rounded">meta</code>.
        </p>
        {indicadores.length === 0 || fuentes.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Crea al menos un indicador y una fuente de datos para usar esta opción.
          </p>
        ) : (
          <form onSubmit={handleProbarYSincronizar} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[260px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Indicador</label>
                <select
                  value={sqlForm.indicadorId || indicadores[0]?.id}
                  onChange={(e) => {
                    const ind = indicadores.find((i) => i.id === e.target.value);
                    setSqlForm((p) => ({
                      ...p,
                      indicadorId: e.target.value,
                      fuenteDatosId: (ind?.fuenteDatosId ?? fuentes[0]?.id ?? '') as string,
                      consultaSql: ind?.consultaSql ?? '',
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {indicadores.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.tableroIcono} {ind.tableroNombre} → {ind.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[220px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Fuente de datos</label>
                <select
                  value={sqlForm.fuenteDatosId || fuentes[0]?.id}
                  onChange={(e) => setSqlForm((p) => ({ ...p, fuenteDatosId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {fuentes.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre} ({f.tipo})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Query SQL</label>
              <textarea
                value={sqlForm.consultaSql}
                onChange={(e) => setSqlForm((p) => ({ ...p, consultaSql: e.target.value }))}
                placeholder="SELECT mes AS periodo, SUM(total) AS logrado, 100 AS meta FROM ventas GROUP BY mes"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={syncing}
              className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 disabled:opacity-50"
            >
              {syncing ? 'Sincronizando…' : 'Probar y Sincronizar'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
