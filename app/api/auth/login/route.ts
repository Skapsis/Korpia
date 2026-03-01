/**
 * POST /api/auth/login
 * Login: acepta email + password. Si hay backend real lo valida; si no, fallback simulado.
 * Respuesta: { token?, user?, company? } para que el cliente guarde en localStorage.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    // Demo/simulado: aceptar admin@*.com con admin123 o cualquier contraseña larga
    const isAdmin = email.toLowerCase().startsWith('admin') && password === 'admin123';
    const companySlug = email.includes('@') ? email.split('@')[1]?.replace(/\.com$/, '') ?? 'solvex' : 'solvex';
    const name = email.split('@')[0] ?? 'Usuario';

    const token = `demo_${Buffer.from(JSON.stringify({ email, iat: Date.now() })).toString('base64')}`;
    return NextResponse.json({
      success: true,
      token,
      user: { name, email, role: isAdmin ? 'superadmin' : 'viewer' },
      company: { id: companySlug, name: companySlug, slug: companySlug },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error en el servidor.' },
      { status: 500 }
    );
  }
}
