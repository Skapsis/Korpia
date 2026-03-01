'use server';

import * as sql from 'mssql';

/**
 * Ejecuta una consulta contra SQL Server usando la cadena de conexión proporcionada.
 * Si se pasa filtroGlobal, reemplaza {{FILTRO_GLOBAL}} en la query por ese valor.
 */
export async function ejecutarConsulta(
  cadenaConexion: string,
  query: string,
  filtroGlobal?: string
): Promise<{ success: true; data: Record<string, unknown>[] } | { error: string }> {
  const queryFinal = filtroGlobal != null && filtroGlobal !== ''
    ? query.replace(/\{\{FILTRO_GLOBAL\}\}/g, filtroGlobal)
    : query;

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
