'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import sql from 'mssql';

// ─── CRUD FuenteDatos ───────────────────────────────────────────────────────

export async function crearFuenteDatos(
  empresaId: string,
  nombre: string,
  tipo: string,
  cadenaConexion: string
) {
  try {
    const tipoNorm = String(tipo).toUpperCase();
    if (tipoNorm !== 'POSTGRES' && tipoNorm !== 'MYSQL' && tipoNorm !== 'SQLSERVER') {
      return { error: 'Tipo debe ser POSTGRES, MYSQL o SQLSERVER' };
    }
    if (!nombre.trim() || !cadenaConexion.trim()) {
      return { error: 'Nombre y cadena de conexión son obligatorios' };
    }
    await prisma.fuenteDatos.create({
      data: {
        empresaId,
        nombre: nombre.trim(),
        tipo: tipoNorm,
        cadenaConexion: cadenaConexion.trim(),
      },
    });
    revalidatePath('/');
    revalidatePath('/configurador');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al crear la fuente de datos';
    return { error: message };
  }
}

export async function listarFuentesDatos(empresaId?: string) {
  try {
    const fuentes = await prisma.fuenteDatos.findMany({
      where: empresaId ? { empresaId } : undefined,
      orderBy: { nombre: 'asc' },
      include: { empresa: { select: { name: true } } },
    });
    return { success: true, fuentes };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al listar fuentes';
    return { error: message, fuentes: [] };
  }
}

export async function eliminarFuenteDatos(id: string) {
  try {
    await prisma.fuenteDatos.delete({ where: { id } });
    revalidatePath('/');
    revalidatePath('/configurador');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al eliminar la fuente';
    return { error: message };
  }
}

// ─── Sincronización desde BD externa ─────────────────────────────────────────

interface FilaExterna {
  periodo: string;
  logrado: number;
  meta?: number | null;
}

function pickKey(row: Record<string, unknown>, ...keys: string[]): unknown {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(row)) lower[k.toLowerCase()] = row[k];
  for (const key of keys) {
    const v = row[key] ?? lower[key?.toLowerCase()];
    if (v !== undefined) return v;
  }
  return undefined;
}

function normalizarFila(row: Record<string, unknown>): FilaExterna | null {
  const periodo = pickKey(row, 'periodo');
  const logrado = pickKey(row, 'logrado');
  if (periodo == null || logrado == null) return null;
  const periodoStr = String(periodo).trim();
  const logradoNum = Number(logrado);
  if (periodoStr === '' || Number.isNaN(logradoNum)) return null;
  const metaVal = pickKey(row, 'meta');
  const meta = metaVal != null ? Number(metaVal) : null;
  return { periodo: periodoStr, logrado: logradoNum, meta: Number.isNaN(meta) ? null : meta };
}

export async function sincronizarIndicador(indicadorId: string): Promise<
  | { success: true; rowsSynced: number }
  | { error: string }
> {
  try {
    const indicador = await prisma.indicador.findUnique({
      where: { id: indicadorId },
      include: { fuenteDatos: true },
    });

    if (!indicador) {
      return { error: 'Indicador no encontrado' };
    }
    if (!indicador.fuenteDatosId || !indicador.fuenteDatos) {
      return { error: 'El indicador no tiene una fuente de datos configurada' };
    }
    if (!indicador.consultaSql?.trim()) {
      return { error: 'El indicador no tiene una consulta SQL configurada' };
    }

    const fuente = indicador.fuenteDatos;
    const tipo = fuente.tipo.toUpperCase();
    const query = indicador.consultaSql.trim();
    let filas: FilaExterna[] = [];

    if (tipo === 'POSTGRES') {
      const client = new PgClient({ connectionString: fuente.cadenaConexion });
      try {
        await client.connect();
        const res = await client.query(query);
        await client.end();
        const rows = (res.rows as Record<string, unknown>[]) || [];
        for (const row of rows) {
          const f = normalizarFila(row);
          if (f) filas.push(f);
        }
      } catch (connErr) {
        const msg = connErr instanceof Error ? connErr.message : String(connErr);
        return { error: `Postgres: ${msg}` };
      }
    } else if (tipo === 'MYSQL') {
      try {
        const conn = await mysql.createConnection(fuente.cadenaConexion);
        try {
          const [rows] = await conn.query(query);
          const list = Array.isArray(rows) ? rows : [];
          for (const row of list) {
            const r = row as Record<string, unknown>;
            const f = normalizarFila(r);
            if (f) filas.push(f);
          }
        } finally {
          await conn.end();
        }
      } catch (connErr) {
        const msg = connErr instanceof Error ? connErr.message : String(connErr);
        return { error: `MySQL: ${msg}` };
      }
    } else if (tipo === 'SQLSERVER') {
      try {
        const pool = await sql.connect(fuente.cadenaConexion);
        try {
          const result = await pool.request().query(query);
          const recordset = (result.recordset as Record<string, unknown>[]) || [];
          for (const row of recordset) {
            const f = normalizarFila(row);
            if (f) filas.push(f);
          }
        } finally {
          await pool.close();
        }
      } catch (connErr) {
        const msg = connErr instanceof Error ? connErr.message : String(connErr);
        return { error: `SQL Server: ${msg}` };
      }
    } else {
      return { error: `Tipo de fuente no soportado: ${tipo}` };
    }

    if (filas.length === 0) {
      return { error: 'La consulta no devolvió filas con columnas periodo y logrado' };
    }

    // Borrar datos actuales del indicador e insertar los nuevos (reemplazo total)
    await prisma.$transaction([
      prisma.datoKPI.deleteMany({ where: { indicadorId } }),
      ...filas.map((f) =>
        prisma.datoKPI.create({
          data: {
            indicadorId,
            periodo: f.periodo,
            valorLogrado: f.logrado,
            valorMetaEspecifica: f.meta ?? null,
          },
        })
      ),
    ]);

    revalidatePath('/');
    revalidatePath('/configurador');
    return { success: true, rowsSynced: filas.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al sincronizar';
    return { error: message };
  }
}

// ─── Actualizar indicador con fuente y SQL ───────────────────────────────────

export async function actualizarIndicadorFuente(
  indicadorId: string,
  fuenteDatosId: string | null,
  consultaSql: string | null
) {
  try {
    await prisma.indicador.update({
      where: { id: indicadorId },
      data: {
        fuenteDatosId: fuenteDatosId || null,
        consultaSql: consultaSql?.trim() || null,
      },
    });
    revalidatePath('/');
    revalidatePath('/configurador');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al actualizar';
    return { error: message };
  }
}
