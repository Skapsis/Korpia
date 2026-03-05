import { NextResponse } from 'next/server';
// El usuario puede instalar: npm install pg mysql2
// import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dbType, host, port, user, password, database, sqlQuery } = body;

    if (!sqlQuery || typeof sqlQuery !== 'string' || !sqlQuery.trim()) {
      return NextResponse.json({ error: 'La consulta SQL es requerida' }, { status: 400 });
    }

    let results: Record<string, unknown>[] = [];

    if (dbType === 'postgres') {
      /*
      const client = new Client({
        host: host || 'localhost',
        port: port ? Number(port) : 5432,
        user: user || 'postgres',
        password: password || '',
        database: database || 'postgres',
      });
      await client.connect();
      const res = await client.query(sqlQuery.trim());
      results = res.rows as Record<string, unknown>[];
      await client.end();
      */
      // Mock de respuesta hasta que se instalen las librerías
      results = [
        { id: 1, Product: 'A', Revenue: 15000, Date: 'Ene' },
        { id: 2, Product: 'B', Revenue: 25000, Date: 'Feb' },
      ];
    } else if (dbType === 'mysql') {
      /*
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection({
        host: host || 'localhost',
        port: port ? Number(port) : 3306,
        user: user || 'root',
        password: password || '',
        database: database || '',
      });
      const [rows] = await conn.execute(sqlQuery.trim());
      results = (rows as Record<string, unknown>[]) || [];
      await conn.end();
      */
      return NextResponse.json({ error: 'MySQL no configurado aún. Instala mysql2 y descomenta el código.' }, { status: 400 });
    } else if (dbType === 'sqlite') {
      return NextResponse.json({ error: 'SQLite local no soportado en este API (requiere mejor-sqlite3 o similar)' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Tipo de base de datos no soportado aún' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de conexión';
    console.error('Database connection error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
