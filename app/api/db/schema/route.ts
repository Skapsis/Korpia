import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/db/schema
 * Recibe credenciales (o ID de conexión) y devuelve tablas y columnas.
 * Consultas típicas: information_schema.tables / information_schema.columns
 * (Postgres/MySQL/SQL Server).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dbType /* , host, port, user, password, database */ } = body;

    // Conexión real iría aquí. Para Postgres:
    // SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    // SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'
    // Mock para autocompletado:
    const mockSchema = {
      tables: [
        { name: 'personal_mensualero', columns: ['id', 'nombre', 'salario', 'fecha_ingreso'] },
        { name: 'personal_operativo', columns: ['id', 'nombre', 'turno', 'tarifa_hora'] },
        { name: 'ventas_historicas', columns: ['id', 'monto', 'fecha', 'cliente_id'] },
        { name: 'clientes', columns: ['id', 'razon_social', 'ruc'] },
      ],
    };

    if (dbType && dbType !== 'postgres' && dbType !== 'mysql') {
      return NextResponse.json(
        { success: false, error: 'Tipo de base de datos no soportado para esquema' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: mockSchema });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener esquema';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
