'use client';

import { useState, useEffect, Fragment } from 'react';
import { useApp } from '@/lib/appContext';
import { useAuth } from '@/lib/useAuth';
import {
    fetchTableros,
    fetchConfigPublic,
    createTablero,
    updateTablero,
    deleteTablero,
    createIndicador,
    updateIndicador,
    deleteIndicador,
    upsertDatos,
    fetchCompanies,
    Tablero,
    Indicador,
    DatoInput,
    CompanyOption,
} from '@/lib/configDrivenApi';
import toast from 'react-hot-toast';
import { IndicadorCard } from '@/components/dashboard/IndicadorCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_GRAFICO_OPTS = [
    { value: 'bar', label: '📊 Barras' },
    { value: 'line', label: '📈 Línea' },
    { value: 'area', label: '📉 Área' },
    { value: 'combo', label: '🔀 Combinado' },
    { value: 'pie', label: '🥧 Circular' },
    { value: 'gauge', label: '🎯 Gauge' },
    { value: 'scorecard', label: '🔢 Scorecard' },
    { value: 'table', label: '📋 Tabla' },
];

type TipoGrafico = 'bar' | 'line' | 'combo' | 'pie' | 'area' | 'gauge' | 'scorecard' | 'table';

const UNIDAD_OPTS = [
    { value: 'num', label: 'Número' },
    { value: '%', label: 'Porcentaje (%)' },
    { value: '$', label: 'Pesos ($)' },
    { value: 'USD', label: 'Dólares (USD)' },
];

const ICONO_OPTS = ['📊', '📈', '🏭', '💰', '⚙️', '🎯', '🛠️', '📦', '🌐', '🏆'];

// ─── Form defaults ────────────────────────────────────────────────────────────
const defaultTableroForm = () => ({
    nombre: '',
    icono: '📊',
    orden: 1,
});

const defaultIndicadorForm = (): { titulo: string; tipoGrafico: TipoGrafico; unidad: string; metaGlobal: number; colorPrincipal: string; esMejorMayor: boolean; orden: number } => ({
    titulo: '',
    tipoGrafico: 'bar',
    unidad: 'num',
    metaGlobal: 100,
    colorPrincipal: '#3B82F6',
    esMejorMayor: true,
    orden: 1,
});

// ─── Component ────────────────────────────────────────────────────────────────
const PERIODOS_MENSUAL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PERIODOS_TRIMESTRAL = ['Q1', 'Q2', 'Q3', 'Q4'];
const PERIODOS_SEMANAL = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];

function getPeriodosForTipo(tipo: 'mensual' | 'trimestral' | 'semanal') {
    return tipo === 'trimestral' ? PERIODOS_TRIMESTRAL : tipo === 'semanal' ? PERIODOS_SEMANAL : PERIODOS_MENSUAL;
}

