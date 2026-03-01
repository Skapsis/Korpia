'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { crearIndicador } from '@/app/actions/adminActions';
import { sincronizarIndicador } from '@/app/actions/syncActions';
import { ejecutarConsulta } from '@/app/actions/queryActions';

interface TableroOption {
  id: string;
  nombre: string;
  icono: string;
}

interface FuenteOption {
  id: string;
  nombre: string;
  tipo: string;
}

interface CreateKPIWizardProps {
  tableros: TableroOption[];
  fuentesDatos: FuenteOption[];
  onClose: () => void;
}

const CHART_TYPES = [
  { value: 'bar', label: 'Barras', icon: '📊' },
  { value: 'line', label: 'Línea', icon: '📈' },
  { value: 'area', label: 'Área', icon: '📉' },
  { value: 'pie', label: 'Torta / Anillo', icon: '🥧' },
  { value: 'scorecard', label: 'Tarjeta de Resumen (Scorecard)', icon: '🔢' },
  { value: 'table', label: 'Tabla de Detalles', icon: '📋' },
];

const UNIDADES = [
  { value: 'num', label: 'Número' },
  { value: '$', label: 'Moneda ($)' },
  { value: '%', label: 'Porcentaje (%)' },
];

export function CreateKPIWizard({ tableros, fuentesDatos, onClose }: CreateKPIWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestPassed, setConnectionTestPassed] = useState(false);

  const [form, setForm] = useState({
    tableroId: tableros[0]?.id ?? '',
    titulo: '',
    descripcion: '',
    tipoGrafico: 'bar',
    fuenteDatosId: fuentesDatos[0]?.id ?? '',
    consultaSql: '',
    unidad: 'num',
    metaGlobal: '0',
    usaDatosDinamicos: false,
    cadenaConexion: '',
  });

  const canNextStep1 = form.tableroId && form.titulo.trim().length > 0;
  const canNextStep2 = form.usaDatosDinamicos
    ? form.cadenaConexion.trim().length > 0 && form.consultaSql.trim().length > 0 && connectionTestPassed
    : true;
  const canFinish = canNextStep1 && form.unidad;

  function handleNext() {
    if (step < 3) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleProbarConexion() {
    const cadena = form.cadenaConexion.trim();
    const query = form.consultaSql.trim();
    if (!cadena || !query) {
      toast.error('Ingresa la cadena de conexión y la query SQL');
      return;
    }
    setTestingConnection(true);
    setConnectionTestPassed(false);
    try {
      const result = await ejecutarConsulta(cadena, query);
      if ('error' in result) {
        toast.error(result.error ?? 'Error al conectar');
        return;
      }
      const count = result.data?.length ?? 0;
      toast.success(`Conexión exitosa, ${count} fila${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}`);
      setConnectionTestPassed(true);
    } catch {
      toast.error('Error al probar la conexión');
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleFinish() {
    const tableroId = String(form.tableroId ?? '').trim();
    const titulo = form.titulo.trim();
    if (!tableroId || !titulo) {
      toast.error('Completa al menos el tablero y el título');
      return;
    }
    const metaGlobalNum = Number(form.metaGlobal);
    const metaGlobal = Number.isNaN(metaGlobalNum) ? 0 : metaGlobalNum;
    const fuenteDatosId = form.usaDatosDinamicos ? null : (form.fuenteDatosId?.trim() || null);
    const consultaSql = form.consultaSql?.trim() || null;
    const usaDatosDinamicos = form.usaDatosDinamicos;
    const cadenaConexion = form.usaDatosDinamicos ? form.cadenaConexion.trim() || null : null;

    setSubmitting(true);
    try {
      const createResult = await crearIndicador(
        tableroId,
        titulo,
        form.tipoGrafico || 'bar',
        form.unidad || 'num',
        metaGlobal,
        fuenteDatosId,
        consultaSql,
        usaDatosDinamicos,
        cadenaConexion
      );

      if ('error' in createResult) {
        const msg = createResult.error ?? 'Error al crear el KPI';
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      const indicadorId = createResult.indicadorId;
      if (!usaDatosDinamicos && fuenteDatosId && consultaSql) {
        const syncResult = await sincronizarIndicador(indicadorId);
        if ('error' in syncResult) {
          toast.success('KPI creado. No se pudo sincronizar datos: ' + syncResult.error);
        } else {
          toast.success(`KPI creado y sincronizado (${syncResult.rowsSynced} registros)`);
        }
      } else if (usaDatosDinamicos) {
        toast.success('KPI creado. Los datos se cargarán en vivo desde SQL Server.');
      } else {
        toast.success('KPI creado correctamente');
      }

      onClose();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear el KPI';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'block w-full rounded-md border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

  const stepLabels = ['General', 'Data Query', 'Review'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-slate-50 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Breadcrumb + Title + Stepper */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-8 pt-8 pb-4 bg-white border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
              <span className="text-slate-300">/</span>
              <span className="text-slate-900">KPIs</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900">Nuevo</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crear KPI</h1>
            <p className="text-slate-500 text-sm mt-1">Configura la definición y la visualización del indicador.</p>
          </div>
          <div className="flex items-center gap-0 flex-shrink-0">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setStep(s)}
                  className="flex flex-col items-center relative z-10"
                >
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-offset-2 transition-all ${
                      step === s
                        ? 'bg-indigo-600 text-white ring-indigo-600 ring-offset-slate-50'
                        : step > s
                          ? 'bg-indigo-100 text-indigo-600 ring-indigo-200 ring-offset-slate-50'
                          : 'bg-white border-2 border-slate-200 text-slate-400 ring-transparent ring-offset-slate-50'
                    }`}
                  >
                    {s}
                  </div>
                  <span
                    className={`text-xs mt-2 whitespace-nowrap ${
                      step === s ? 'font-semibold text-indigo-600' : 'font-medium text-slate-500'
                    }`}
                  >
                    {stepLabels[s - 1]}
                  </span>
                </button>
                {s < 3 && (
                  <div
                    className={`flex-grow min-w-[24px] h-0.5 mx-1 transition-colors ${step > s ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    style={{ marginTop: '28px' }}
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body — Step content */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 divide-y divide-slate-100">
            {step === 1 && (
              <form onSubmit={(e) => e.preventDefault()} className="divide-y divide-slate-100">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-md text-indigo-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Información general</h3>
                      <p className="text-xs text-slate-500">Datos básicos de identificación.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className={labelClass} htmlFor="kpi-tablero">Tablero <span className="text-red-500">*</span></label>
                      <select
                        id="kpi-tablero"
                        value={form.tableroId}
                        onChange={(e) => setForm((p) => ({ ...p, tableroId: e.target.value }))}
                        className={inputClass}
                      >
                        {tableros.map((t) => (
                          <option key={t.id} value={t.id}>{t.icono} {t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className={labelClass} htmlFor="kpi-name">Nombre del KPI <span className="text-red-500">*</span></label>
                      <input
                        id="kpi-name"
                        type="text"
                        value={form.titulo}
                        onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                        placeholder="ej. Ingresos recurrentes mensuales"
                        className={inputClass}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">Nombre único para informes.</p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className={labelClass} htmlFor="kpi-desc">Descripción</label>
                      <textarea
                        id="kpi-desc"
                        value={form.descripcion}
                        onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                        placeholder="Breve descripción de lo que mide este indicador..."
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">Opcional. Ayuda a otros a entender el contexto.</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Visualización</h3>
                      <p className="text-xs text-slate-500">Tipo de gráfico o tarjeta.</p>
                    </div>
                  </div>
                  <div>
                    <label className={`${labelClass} mb-3`}>Tipo de gráfico</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CHART_TYPES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, tipoGrafico: c.value }))}
                          className={`group relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all text-left ${
                            form.tipoGrafico === c.value
                              ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-300 bg-white'
                          }`}
                        >
                          <span className="text-2xl">{c.icon}</span>
                          <span className="ml-2 text-sm font-medium text-slate-900">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 rounded-md text-purple-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Origen de datos</h3>
                    <p className="text-xs text-slate-500">Fuente estática o conexión en vivo a SQL.</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <p className="font-medium text-slate-800">Conectar en vivo a SQL Server</p>
                      <p className="text-xs text-slate-500 mt-0.5">El gráfico leerá los datos al abrir el tablero.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.usaDatosDinamicos}
                      onClick={() => {
                        setForm((p) => ({ ...p, usaDatosDinamicos: !p.usaDatosDinamicos }));
                        setConnectionTestPassed(false);
                      }}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${form.usaDatosDinamicos ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${form.usaDatosDinamicos ? 'translate-x-5' : 'translate-x-1'}`}
                        aria-hidden
                      />
                    </button>
                  </div>

                  {!form.usaDatosDinamicos ? (
                    <>
                      <div>
                        <label className={labelClass}>Fuente de datos</label>
                        <select
                          value={form.fuenteDatosId}
                          onChange={(e) => setForm((p) => ({ ...p, fuenteDatosId: e.target.value }))}
                          className={inputClass}
                        >
                          <option value="">Sin fuente (datos manuales después)</option>
                          {fuentesDatos.map((f) => (
                            <option key={f.id} value={f.id}>{f.nombre} ({f.tipo})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Query SQL (sincronización)</label>
                        <p className="text-xs text-slate-500 mb-1.5">Opcional. Debe retornar: periodo, logrado y opcionalmente meta.</p>
                        <textarea
                          value={form.consultaSql}
                          onChange={(e) => setForm((p) => ({ ...p, consultaSql: e.target.value }))}
                          placeholder="SELECT mes AS periodo, SUM(total) AS logrado, 100 AS meta FROM ventas GROUP BY mes"
                          rows={4}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>Cadena de conexión</label>
                        <input
                          type="password"
                          value={form.cadenaConexion}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, cadenaConexion: e.target.value }));
                            setConnectionTestPassed(false);
                          }}
                          placeholder="Server=...;Database=...;User Id=...;Password=...;TrustServerCertificate=true;"
                          className={`${inputClass} font-mono`}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Query SQL</label>
                        <p className="text-xs text-slate-500 mb-1.5">Columnas: <strong>periodo</strong>, <strong>logrado</strong>, (opcional) <strong>meta</strong>. Variables: {'{{FECHA_INICIO}}'}, {'{{FECHA_FIN}}'}.</p>
                        <textarea
                          value={form.consultaSql}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, consultaSql: e.target.value }));
                            setConnectionTestPassed(false);
                          }}
                          placeholder="SELECT Mes AS periodo, Total AS logrado, Meta AS meta FROM Ventas"
                          rows={5}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={handleProbarConexion}
                          disabled={testingConnection || !form.cadenaConexion.trim() || !form.consultaSql.trim()}
                          className="w-full py-2.5 rounded-md text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                          {testingConnection ? 'Probando…' : 'Probar conexión'}
                        </button>
                        {connectionTestPassed && (
                          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                            <span aria-hidden>✓</span> Conexión verificada. Puedes continuar.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Metas y formato</h3>
                    <p className="text-xs text-slate-500">Unidad de medida y meta global.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className={labelClass} htmlFor="kpi-unit">Tipo de unidad</label>
                    <div className="relative">
                      <select
                        id="kpi-unit"
                        value={form.unidad}
                        onChange={(e) => setForm((p) => ({ ...p, unidad: e.target.value }))}
                        className={`${inputClass} appearance-none pr-8`}
                      >
                        {UNIDADES.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">Formato y sufijo de los valores.</p>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="kpi-meta">Meta global</label>
                    <input
                      id="kpi-meta"
                      type="number"
                      step="any"
                      value={form.metaGlobal}
                      onChange={(e) => setForm((p) => ({ ...p, metaGlobal: e.target.value }))}
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-400">Valor objetivo opcional.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : handleBack}
            className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Guardar como borrador
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                className="inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all"
              >
                Continuar
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting || !canFinish}
                className="inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Creando…' : 'Crear KPI'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
