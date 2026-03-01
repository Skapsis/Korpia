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

const STEPS = [
  { id: 1, title: 'Información básica', short: 'Básico' },
  { id: 2, title: 'Origen de datos', short: 'Datos' },
  { id: 3, title: 'Metas y formato', short: 'Metas' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Barras', icon: '📊' },
  { value: 'line', label: 'Línea', icon: '📈' },
  { value: 'area', label: 'Área', icon: '📉' },
  { value: 'pie', label: 'Circular', icon: '🥧' },
  { value: 'scorecard', label: 'Tarjeta de Resumen (Scorecard)', icon: '🔢' },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Crear nuevo KPI</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Stepper */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                  step === s.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[280px]">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tablero</label>
                <select
                  value={form.tableroId}
                  onChange={(e) => setForm((p) => ({ ...p, tableroId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {tableros.map((t) => (
                    <option key={t.id} value={t.id}>{t.icono} {t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Título del KPI</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ej. Ventas mensuales"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de gráfico</label>
                <div className="grid grid-cols-4 gap-2">
                  {CHART_TYPES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, tipoGrafico: c.value }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        form.tipoGrafico === c.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{c.icon}</span>
                      <span className="text-xs font-medium">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Switch: Conectar en vivo a SQL Server */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-medium text-slate-800">Conectar en vivo a SQL Server</p>
                  <p className="text-xs text-slate-500 mt-0.5">El gráfico leerá los datos directamente desde tu base al abrir el tablero</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.usaDatosDinamicos}
                  onClick={() => {
                    setForm((p) => ({ ...p, usaDatosDinamicos: !p.usaDatosDinamicos }));
                    setConnectionTestPassed(false);
                  }}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    form.usaDatosDinamicos ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                      form.usaDatosDinamicos ? 'translate-x-5' : 'translate-x-1'
                    }`}
                    aria-hidden
                  />
                </button>
              </div>

              {!form.usaDatosDinamicos ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fuente de datos</label>
                    <select
                      value={form.fuenteDatosId}
                      onChange={(e) => setForm((p) => ({ ...p, fuenteDatosId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sin fuente (datos manuales después)</option>
                      {fuentesDatos.map((f) => (
                        <option key={f.id} value={f.id}>{f.nombre} ({f.tipo})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Query SQL (sincronización)</label>
                    <p className="text-xs text-slate-500 mb-1">Opcional. Debe retornar: periodo, logrado y opcionalmente meta</p>
                    <textarea
                      value={form.consultaSql}
                      onChange={(e) => setForm((p) => ({ ...p, consultaSql: e.target.value }))}
                      placeholder="SELECT mes AS periodo, SUM(total) AS logrado, 100 AS meta FROM ventas GROUP BY mes"
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cadena de conexión</label>
                    <input
                      type="password"
                      value={form.cadenaConexion}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, cadenaConexion: e.target.value }));
                        setConnectionTestPassed(false);
                      }}
                      placeholder="Server=localhost;Database=DB;User Id=sa;Password=123;TrustServerCertificate=true;"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Query SQL</label>
                    <p className="text-xs text-slate-500 mb-1">La query debe retornar columnas llamadas: <strong>periodo</strong>, <strong>logrado</strong> y (opcional) <strong>meta</strong>. <strong>Tip:</strong> Usa la variable <code className="bg-slate-100 px-1 rounded">{'{{FILTRO_GLOBAL}}'}</code> en tu WHERE para conectar este gráfico con el filtro superior del tablero.</p>
                    <textarea
                      value={form.consultaSql}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, consultaSql: e.target.value }));
                        setConnectionTestPassed(false);
                      }}
                      placeholder="SELECT Mes AS periodo, Total AS logrado, Meta AS meta FROM Ventas"
                      rows={6}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleProbarConexion}
                      disabled={testingConnection || !form.cadenaConexion.trim() || !form.consultaSql.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
                    >
                      {testingConnection ? 'Probando…' : 'Probar Conexión'}
                    </button>
                    {connectionTestPassed && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                        <span aria-hidden>✓</span> Conexión verificada. Puedes continuar al siguiente paso.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unidad</label>
                <select
                  value={form.unidad}
                  onChange={(e) => setForm((p) => ({ ...p, unidad: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta global</label>
                <input
                  type="number"
                  step="any"
                  value={form.metaGlobal}
                  onChange={(e) => setForm((p) => ({ ...p, metaGlobal: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between gap-3">
          <button
            type="button"
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          {step < 3 ? (
<button
            type="button"
            onClick={handleNext}
            disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Siguiente
          </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting || !canFinish}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Creando…' : 'Crear y Sincronizar KPI'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
