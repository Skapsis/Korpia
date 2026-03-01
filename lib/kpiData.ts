import type { Empresa } from '@/lib/appContext';

export type Unidad =
  | 'contactos'
  | 'presupuestos'
  | 'moneda'
  | 'porcentaje'
  | 'porcentaje_inverso'
  | 'ordenes'
  | 'cantidad';

export interface Semana {
  name: string;
  logrado: number;
  meta: number;
}

export interface KPIItem {
  titulo: string;
  meta_total: number;
  logrado_total: number;
  unidad: Unidad;
  semanas: Semana[];
}

export interface KPIData {
  comercial: Record<string, KPIItem>;
  operaciones: Record<string, KPIItem>;
  calidad: Record<string, KPIItem>;
}

// ── SOLVEX ────────────────────────────────────────────────────────────────────
const solvexData: KPIData = {
  comercial: {
    contactos_efectivos: {
      titulo: 'Contactos Efectivos (Nuevos Potenciales)',
      meta_total: 50,
      logrado_total: 17,
      unidad: 'contactos',
      semanas: [
        { name: 'Week 1', logrado: 8,  meta: 10 },
        { name: 'Week 2', logrado: 9,  meta: 10 },
        { name: 'Week 3', logrado: 0,  meta: 10 },
        { name: 'Week 4', logrado: 0,  meta: 10 },
        { name: 'Week 5', logrado: 0,  meta: 10 },
      ],
    },
    presupuestos_cantidad: {
      titulo: 'Cantidad de Presupuestos Creados',
      meta_total: 100,
      logrado_total: 39,
      unidad: 'presupuestos',
      semanas: [
        { name: 'Week 1', logrado: 18, meta: 20 },
        { name: 'Week 2', logrado: 21, meta: 20 },
        { name: 'Week 3', logrado: 0,  meta: 20 },
        { name: 'Week 4', logrado: 0,  meta: 20 },
        { name: 'Week 5', logrado: 0,  meta: 20 },
      ],
    },
    presupuestos_valor: {
      titulo: 'Valor de Presupuestos ($)',
      meta_total: 250000000,
      logrado_total: 121700000,
      unidad: 'moneda',
      semanas: [
        { name: 'Week 1', logrado: 121700000, meta: 50000000 },
        { name: 'Week 2', logrado: 0,         meta: 50000000 },
        { name: 'Week 3', logrado: 0,         meta: 50000000 },
        { name: 'Week 4', logrado: 0,         meta: 50000000 },
        { name: 'Week 5', logrado: 0,         meta: 50000000 },
      ],
    },
  },
  operaciones: {
    tiempo_efectivo: {
      titulo: 'Tiempo Efectivo de Trabajo (%)',
      meta_total: 70,
      logrado_total: 46.5,
      unidad: 'porcentaje',
      semanas: [
        { name: 'Week 1', logrado: 60, meta: 70 },
        { name: 'Week 2', logrado: 33, meta: 70 },
        { name: 'Week 3', logrado: 0,  meta: 70 },
        { name: 'Week 4', logrado: 0,  meta: 70 },
        { name: 'Week 5', logrado: 0,  meta: 70 },
      ],
    },
    ordenes_ejecutadas: {
      titulo: 'Ordenes Programadas vs Ejecutadas',
      meta_total: 400,
      logrado_total: 167,
      unidad: 'ordenes',
      semanas: [
        { name: 'Week 1', logrado: 90, meta: 80 },
        { name: 'Week 2', logrado: 77, meta: 80 },
        { name: 'Week 3', logrado: 0,  meta: 80 },
        { name: 'Week 4', logrado: 0,  meta: 80 },
        { name: 'Week 5', logrado: 0,  meta: 80 },
      ],
    },
    cancelacion_ordenes: {
      titulo: 'Cancelacion de Ordenes de Trabajo',
      meta_total: 0,
      logrado_total: 5,
      unidad: 'ordenes',
      semanas: [
        { name: 'Week 1', logrado: 1, meta: 0 },
        { name: 'Week 2', logrado: 4, meta: 0 },
        { name: 'Week 3', logrado: 0, meta: 0 },
        { name: 'Week 4', logrado: 0, meta: 0 },
        { name: 'Week 5', logrado: 0, meta: 0 },
      ],
    },
  },
  calidad: {
    cancelacion_tecnica: {
      titulo: 'Cancelacion por Causas Tecnicas (%)',
      meta_total: 10,
      logrado_total: 0,
      unidad: 'porcentaje_inverso',
      semanas: [
        { name: 'Week 1', logrado: 0, meta: 2 },
        { name: 'Week 2', logrado: 0, meta: 2 },
        { name: 'Week 3', logrado: 0, meta: 2 },
        { name: 'Week 4', logrado: 0, meta: 2 },
        { name: 'Week 5', logrado: 0, meta: 2 },
      ],
    },
    deficiencias: {
      titulo: 'Deficiencias y Seguimiento (%)',
      meta_total: 275,
      logrado_total: 45,
      unidad: 'porcentaje_inverso',
      semanas: [
        { name: 'Week 1', logrado: 45, meta: 55 },
        { name: 'Week 2', logrado: 0,  meta: 55 },
        { name: 'Week 3', logrado: 0,  meta: 55 },
        { name: 'Week 4', logrado: 0,  meta: 55 },
        { name: 'Week 5', logrado: 0,  meta: 55 },
      ],
    },
    nps: {
      titulo: 'Satisfaccion NPS (%)',
      meta_total: 250,
      logrado_total: 85,
      unidad: 'porcentaje',
      semanas: [
        { name: 'Week 1', logrado: 85, meta: 50 },
        { name: 'Week 2', logrado: 0,  meta: 50 },
        { name: 'Week 3', logrado: 0,  meta: 50 },
        { name: 'Week 4', logrado: 0,  meta: 50 },
        { name: 'Week 5', logrado: 0,  meta: 50 },
      ],
    },
    producto_consumido: {
      titulo: 'Producto Sugerido vs Consumido',
      meta_total: 500,
      logrado_total: 95,
      unidad: 'cantidad',
      semanas: [
        { name: 'Week 1', logrado: 95,  meta: 100 },
        { name: 'Week 2', logrado: 0,   meta: 100 },
        { name: 'Week 3', logrado: 0,   meta: 100 },
        { name: 'Week 4', logrado: 0,   meta: 100 },
        { name: 'Week 5', logrado: 0,   meta: 100 },
      ],
    },
  },
};