export default function ConfigPage() {
    const { auth, refreshSystemConfig, systemConfig } = useApp();
    const { company, isAdmin } = useAuth();

    // Selector de empresa (solo superadmin)
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selectedEmpresaSlug, setSelectedEmpresaSlug] = useState<string | null>(null);

    // Tableros
    const [tableros, setTableros] = useState<Tablero[]>([]);
    const [loadingTableros, setLoadingTableros] = useState(true);
    const [activeTab, setActiveTab] = useState<'tableros' | 'indicadores' | 'datos'>('tableros');

    // Selección activa
    const [selectedTablero, setSelectedTablero] = useState<Tablero | null>(null);
    const [selectedIndicador, setSelectedIndicador] = useState<Indicador | null>(null);

    // Formulario Tablero
    const [showTableroForm, setShowTableroForm] = useState(false);
    const [tableroForm, setTableroForm] = useState(defaultTableroForm());
    const [editingTablero, setEditingTablero] = useState<string | null>(null);

    // Formulario Indicador
    const [showIndicadorForm, setShowIndicadorForm] = useState(false);
    const [indicadorForm, setIndicadorForm] = useState(defaultIndicadorForm());
    const [editingIndicador, setEditingIndicador] = useState<string | null>(null);
    const [previewIndicador, setPreviewIndicador] = useState<Indicador | null>(null);

    // Datos
    const [datosGrid, setDatosGrid] = useState<{ periodo: string; logrado: string; meta: string }[]>(
        getPeriodosForTipo('mensual').map((p) => ({ periodo: p, logrado: '', meta: '' }))
    );
    const [savingDatos, setSavingDatos] = useState(false);

    // Tipo de período para el grid de datos
    const [tipoPeriodo, setTipoPeriodo] = useState<'mensual' | 'trimestral' | 'semanal'>('mensual');

    const empresaSlug = selectedEmpresaSlug ?? systemConfig?.empresa?.slug ?? company?.slug ?? (typeof auth.empresa === 'string' ? auth.empresa.toLowerCase().replace(/\s+/g, '-') : 'solvex');

    // ── Cargar empresas (superadmin) ────────────────────────────────────────
    useEffect(() => {
        if (!auth.isAuthenticated || !isAdmin) return;
        fetchCompanies().then((list) => {
            setCompanies(list);
            setSelectedEmpresaSlug((prev) => (prev ? prev : list[0]?.slug ?? null));
        }).catch(() => {});
    }, [auth.isAuthenticated, isAdmin]);

    // ── Cargar tableros ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!auth.isAuthenticated) return;
        loadTableros();
    }, [auth.isAuthenticated, empresaSlug]);

    // ── Actualizar grid cuando cambia tipoPeriodo y hay indicador seleccionado ─
    useEffect(() => {
        if (!selectedIndicador) return;
        const periodos = getPeriodosForTipo(tipoPeriodo);
        const grid = periodos.map((p) => {
            const dato = selectedIndicador.datos?.find((d) => d.periodo === p);
            return {
                periodo: p,
                logrado: dato ? String(dato.valorLogrado) : '',
                meta: dato?.valorMetaEspecifica != null ? String(dato.valorMetaEspecifica) : '',
            };
        });
        setDatosGrid(grid);
    }, [tipoPeriodo, selectedIndicador?.id]);

    async function loadTableros() {
        setLoadingTableros(true);
        try {
            try {
                const data = await fetchTableros(empresaSlug);
                setTableros(data);
            } catch {
                const config = await fetchConfigPublic(empresaSlug);
                setTableros(config.tableros ?? []);
            }
        } catch {
            toast.error('Error al cargar tableros');
        } finally {
            setLoadingTableros(false);
        }
    }

    // ── Seleccionar tablero → cargar indicadores ──────────────────────────────
    function selectTablero(t: Tablero) {
        setSelectedTablero(t);
        setSelectedIndicador(null);
        setActiveTab('indicadores');
    }

    function selectIndicador(ind: Indicador) {
        setSelectedIndicador(ind);
        const periodos = getPeriodosForTipo(tipoPeriodo);
        const grid = periodos.map((p) => {
            const dato = ind.datos?.find((d) => d.periodo === p);
            return {
                periodo: p,
                logrado: dato ? String(dato.valorLogrado) : '',
                meta: dato?.valorMetaEspecifica != null ? String(dato.valorMetaEspecifica) : '',
            };
        });
        setDatosGrid(grid);
        setActiveTab('datos');
    }

    // ── CRUD Tableros ─────────────────────────────────────────────────────────
    function openNuevoTablero() {
        setTableroForm(defaultTableroForm());
        setEditingTablero(null);
        setShowTableroForm(true);
    }

    function openEditTablero(t: Tablero) {
        setTableroForm({ nombre: t.nombre, icono: t.icono, orden: t.orden });
        setEditingTablero(t.id);
        setShowTableroForm(true);
    }

    async function submitTablero() {
        if (!tableroForm.nombre.trim()) {
            toast.error('El nombre del tablero es obligatorio');
            return;
        }
        try {
            if (editingTablero) {
                const updated = await updateTablero(editingTablero, tableroForm);
                setTableros((prev) => prev.map((t) => (t.id === editingTablero ? { ...t, ...updated } : t)));
                toast.success('Tablero actualizado');
            } else {
                const created = await createTablero({ ...tableroForm, empresaId: empresaSlug });
                setTableros((prev) => [...prev, { ...created, indicadores: [] }]);
                toast.success('Tablero creado');
            }
            setShowTableroForm(false);
            refreshSystemConfig();
        } catch {
            toast.error('Error al guardar el tablero');
        }
    }

    async function handleDeleteTablero(id: string) {
        if (!confirm('¿Eliminar este tablero y todos sus indicadores?')) return;
        try {
            await deleteTablero(id);
            setTableros((prev) => prev.filter((t) => t.id !== id));
            if (selectedTablero?.id === id) setSelectedTablero(null);
            toast.success('Tablero eliminado');
            refreshSystemConfig();
        } catch {
            toast.error('Error al eliminar el tablero');
        }
    }

    // ── CRUD Indicadores ──────────────────────────────────────────────────────
    function openNuevoIndicador() {
        setIndicadorForm(defaultIndicadorForm());
        setEditingIndicador(null);
        setShowIndicadorForm(true);
    }

    function openEditIndicador(ind: Indicador) {
        setIndicadorForm({
            titulo: ind.titulo,
            tipoGrafico: ind.tipoGrafico,
            unidad: ind.unidad,
            metaGlobal: ind.metaGlobal,
            colorPrincipal: ind.colorPrincipal,
            esMejorMayor: ind.esMejorMayor,
            orden: ind.orden,
        });
        setEditingIndicador(ind.id);
        setShowIndicadorForm(true);
    }

    async function submitIndicador() {
        if (!indicadorForm.titulo.trim()) {
            toast.error('El título del indicador es obligatorio');
            return;
        }
        if (!selectedTablero) return;
        try {
            if (editingIndicador) {
                const updated = await updateIndicador(editingIndicador, indicadorForm);
                setSelectedTablero((prev) =>
                    prev
                        ? { ...prev, indicadores: prev.indicadores.map((i) => (i.id === editingIndicador ? { ...i, ...updated } : i)) }
                        : prev
                );
                setTableros((prev) =>
                    prev.map((t) =>
                        t.id === selectedTablero.id
                            ? { ...t, indicadores: t.indicadores.map((i) => (i.id === editingIndicador ? { ...i, ...updated } : i)) }
                            : t
                    )
                );
                toast.success('Indicador actualizado');
            } else {
                const created = await createIndicador({ ...indicadorForm, tableroId: selectedTablero.id });
                const newInd = { ...created, datos: [] } as Indicador;
                setSelectedTablero((prev) =>
                    prev ? { ...prev, indicadores: [...prev.indicadores, newInd] } : prev
                );
                setTableros((prev) =>
                    prev.map((t) =>
                        t.id === selectedTablero.id ? { ...t, indicadores: [...t.indicadores, newInd] } : t
                    )
                );
                toast.success('Indicador creado');
            }
            setShowIndicadorForm(false);
            refreshSystemConfig();
        } catch {
            toast.error('Error al guardar el indicador');
        }
    }

    async function handleDeleteIndicador(id: string) {
        if (!confirm('¿Eliminar este indicador y todos sus datos?')) return;
        try {
            await deleteIndicador(id);
            setSelectedTablero((prev) =>
                prev ? { ...prev, indicadores: prev.indicadores.filter((i) => i.id !== id) } : prev
            );
            setTableros((prev) =>
                prev.map((t) =>
                    t.id === selectedTablero?.id
                        ? { ...t, indicadores: t.indicadores.filter((i) => i.id !== id) }
                        : t
                )
            );
            if (selectedIndicador?.id === id) {
                setSelectedIndicador(null);
                setActiveTab('indicadores');
            }
            toast.success('Indicador eliminado');
            refreshSystemConfig();
        } catch {
            toast.error('Error al eliminar el indicador');
        }
    }

    // ── Guardar datos ─────────────────────────────────────────────────────────
    async function saveDatos() {
        if (!selectedIndicador) return;
        setSavingDatos(true);
        try {
            const payload: DatoInput[] = datosGrid
                .filter((r) => r.logrado !== '')
                .map((r) => ({
                    indicadorId: selectedIndicador.id,
                    periodo: r.periodo,
                    valorLogrado: parseFloat(r.logrado) || 0,
                    valorMetaEspecifica: r.meta !== '' ? parseFloat(r.meta) : null,
                }));
            await upsertDatos(payload);
            toast.success(`${payload.length} períodos guardados`);
            refreshSystemConfig();
        } catch {
            toast.error('Error al guardar datos');
        } finally {
            setSavingDatos(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    if (!auth.isAuthenticated) return null;

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Administración</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Gestiona tableros, indicadores y datos para{' '}
                        {isAdmin && companies.length > 1 ? (
                            <select
                                value={selectedEmpresaSlug ?? empresaSlug}
                                onChange={(e) => setSelectedEmpresaSlug(e.target.value || null)}
                                className="font-semibold text-blue-600 bg-transparent border-b border-blue-400 cursor-pointer focus:outline-none"
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.slug}>{c.name}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="font-semibold text-blue-600">{empresaSlug}</span>
                        )}
                    </p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-full">
                    Configuration-Driven UI
                </span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-8">
                {[
                    { key: 'tableros', label: '🏗️ Tableros' },
                    { key: 'indicadores', label: '📊 Indicadores', disabled: !selectedTablero },
                    { key: 'datos', label: '📝 Datos', disabled: !selectedIndicador },
                ].map(({ key, label, disabled }) => (
                    <button
                        key={key}
                        disabled={!!disabled}
                        onClick={() => !disabled && setActiveTab(key as typeof activeTab)}
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === key
                                ? 'border-indigo-600 text-indigo-700'
                                : disabled
                                ? 'border-transparent text-slate-300 cursor-not-allowed'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {label}
                        {key === 'indicadores' && selectedTablero && (
                            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {selectedTablero.nombre}
                            </span>
                        )}
                        {key === 'datos' && selectedIndicador && (
                            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                {selectedIndicador.titulo}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">

                {/* ── TAB: TABLEROS ────────────────────────────────────────── */}
                {activeTab === 'tableros' && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Tableros configurados</h2>
                            <button
                                onClick={openNuevoTablero}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                            >
                                + Nuevo Tablero
                            </button>
                        </div>

                        {loadingTableros ? (
                            <div className="text-center py-16">
                                <div className="h-8 w-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-slate-400 text-sm">Cargando tableros…</p>
                            </div>
                        ) : tableros.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-4xl mb-3">📋</p>
                                <p className="text-slate-600 font-semibold">No hay tableros configurados</p>
                                <p className="text-slate-400 text-sm mt-1">Crea el primer tablero para comenzar</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {tableros.map((t) => (
                                    <div
                                        key={t.id}
                                        className={`bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                                            selectedTablero?.id === t.id
                                                ? 'border-indigo-500 shadow-md shadow-indigo-100'
                                                : 'border-slate-100 hover:border-indigo-200'
                                        }`}
                                        onClick={() => selectTablero(t)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{t.icono}</span>
                                                <div>
                                                    <p className="font-bold text-slate-800">{t.nombre}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {t.indicadores?.length ?? 0} indicadores · orden #{t.orden}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 ml-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditTablero(t); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTablero(t.id); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => selectTablero(t)}
                                            className="mt-4 w-full text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg py-1.5 transition-all"
                                        >
                                            Ver indicadores →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Modal Tablero */}
                        {showTableroForm && (
                            <Modal title={editingTablero ? 'Editar Tablero' : 'Nuevo Tablero'} onClose={() => setShowTableroForm(false)}>
                                <FormField label="Nombre *">
                                    <input
                                        className="input-base"
                                        placeholder="Ej. Comercial, Operaciones…"
                                        value={tableroForm.nombre}
                                        onChange={(e) => setTableroForm({ ...tableroForm, nombre: e.target.value })}
                                    />
                                </FormField>
                                <FormField label="Ícono">
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {ICONO_OPTS.map((ic) => (
                                            <button
                                                key={ic}
                                                onClick={() => setTableroForm({ ...tableroForm, icono: ic })}
                                                className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                                                    tableroForm.icono === ic ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'
                                                }`}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>
                                <FormField label="Orden">
                                    <input
                                        type="number"
                                        className="input-base"
                                        min={1}
                                        value={tableroForm.orden}
                                        onChange={(e) => setTableroForm({ ...tableroForm, orden: parseInt(e.target.value) || 1 })}
                                    />
                                </FormField>
                                <ModalActions onCancel={() => setShowTableroForm(false)} onSubmit={submitTablero} />
                            </Modal>
                        )}
                    </section>
                )}

                {/* ── TAB: INDICADORES ─────────────────────────────────────── */}
                {activeTab === 'indicadores' && selectedTablero && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    {selectedTablero.icono} {selectedTablero.nombre}
                                </h2>
                                <p className="text-sm text-slate-400 mt-0.5">Indicadores/KPIs del tablero</p>
                            </div>
                            <button
                                onClick={openNuevoIndicador}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                            >
                                + Nuevo KPI
                            </button>
                        </div>

                        {selectedTablero.indicadores?.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-4xl mb-3">📊</p>
                                <p className="text-slate-600 font-semibold">Sin indicadores</p>
                                <p className="text-slate-400 text-sm mt-1">Agrega el primer KPI a este tablero</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3 text-left">Título</th>
                                            <th className="px-4 py-3 text-left">Tipo Gráfico</th>
                                            <th className="px-4 py-3 text-left">Unidad</th>
                                            <th className="px-4 py-3 text-right">Meta Global</th>
                                            <th className="px-4 py-3 text-left">Regla</th>
                                            <th className="px-4 py-3 text-center">Orden</th>
                                            <th className="px-4 py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTablero.indicadores.map((ind) => (
                                            <tr
                                                key={ind.id}
                                                className={`border-b border-slate-50 transition-all cursor-pointer ${
                                                    selectedIndicador?.id === ind.id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                                }`}
                                                onClick={() => selectIndicador(ind)}
                                            >
                                                <td className="px-4 py-3 font-semibold text-slate-800">
                                                    <span
                                                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                                                        style={{ backgroundColor: ind.colorPrincipal }}
                                                    />
                                                    {ind.titulo}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {TIPO_GRAFICO_OPTS.find((o) => o.value === ind.tipoGrafico)?.label ?? ind.tipoGrafico}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{ind.unidad}</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700">{ind.metaGlobal}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ind.esMejorMayor ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                        {ind.esMejorMayor ? '↑ Mayor es mejor' : '↓ Menor es mejor'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-400">{ind.orden}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditIndicador(ind); }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteIndicador(ind.id); }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            🗑️
                                                        </button>
                                                        <button
                                                            onClick={() => selectIndicador(ind)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 text-xs font-bold"
                                                            title="Ingresar datos"
                                                        >
                                                            📝
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPreviewIndicador(ind); }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                                            title="Vista previa"
                                                        >
                                                            👁️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Modal Indicador */}
                        {showIndicadorForm && (
                            <Modal title={editingIndicador ? 'Editar KPI' : 'Nuevo KPI'} onClose={() => setShowIndicadorForm(false)}>
                                <FormField label="Título *">
                                    <input
                                        className="input-base"
                                        placeholder="Ej. Ventas Netas, Tiempo Resolución…"
                                        value={indicadorForm.titulo}
                                        onChange={(e) => setIndicadorForm({ ...indicadorForm, titulo: e.target.value })}
                                    />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Tipo de Gráfico">
                                        <select
                                            className="input-base"
                                            value={indicadorForm.tipoGrafico}
                                            onChange={(e) => setIndicadorForm({ ...indicadorForm, tipoGrafico: e.target.value as TipoGrafico })}
                                        >
                                            {TIPO_GRAFICO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Unidad de medida">
                                        <select
                                            className="input-base"
                                            value={indicadorForm.unidad}
                                            onChange={(e) => setIndicadorForm({ ...indicadorForm, unidad: e.target.value })}
                                        >
                                            {UNIDAD_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Meta Global">
                                        <input
                                            type="number"
                                            className="input-base"
                                            value={indicadorForm.metaGlobal}
                                            onChange={(e) => setIndicadorForm({ ...indicadorForm, metaGlobal: parseFloat(e.target.value) || 0 })}
                                        />
                                    </FormField>
                                    <FormField label="Color">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                                value={indicadorForm.colorPrincipal}
                                                onChange={(e) => setIndicadorForm({ ...indicadorForm, colorPrincipal: e.target.value })}
                                            />
                                            <span className="text-xs text-slate-400 font-mono">{indicadorForm.colorPrincipal}</span>
                                        </div>
                                    </FormField>
                                </div>
                                <FormField label="Orden">
                                    <input
                                        type="number"
                                        className="input-base"
                                        min={1}
                                        value={indicadorForm.orden}
                                        onChange={(e) => setIndicadorForm({ ...indicadorForm, orden: parseInt(e.target.value) || 1 })}
                                    />
                                </FormField>
                                <FormField label="Regla de evaluación">
                                    <div className="flex gap-3 mt-1">
                                        {[{ val: true, label: '↑ Mayor es mejor' }, { val: false, label: '↓ Menor es mejor' }].map(({ val, label }) => (
                                            <button
                                                key={String(val)}
                                                onClick={() => setIndicadorForm({ ...indicadorForm, esMejorMayor: val })}
                                                className={`flex-1 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                                                    indicadorForm.esMejorMayor === val
                                                        ? val ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>
                                <ModalActions onCancel={() => setShowIndicadorForm(false)} onSubmit={submitIndicador} />
                            </Modal>
                        )}

                        {/* Modal Vista Previa */}
                        {previewIndicador && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPreviewIndicador(null)}>
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-800">Vista previa — {previewIndicador.titulo}</h3>
                                        <button onClick={() => setPreviewIndicador(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
                                    </div>
                                    <div className="p-6">
                                        <IndicadorCard indicador={previewIndicador} expanded />
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ── TAB: DATOS ────────────────────────────────────────────── */}
                {activeTab === 'datos' && selectedIndicador && (
                    <section>
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Datos — {selectedIndicador.titulo}
                                </h2>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    Meta global: <strong>{selectedIndicador.metaGlobal} {selectedIndicador.unidad}</strong>
                                    {' · '}
                                    Tablero: {selectedTablero?.nombre}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                            {/* Tipo de período */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Períodos:</span>
                                {(['mensual', 'trimestral', 'semanal'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTipoPeriodo(t)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            tipoPeriodo === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {t === 'mensual' ? '📅 Mensual' : t === 'trimestral' ? '📊 Trimestral' : '📆 Semanal'}
                                    </button>
                                ))}
                            </div>
                            {/* Importar CSV */}
                            <button
                                onClick={() => {
                                    const headers = 'periodo,valorLogrado,valorMetaEspecifica';
                                    const rows = datosGrid
                                        .filter((r) => r.logrado !== '')
                                        .map((r) => `${r.periodo},${r.logrado},${r.meta || ''}`);
                                    const csv = [headers, ...rows].join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `datos-${selectedIndicador.titulo.replace(/\s+/g, '-')}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('CSV exportado');
                                }}
                                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
                            >
                                📥 Exportar
                            </button>
                            <button
                                onClick={saveDatos}
                                disabled={savingDatos}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                            >
                                {savingDatos ? '⏳ Guardando…' : '💾 Guardar Datos'}
                            </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
                                    Ingresa el valor logrado y la meta específica por período
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3 text-left w-24">Período</th>
                                            <th className="px-4 py-3 text-right">
                                                Logrado <span className="text-slate-400 normal-case">({selectedIndicador.unidad})</span>
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Meta específica <span className="text-slate-400 normal-case">(vacío = meta global)</span>
                                            </th>
                                            <th className="px-4 py-3 text-center w-28">Cumplimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datosGrid.map((row, i) => {
                                            const logrado = parseFloat(row.logrado);
                                            const meta = row.meta !== '' ? parseFloat(row.meta) : selectedIndicador.metaGlobal;
                                            const pct = !isNaN(logrado) && meta > 0 ? ((logrado / meta) * 100).toFixed(1) : null;
                                            const ok = pct !== null && parseFloat(pct) >= 100;
                                            return (
                                                <tr key={row.periodo} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                                                    <td className="px-4 py-2 font-semibold text-slate-700">{row.periodo}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className="w-full text-right border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                                            placeholder="—"
                                                            value={row.logrado}
                                                            onChange={(e) => {
                                                                const updated = [...datosGrid];
                                                                updated[i] = { ...row, logrado: e.target.value };
                                                                setDatosGrid(updated);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className="w-full text-right border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                                            placeholder={String(selectedIndicador.metaGlobal)}
                                                            value={row.meta}
                                                            onChange={(e) => {
                                                                const updated = [...datosGrid];
                                                                updated[i] = { ...row, meta: e.target.value };
                                                                setDatosGrid(updated);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {pct !== null ? (
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                                {pct}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400 text-center">
                            Los datos se guardan en modo upsert — si ya existen para el período, se actualizan.
                            {' '}CSV esperado: <code className="bg-slate-100 px-1 rounded">periodo,valorLogrado,valorMetaEspecifica</code>
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
                </div>
                <div className="px-6 py-5 space-y-4">{children}</div>
            </div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

function ModalActions({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
    return (
        <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
                Cancelar
            </button>
            <button onClick={onSubmit} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all">
                Guardar
            </button>
        </div>
    );
}
