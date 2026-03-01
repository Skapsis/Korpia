'use server';

import * as sql from 'mssql';

export interface FiltrosConsulta {
  start?: string;
  end?: string;
}

/**
 * Ejecuta una consulta contra SQL Server usando la cadena de conexión proporcionada.
 * Sustituye en la query: {{FECHA_INICIO}} por filtros.start y {{FECHA_FIN}} por filtros.end.
 */
export async function ejecutarConsulta(
  cadenaConexion: string,
  query: string,
  filtros?: FiltrosConsulta
): Promise<{ success: true; data: Record<string, unknown>[] } | { error: string }> {
  let queryFinal = query;
  if (filtros?.start != null && filtros.start !== '') {
    queryFinal = queryFinal.replace(/\{\{FECHA_INICIO\}\}/g, filtros.start);
  }
  if (filtros?.end != null && filtros.end !== '') {
    queryFinal = queryFinal.replace(/\{\{FECHA_FIN\}\}/g, filtros.end);
  }

  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(cadenaConexion);
    const result = await pool.request().query(queryFinal);
    const recordset = (result.recordset ?? []) as Record<string, unknown>[];
    return { success: true, data: recordset };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido al ejecutar la consulta';
    return { error: message };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch {
        // ignore close errors
      }
    }
  }
}