// ── EL MEJOR ──────────────────────────────────────────────────────────────────
const elMejorData: KPIData = {
  comercial: {
    contactos_efectivos: {
      titulo: 'Contactos Efectivos (Nuevos Potenciales)',
      meta_total: 60,
      logrado_total: 58,
      unidad: 'contactos',
      semanas: [
        { name: 'Week 1', logrado: 14, meta: 12 },
        { name: 'Week 2', logrado: 13, meta: 12 },
        { name: 'Week 3', logrado: 11, meta: 12 },
        { name: 'Week 4', logrado: 12, meta: 12 },
        { name: 'Week 5', logrado: 8,  meta: 12 },
      ],
    },
    presupuestos_cantidad: {
      titulo: 'Cantidad de Presupuestos Creados',
      meta_total: 100,
      logrado_total: 114,
      unidad: 'presupuestos',
      semanas: [
        { name: 'Week 1', logrado: 24, meta: 20 },
        { name: 'Week 2', logrado: 22, meta: 20 },
        { name: 'Week 3', logrado: 26, meta: 20 },
        { name: 'Week 4', logrado: 23, meta: 20 },
        { name: 'Week 5', logrado: 19, meta: 20 },
      ],
    },
    presupuestos_valor: {
      titulo: 'Valor de Presupuestos ($)',
      meta_total: 300000000,
      logrado_total: 312000000,
      unidad: 'moneda',
      semanas: [
        { name: 'Week 1', logrado: 68000000, meta: 60000000 },
        { name: 'Week 2', logrado: 72000000, meta: 60000000 },
        { name: 'Week 3', logrado: 55000000, meta: 60000000 },
        { name: 'Week 4', logrado: 62000000, meta: 60000000 },
        { name: 'Week 5', logrado: 55000000, meta: 60000000 },
      ],
    },
  },
  operaciones: {
    tiempo_efectivo: {
      titulo: 'Tiempo Efectivo de Trabajo (%)',
      meta_total: 350,
      logrado_total: 368,
      unidad: 'porcentaje',
      semanas: [
        { name: 'Week 1', logrado: 74, meta: 70 },
        { name: 'Week 2', logrado: 72, meta: 70 },
        { name: 'Week 3', logrado: 75, meta: 70 },
        { name: 'Week 4', logrado: 71, meta: 70 },
        { name: 'Week 5', logrado: 76, meta: 70 },
      ],
    },
    ordenes_ejecutadas: {
      titulo: 'Ordenes Programadas vs Ejecutadas',
      meta_total: 400,
      logrado_total: 421,
      unidad: 'ordenes',
      semanas: [
        { name: 'Week 1', logrado: 88, meta: 80 },
        { name: 'Week 2', logrado: 82, meta: 80 },
        { name: 'Week 3', logrado: 85, meta: 80 },
        { name: 'Week 4', logrado: 84, meta: 80 },
        { name: 'Week 5', logrado: 82, meta: 80 },
      ],
    },
    cancelacion_ordenes: {
      titulo: 'Cancelacion de Ordenes de Trabajo',
      meta_total: 0,
      logrado_total: 3,
      unidad: 'ordenes',
      semanas: [
        { name: 'Week 1', logrado: 1, meta: 0 },
        { name: 'Week 2', logrado: 0, meta: 0 },
        { name: 'Week 3', logrado: 2, meta: 0 },
        { name: 'Week 4', logrado: 0, meta: 0 },
        { name: 'Week 5', logrado: 0, meta: 0 },
      ],
    },
  },
  calidad: {
    cancelacion_tecnica: {
      titulo: 'Cancelacion por Causas Tecnicas (%)',
      meta_total: 10,
      logrado_total: 4,
      unidad: 'porcentaje_inverso',
      semanas: [
        { name: 'Week 1', logrado: 1, meta: 2 },
        { name: 'Week 2', logrado: 0, meta: 2 },
        { name: 'Week 3', logrado: 2, meta: 2 },
        { name: 'Week 4', logrado: 1, meta: 2 },
        { name: 'Week 5', logrado: 0, meta: 2 },
      ],
    },
    deficiencias: {
      titulo: 'Deficiencias y Seguimiento (%)',
      meta_total: 275,
      logrado_total: 180,
      unidad: 'porcentaje_inverso',
      semanas: [
        { name: 'Week 1', logrado: 38, meta: 55 },
        { name: 'Week 2', logrado: 40, meta: 55 },
        { name: 'Week 3', logrado: 35, meta: 55 },
        { name: 'Week 4', logrado: 32, meta: 55 },
        { name: 'Week 5', logrado: 35, meta: 55 },
      ],
    },
    nps: {
      titulo: 'Satisfaccion NPS (%)',
      meta_total: 250,
      logrado_total: 360,
      unidad: 'porcentaje',
      semanas: [
        { name: 'Week 1', logrado: 82, meta: 50 },
        { name: 'Week 2', logrado: 78, meta: 50 },
        { name: 'Week 3', logrado: 72, meta: 50 },
        { name: 'Week 4', logrado: 65, meta: 50 },
        { name: 'Week 5', logrado: 63, meta: 50 },
      ],
    },
    producto_consumido: {
      titulo: 'Producto Sugerido vs Consumido',
      meta_total: 500,
      logrado_total: 487,
      unidad: 'cantidad',
      semanas: [
        { name: 'Week 1', logrado: 98,  meta: 100 },
        { name: 'Week 2', logrado: 97,  meta: 100 },
        { name: 'Week 3', logrado: 96,  meta: 100 },
        { name: 'Week 4', logrado: 100, meta: 100 },
        { name: 'Week 5', logrado: 96,  meta: 100 },
      ],
    },
  },
};

// ── Mapa por empresa ──────────────────────────────────────────────────────────
const dataByEmpresa: Record<string, KPIData> = {
  SOLVEX:      solvexData,
  'EL MEJOR':  elMejorData,
};

/**
 * Devuelve los datos KPI para la empresa indicada.
 * Si no existe, retorna datos de SOLVEX como fallback.
 */
export function getKPIData(empresa: string | null | undefined): KPIData {
  if (!empresa) return solvexData;
  return dataByEmpresa[empresa] ?? solvexData;
}

export default solvexData;
