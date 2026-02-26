-- Agregar columna areas a User
ALTER TABLE User ADD COLUMN areas TEXT DEFAULT '[]';

-- Crear tabla AppConfiguration
CREATE TABLE AppConfiguration (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    config TEXT DEFAULT '{}',
    active INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    companyId TEXT,
    FOREIGN KEY (companyId) REFERENCES Company(id)
);

-- Crear tabla MenuConfiguration
CREATE TABLE MenuConfiguration (
    id TEXT PRIMARY KEY,
    menuKey TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    icon TEXT DEFAULT '📊',
    enabled INTEGER DEFAULT 1,
    "order" INTEGER DEFAULT 0,
    minRole TEXT DEFAULT 'viewer',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla KPIConfiguration
CREATE TABLE KPIConfiguration (
    id TEXT PRIMARY KEY,
    area TEXT NOT NULL,
    kpiKey TEXT NOT NULL,
    displayName TEXT NOT NULL,
    goal REAL,
    unit TEXT DEFAULT '',
    chartType TEXT DEFAULT 'bar',
    color TEXT DEFAULT '#3b82f6',
    enabled INTEGER DEFAULT 1,
    "order" INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(area, kpiKey)
);

-- Crear índice para KPIConfiguration
CREATE INDEX idx_kpi_area_enabled ON KPIConfiguration(area, enabled);

-- Crear tabla Role
CREATE TABLE Role (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    permissions TEXT DEFAULT '[]',
    level INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar menús por defecto
INSERT INTO MenuConfiguration (id, menuKey, label, path, icon, "order", minRole, enabled, createdAt, updatedAt)
VALUES 
    ('menu_1', 'dashboard', 'Dashboard General', '/dashboard', '📊', 0, 'viewer', 1, datetime('now'), datetime('now')),
    ('menu_2', 'comercial', 'Comercial', '/dashboard/comercial', '💰', 1, 'viewer', 1, datetime('now'), datetime('now')),
    ('menu_3', 'operaciones', 'Operaciones', '/dashboard/operaciones', '⚙️', 2, 'viewer', 1, datetime('now'), datetime('now')),
    ('menu_4', 'calidad', 'Calidad Técnica', '/dashboard/calidad', '🛠️', 3, 'viewer', 1, datetime('now'), datetime('now')),
    ('menu_5', 'upload', 'Carga de Datos', '/dashboard/upload', '📤', 4, 'gerente', 1, datetime('now'), datetime('now'));

-- Insertar configuraciones de KPIs por defecto para Comercial
INSERT INTO KPIConfiguration (id, area, kpiKey, displayName, goal, unit, chartType, color, "order", enabled, createdAt, updatedAt)
VALUES 
    ('kpi_com_1', 'comercial', 'potenciales', 'Clientes Potenciales', 100, '#', 'bar', '#3b82f6', 0, 1, datetime('now'), datetime('now')),
    ('kpi_com_2', 'comercial', 'presupuestos', 'Presupuestos Enviados', 50, '#', 'bar', '#10b981', 1, 1, datetime('now'), datetime('now')),
    ('kpi_com_3', 'comercial', 'monto', 'Monto Total', 1000000, '$', 'bar', '#f59e0b', 2, 1, datetime('now'), datetime('now')),
    ('kpi_com_4', 'comercial', 'cumplimiento', 'Cumplimiento', 85, '%', 'gauge', '#8b5cf6', 3, 1, datetime('now'), datetime('now'));

-- Insertar configuraciones de KPIs por defecto para Operaciones
INSERT INTO KPIConfiguration (id, area, kpiKey, displayName, goal, unit, chartType, color, "order", enabled, createdAt, updatedAt)
VALUES 
    ('kpi_op_1', 'operaciones', 'tiempoEfectivo', 'Tiempo Efectivo', 85, '%', 'gauge', '#3b82f6', 0, 1, datetime('now'), datetime('now')),
    ('kpi_op_2', 'operaciones', 'ordenesProgramadas', 'Órdenes Programadas', 200, '#', 'bar', '#10b981', 1, 1, datetime('now'), datetime('now')),
    ('kpi_op_3', 'operaciones', 'ordenesEjecutadas', 'Órdenes Ejecutadas', 180, '#', 'bar', '#f59e0b', 2, 1, datetime('now'), datetime('now')),
    ('kpi_op_4', 'operaciones', 'cancelaciones', 'Cancelaciones', 10, '#', 'bar', '#ef4444', 3, 1, datetime('now'), datetime('now'));

-- Insertar configuraciones de KPIs por defecto para Calidad
INSERT INTO KPIConfiguration (id, area, kpiKey, displayName, goal, unit, chartType, color, "order", enabled, createdAt, updatedAt)
VALUES 
    ('kpi_cal_1', 'calidad', 'nps', 'Net Promoter Score', 8, '', 'gauge', '#3b82f6', 0, 1, datetime('now'), datetime('now')),
    ('kpi_cal_2', 'calidad', 'cancelacionesTecnicas', 'Cancelaciones Técnicas', 5, '#', 'bar', '#ef4444', 1, 1, datetime('now'), datetime('now')),
    ('kpi_cal_3', 'calidad', 'deficiencias', 'Deficiencias', 8, '#', 'bar', '#f59e0b', 2, 1, datetime('now'), datetime('now')),
    ('kpi_cal_4', 'calidad', 'satisfaccion', 'Satisfacción Cliente', 90, '%', 'gauge', '#10b981', 3, 1, datetime('now'), datetime('now'));

-- Insertar roles por defecto
INSERT INTO Role (id, name, displayName, permissions, level, createdAt, updatedAt)
VALUES 
    ('role_1', 'viewer', 'Visualizador', '["view_dashboards"]', 0, datetime('now'), datetime('now')),
    ('role_2', 'gerente', 'Gerente de Área', '["view_dashboards", "manage_area_kpis", "upload_data"]', 1, datetime('now'), datetime('now')),
    ('role_3', 'superadmin', 'Super Administrador', '["view_dashboards", "manage_all_kpis", "manage_users", "manage_configuration", "upload_data"]', 2, datetime('now'), datetime('now'));

-- Insertar configuración global por defecto
INSERT INTO AppConfiguration (id, name, config, active, createdAt, updatedAt)
VALUES ('cfg_global', 'global', '{"theme":"light","defaultLanguage":"es","refreshInterval":60000}', 1, datetime('now'), datetime('now'));
