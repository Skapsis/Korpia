const express = require('express');
const router = express.Router();
const db = require('../database/sqliteClient');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ==================== App Configuration ====================

// GET /api/configuration - Get global or company-specific configuration
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { name, companyId } = req.query;
        let query = 'SELECT * FROM AppConfiguration WHERE active = 1';
        const params = [];

        if (name) {
            query += ' AND name = ?';
            params.push(name);
        } else if (companyId) {
            query += ' AND companyId = ?';
            params.push(companyId);
        } else {
            query += ' AND name = ?';
            params.push('global');
        }

        const config = db.prepare(query).get(...params);
        
        if (!config) {
            return res.json({
                success: true,
                config: {
                    id: 'default',
                    name: name || 'global',
                    config: JSON.stringify(getDefaultConfiguration()),
                    active: true
                }
            });
        }

        res.json({ success: true, config });
    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).json({ success: false, message: 'Error al obtener configuración.' });
    }
});

// PUT /api/configuration - Update configuration (Admin only)
router.put('/', authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
        const { name, config, companyId } = req.body;

        if (!name || !config) {
            return res.status(400).json({ success: false, message: 'Name y config son requeridos.' });
        }

        const existing = db.prepare('SELECT * FROM AppConfiguration WHERE name = ?').get(name);

        if (existing) {
            const stmt = db.prepare(`
                UPDATE AppConfiguration 
                SET config = ?, updatedAt = datetime('now'), companyId = ?
                WHERE name = ?
            `);
            stmt.run(typeof config === 'string' ? config : JSON.stringify(config), companyId || null, name);
        } else {
            const stmt = db.prepare(`
                INSERT INTO AppConfiguration (id, name, config, companyId, active, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
            `);
            const id = `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            stmt.run(id, name, typeof config === 'string' ? config : JSON.stringify(config), companyId || null);
        }

        res.json({ success: true, message: 'Configuración actualizada exitosamente.' });
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar configuración.' });
    }
});

// ==================== Menu Configuration ====================

// GET /api/configuration/menus - Get all menu configurations
router.get('/menus', authenticateToken, async (req, res) => {
    try {
        const menus = db.prepare(`
            SELECT * FROM MenuConfiguration 
            WHERE enabled = 1 
            ORDER BY "order" ASC
        `).all();

        // Filter by user role
        const userRole = req.user.role || 'viewer';
        const roleLevel = getRoleLevel(userRole);

        const filteredMenus = menus.filter(menu => {
            const minRoleLevel = getRoleLevel(menu.minRole);
            return roleLevel >= minRoleLevel;
        });

        res.json({ success: true, menus: filteredMenus });
    } catch (error) {
        console.error('Error fetching menus:', error);
        res.status(500).json({ success: false, message: 'Error al obtener menús.' });
    }
});

// PUT /api/configuration/menus/:id - Update menu configuration (Admin only)
router.put('/menus/:id', authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { label, enabled, order, minRole, icon } = req.body;

        const stmt = db.prepare(`
            UPDATE MenuConfiguration 
            SET label = COALESCE(?, label),
                enabled = COALESCE(?, enabled),
                "order" = COALESCE(?, "order"),
                minRole = COALESCE(?, minRole),
                icon = COALESCE(?, icon),
                updatedAt = datetime('now')
            WHERE id = ?
        `);

        stmt.run(label, enabled, order, minRole, icon, id);

        res.json({ success: true, message: 'Menú actualizado exitosamente.' });
    } catch (error) {
        console.error('Error updating menu:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar menú.' });
    }
});

// POST /api/configuration/menus - Create new menu (Admin only)
router.post('/menus', authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
        const { menuKey, label, path, icon, order, minRole } = req.body;

        if (!menuKey || !label || !path) {
            return res.status(400).json({ 
                success: false, 
                message: 'menuKey, label y path son requeridos.' 
            });
        }

        const id = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const stmt = db.prepare(`
            INSERT INTO MenuConfiguration (id, menuKey, label, path, icon, "order", minRole, enabled, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `);

        stmt.run(id, menuKey, label, path, icon || '📊', order || 0, minRole || 'viewer');

        res.json({ success: true, message: 'Menú creado exitosamente.', id });
    } catch (error) {
        console.error('Error creating menu:', error);
        res.status(500).json({ success: false, message: 'Error al crear menú.' });
    }
});

// ==================== KPI Configuration ====================

// GET /api/configuration/kpis - Get KPI configurations
router.get('/kpis', authenticateToken, async (req, res) => {
    try {
        const { area } = req.query;
        let query = 'SELECT * FROM KPIConfiguration WHERE enabled = 1';
        const params = [];

        if (area) {
            query += ' AND area = ?';
            params.push(area);
        }

        query += ' ORDER BY "order" ASC';

        const kpis = db.prepare(query).all(...params);

        res.json({ success: true, kpis });
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ success: false, message: 'Error al obtener KPIs.' });
    }
});

// PUT /api/configuration/kpis/:id - Update KPI configuration (Admin only)
router.put('/kpis/:id', authenticateToken, requireRole(['superadmin', 'gerente']), async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, goal, unit, chartType, color, enabled, order } = req.body;

        const stmt = db.prepare(`
            UPDATE KPIConfiguration 
            SET displayName = COALESCE(?, displayName),
                goal = COALESCE(?, goal),
                unit = COALESCE(?, unit),
                chartType = COALESCE(?, chartType),
                color = COALESCE(?, color),
                enabled = COALESCE(?, enabled),
                "order" = COALESCE(?, "order"),
                updatedAt = datetime('now')
            WHERE id = ?
        `);

        stmt.run(displayName, goal, unit, chartType, color, enabled, order, id);

        res.json({ success: true, message: 'KPI actualizado exitosamente.' });
    } catch (error) {
        console.error('Error updating KPI:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar KPI.' });
    }
});

// POST /api/configuration/kpis - Create new KPI configuration (Admin only)
router.post('/kpis', authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
        const { area, kpiKey, displayName, goal, unit, chartType, color, order } = req.body;

        if (!area || !kpiKey || !displayName) {
            return res.status(400).json({ 
                success: false, 
                message: 'area, kpiKey y displayName son requeridos.' 
            });
        }

        const id = `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const stmt = db.prepare(`
            INSERT INTO KPIConfiguration 
            (id, area, kpiKey, displayName, goal, unit, chartType, color, "order", enabled, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `);

        stmt.run(
            id, 
            area, 
            kpiKey, 
            displayName, 
            goal || null, 
            unit || '', 
            chartType || 'bar', 
            color || '#3b82f6', 
            order || 0
        );

        res.json({ success: true, message: 'KPI creado exitosamente.', id });
    } catch (error) {
        console.error('Error creating KPI:', error);
        res.status(500).json({ success: false, message: 'Error al crear KPI.' });
    }
});

// ==================== Helper Functions ====================

function getRoleLevel(role) {
    const levels = {
        'viewer': 0,
        'gerente': 1,
        'superadmin': 2,
        'admin': 2
    };
    return levels[role] || 0;
}

function getDefaultConfiguration() {
    return {
        menus: [
            { key: 'dashboard', label: 'Dashboard General', path: '/dashboard', enabled: true },
            { key: 'comercial', label: 'Comercial', path: '/dashboard/comercial', enabled: true },
            { key: 'operaciones', label: 'Operaciones', path: '/dashboard/operaciones', enabled: true },
            { key: 'calidad', label: 'Calidad Técnica', path: '/dashboard/calidad', enabled: true }
        ],
        kpis: {
            comercial: [
                { key: 'potenciales', label: 'Potenciales', goal: 100, unit: '#' },
                { key: 'presupuestos', label: 'Presupuestos', goal: 50, unit: '#' },
                { key: 'monto', label: 'Monto', goal: 1000000, unit: '$' }
            ]
        }
    };
}

module.exports = router;
