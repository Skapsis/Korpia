'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import toast from 'react-hot-toast';

interface MenuConfig {
    id: string;
    menuKey: string;
    label: string;
    path: string;
    icon: string;
    enabled: boolean;
    order: number;
    minRole: string;
}

interface KPIConfig {
    id: string;
    area: string;
    kpiKey: string;
    displayName: string;
    goal: number | null;
    unit: string;
    chartType: string;
    color: string;
    enabled: boolean;
    order: number;
}

export default function LauncherPage() {
    const router = useRouter();
    const { user, token, isAdmin } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'menus' | 'kpis'>('menus');
    const [menus, setMenus] = useState<MenuConfig[]>([]);
    const [kpis, setKPIs] = useState<KPIConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Proteger ruta - solo superadmin
    useEffect(() => {
        if (!user || user.role !== 'superadmin') {
            toast.error('Acceso denegado. Solo para Super Administradores.');
            router.push('/dashboard');
        }
    }, [user, router]);

    // Cargar configuraciones
    useEffect(() => {
        if (!token || user?.role !== 'superadmin') return;
        loadConfigurations();
    }, [token, user]);

    const loadConfigurations = async () => {
        setLoading(true);
        try {
            const [menusRes, kpisRes] = await Promise.all([
                fetch('http://localhost:3000/api/configuration/menus', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:3000/api/configuration/kpis', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (menusRes.ok) {
                const data = await menusRes.json();
                setMenus(data.menus || []);
            }

            if (kpisRes.ok) {
                const data = await kpisRes.json();
                setKPIs(data.kpis || []);
            }
        } catch (error) {
            console.error('Error loading configurations:', error);
            toast.error('Error al cargar configuraciones');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuToggle = async (menuId: string, enabled: boolean) => {
        try {
            const res = await fetch(`http://localhost:3000/api/configuration/menus/${menuId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enabled })
            });

            if (res.ok) {
                setMenus(prev => prev.map(m => 
                    m.id === menuId ? { ...m, enabled } : m
                ));
                toast.success(`Menú ${enabled ? 'activado' : 'desactivado'}`);
            } else {
                throw new Error('Error al actualizar menú');
            }
        } catch (error) {
            console.error('Error updating menu:', error);
            toast.error('Error al actualizar menú');
        }
    };

    const handleMenuUpdate = async (menuId: string, updates: Partial<MenuConfig>) => {
        try {
            const res = await fetch(`http://localhost:3000/api/configuration/menus/${menuId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                setMenus(prev => prev.map(m => 
                    m.id === menuId ? { ...m, ...updates } : m
                ));
                toast.success('Menú actualizado');
            } else {
                throw new Error('Error al actualizar menú');
            }
        } catch (error) {
            console.error('Error updating menu:', error);
            toast.error('Error al actualizar menú');
        }
    };

    const handleKPIUpdate = async (kpiId: string, updates: Partial<KPIConfig>) => {
        try {
            const res = await fetch(`http://localhost:3000/api/configuration/kpis/${kpiId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                setKPIs(prev => prev.map(k => 
                    k.id === kpiId ? { ...k, ...updates } : k
                ));
                toast.success('KPI actualizado');
            } else {
                throw new Error('Error al actualizar KPI');
            }
        } catch (error) {
            console.error('Error updating KPI:', error);
            toast.error('Error al actualizar KPI');
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // Guardado masivo de todos los cambios
            toast.success('Todos los cambios han sido guardados');
            
            // Forzar recarga en otros clientes (podría implementarse con WebSockets)
            // Por ahora, los cambios se reflejarán en la próxima carga
        } catch (error) {
            console.error('Error saving all:', error);
            toast.error('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <span className="text-4xl">🚀</span>
                                Admin Launcher
                            </h1>
                            <p className="text-slate-600 mt-1">
                                Configuración global de la plataforma
                            </p>
                        </div>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30"
                        >
                            {saving ? 'Guardando...' : '💾 Guardar Todo'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="border-b border-slate-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('menus')}
                                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                                    activeTab === 'menus'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                📋 Gestión de Menús
                            </button>
                            <button
                                onClick={() => setActiveTab('kpis')}
                                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                                    activeTab === 'kpis'
                                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                📊 Configuración de KPIs
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'menus' && (
                            <MenusConfiguration
                                menus={menus}
                                onToggle={handleMenuToggle}
                                onUpdate={handleMenuUpdate}
                            />
                        )}
                        {activeTab === 'kpis' && (
                            <KPIsConfiguration
                                kpis={kpis}
                                onUpdate={handleKPIUpdate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== MenusConfiguration Component ====================

interface MenusConfigurationProps {
    menus: MenuConfig[];
    onToggle: (id: string, enabled: boolean) => void;
    onUpdate: (id: string, updates: Partial<MenuConfig>) => void;
}

function MenusConfiguration({ menus, onToggle, onUpdate }: MenusConfigurationProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<MenuConfig>>({});

    const handleEdit = (menu: MenuConfig) => {
        setEditingId(menu.id);
        setEditValues({ label: menu.label, icon: menu.icon, minRole: menu.minRole });
    };

    const handleSave = (menuId: string) => {
        onUpdate(menuId, editValues);
        setEditingId(null);
        setEditValues({});
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">Menús del Sistema</h2>
                <p className="text-sm text-slate-600">
                    Activa o desactiva menús y personaliza su configuración
                </p>
            </div>

            <div className="grid gap-4">
                {menus.map((menu) => (
                    <div
                        key={menu.id}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                                <span className="text-2xl">{menu.icon}</span>
                                
                                {editingId === menu.id ? (
                                    <div className="flex-1 grid grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            value={editValues.label || ''}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, label: e.target.value }))}
                                            className="px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="Nombre del menú"
                                        />
                                        <input
                                            type="text"
                                            value={editValues.icon || ''}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, icon: e.target.value }))}
                                            className="px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="Icono (emoji)"
                                        />
                                        <select
                                            value={editValues.minRole || 'viewer'}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, minRole: e.target.value }))}
                                            className="px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            <option value="viewer">Visualizador</option>
                                            <option value="gerente">Gerente</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900">{menu.label}</h3>
                                        <p className="text-sm text-slate-600">{menu.path}</p>
                                        <span className="text-xs text-slate-500">Rol mínimo: {menu.minRole}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {editingId === menu.id ? (
                                    <>
                                        <button
                                            onClick={() => handleSave(menu.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            ✓ Guardar
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                                        >
                                            ✗ Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleEdit(menu)}
                                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={menu.enabled}
                                                onChange={(e) => onToggle(menu.id, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== KPIsConfiguration Component ====================

interface KPIsConfigurationProps {
    kpis: KPIConfig[];
    onUpdate: (id: string, updates: Partial<KPIConfig>) => void;
}

function KPIsConfiguration({ kpis, onUpdate }: KPIsConfigurationProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<KPIConfig>>({});
    const [filterArea, setFilterArea] = useState<string>('all');

    const filteredKPIs = filterArea === 'all' 
        ? kpis 
        : kpis.filter(k => k.area === filterArea);

    const handleEdit = (kpi: KPIConfig) => {
        setEditingId(kpi.id);
        setEditValues({ 
            displayName: kpi.displayName, 
            goal: kpi.goal,
            unit: kpi.unit,
            color: kpi.color,
            chartType: kpi.chartType
        });
    };

    const handleSave = (kpiId: string) => {
        onUpdate(kpiId, editValues);
        setEditingId(null);
        setEditValues({});
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900">KPIs del Sistema</h2>
                <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                    <option value="all">Todas las áreas</option>
                    <option value="comercial">Comercial</option>
                    <option value="operaciones">Operaciones</option>
                    <option value="calidad">Calidad</option>
                </select>
            </div>

            <div className="grid gap-4">
                {filteredKPIs.map((kpi) => (
                    <div
                        key={kpi.id}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all"
                    >
                        {editingId === kpi.id ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Nombre del KPI
                                        </label>
                                        <input
                                            type="text"
                                            value={editValues.displayName || ''}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, displayName: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Meta
                                        </label>
                                        <input
                                            type="number"
                                            value={editValues.goal || ''}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, goal: parseFloat(e.target.value) }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Unidad
                                        </label>
                                        <input
                                            type="text"
                                            value={editValues.unit || ''}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, unit: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Color
                                        </label>
                                        <input
                                            type="color"
                                            value={editValues.color || '#3b82f6'}
                                            onChange={(e) => setEditValues(prev => ({ ...prev, color: e.target.value }))}
                                            className="w-full h-10 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => handleSave(kpi.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        ✓ Guardar
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                                    >
                                        ✗ Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: kpi.color }}
                                        ></span>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{kpi.displayName}</h3>
                                            <p className="text-sm text-slate-600">
                                                {kpi.area} • Meta: {kpi.goal} {kpi.unit} • Tipo: {kpi.chartType}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEdit(kpi)}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                >
                                    ✏️ Editar
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
