#!/bin/bash

# Script para configurar el sistema RBAC y configuraciones dinámicas
# Uso: ./setup_rbac.sh

set -e  # Salir si hay errores

echo "🚀 Iniciando configuración del sistema RBAC..."
echo ""

# Verificar que existe la base de datos
if [ ! -f "prisma/dev.db" ]; then
    echo "❌ Error: No se encontró la base de datos prisma/dev.db"
    echo "   Por favor, ejecuta primero: npx prisma migrate dev"
    exit 1
fi

echo "📦 Aplicando migración de configuraciones y RBAC..."
sqlite3 prisma/dev.db < prisma/migrations/20260226_add_configuration_rbac/migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración aplicada exitosamente"
else
    echo "⚠️  Advertencia: La migración puede haber fallado o ya estaba aplicada"
fi

echo ""
echo "👤 Creando usuario Super Admin de prueba..."
sqlite3 prisma/dev.db <<EOF
-- Verificar si existe la empresa SOLVEX
INSERT OR IGNORE INTO Company (id, name, slug, createdAt)
VALUES ('company_solvex', 'SOLVEX', 'solvex', datetime('now'));

-- Crear usuario superadmin si no existe
INSERT OR IGNORE INTO User (id, email, password, name, role, areas, companyId, createdAt)
VALUES (
    'user_superadmin',
    'admin@solvex.com',
    '\$2a\$10\$rQZ9wXqHNL5y1lZ5pJ5oH.YqKxY0.TkZxKzQ3Yx9xY0.TkZxKzQ3Y',
    'Super Admin',
    'superadmin',
    '["comercial","operaciones","calidad"]',
    'company_solvex',
    datetime('now')
);

-- Crear usuario gerente de prueba
INSERT OR IGNORE INTO User (id, email, password, name, role, areas, companyId, createdAt)
VALUES (
    'user_gerente',
    'gerente@solvex.com',
    '\$2a\$10\$rQZ9wXqHNL5y1lZ5pJ5oH.YqKxY0.TkZxKzQ3Yx9xY0.TkZxKzQ3Y',
    'Gerente Comercial',
    'gerente',
    '["comercial"]',
    'company_solvex',
    datetime('now')
);

-- Crear usuario viewer de prueba
INSERT OR IGNORE INTO User (id, email, password, name, role, areas, companyId, createdAt)
VALUES (
    'user_viewer',
    'viewer@solvex.com',
    '\$2a\$10\$rQZ9wXqHNL5y1lZ5pJ5oH.YqKxY0.TkZxKzQ3Yx9xY0.TkZxKzQ3Y',
    'Visualizador',
    'viewer',
    '["comercial","operaciones"]',
    'company_solvex',
    datetime('now')
);
EOF

echo "✅ Usuarios de prueba creados"
echo ""
echo "📊 Verificando configuraciones..."
echo ""

# Verificar menús
echo "📋 Menús configurados:"
sqlite3 -column -header prisma/dev.db "SELECT menuKey, label, path, minRole, CASE enabled WHEN 1 THEN 'Sí' ELSE 'No' END as activo FROM MenuConfiguration ORDER BY \"order\";"

echo ""
echo "📈 KPIs configurados (primeros 10):"
sqlite3 -column -header prisma/dev.db "SELECT area, displayName, goal || ' ' || unit as meta, chartType, CASE enabled WHEN 1 THEN 'Sí' ELSE 'No' END as activo FROM KPIConfiguration ORDER BY area, \"order\" LIMIT 10;"

echo ""
echo "👥 Roles disponibles:"
sqlite3 -column -header prisma/dev.db "SELECT name, displayName, level FROM Role ORDER BY level;"

echo ""
echo "👤 Usuarios de prueba:"
sqlite3 -column -header prisma/dev.db "SELECT email, name, role, areas FROM User WHERE email LIKE '%solvex.com';"

echo ""
echo "✅ ¡Configuración completada exitosamente!"
echo ""
echo "📝 Credenciales de prueba:"
echo "   Password para todos: 'password123' (debes cambiarla por la real)"
echo ""
echo "   🔴 Super Admin:"
echo "      Email: admin@solvex.com"
echo "      Rol: superadmin"
echo "      Acceso: Total (Admin Launcher, todos los dashboards)"
echo ""
echo "   🟠 Gerente:"
echo "      Email: gerente@solvex.com"
echo "      Rol: gerente"
echo "      Acceso: Dashboard Comercial, edición de KPIs"
echo ""
echo "   🟢 Visualizador:"
echo "      Email: viewer@solvex.com"
echo "      Rol: viewer"
echo "      Acceso: Solo lectura (Comercial, Operaciones)"
echo ""
echo "🚀 Siguiente paso:"
echo "   1. Inicia el servidor backend: npm run dev"
echo "   2. Inicia el frontend: cd frontend && npm run dev"
echo "   3. Abre http://localhost:3001"
echo "   4. Inicia sesión con cualquiera de los usuarios de prueba"
echo ""
echo "📚 Para más información, consulta: GUIA_CONFIGURACION_RBAC.md"
