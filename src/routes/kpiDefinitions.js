/**
 * /api/kpi-definitions
 * CRUD para las definiciones de KPIs. Los datos se persisten en un JSON local.
 * Solo los administradores pueden crear, editar y eliminar definiciones.
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const router   = express.Router();
const DATA_FILE = path.join(__dirname, '../data/kpi_definitions.json');

// ── helpers ───────────────────────────────────────────────────────────────────
function readDefs() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function writeDefs(defs) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defs, null, 2), 'utf8');
}

// Admin header simple — el frontend envía x-user-role: admin para operaciones sensibles
function requireAdmin(req, res, next) {
    const role = req.headers['x-user-role'];
    if (role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso solo para administradores.' });
    }
    next();
}

// ── GET /api/kpi-definitions?empresa=SOLVEX ───────────────────────────────────
// Devuelve todas las definiciones (opcional: filtrar por empresa)
router.get('/', (req, res) => {
    try {
        const { empresa } = req.query;
        let defs = readDefs();
        if (empresa) {
            defs = defs.filter(d => d.empresa === empresa);
        }
        res.json({ success: true, data: defs });
    } catch (error) {
        console.error('GET kpi-definitions:', error);
        res.status(500).json({ success: false, message: 'Error al obtener definiciones.' });
    }
});

// ── GET /api/kpi-definitions/:id ──────────────────────────────────────────────
router.get('/:id', (req, res) => {
    try {
        const defs = readDefs();
        const def  = defs.find(d => d.id === req.params.id);
        if (!def) return res.status(404).json({ success: false, message: 'KPI no encontrado.' });
        res.json({ success: true, data: def });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el KPI.' });
    }
});

// ── POST /api/kpi-definitions ─────────────────────────────────────────────────
router.post('/', requireAdmin, (req, res) => {
    try {
        const { empresa, area, titulo, meta_total, logrado_total, unidad, semanas } = req.body;

        if (!empresa || !area || !titulo || !unidad) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: empresa, area, titulo, unidad.'
            });
        }

        const newDef = {
            id:            crypto.randomUUID(),
            empresa:       String(empresa),
            area:          String(area),
            titulo:        String(titulo),
            meta_total:    Number(meta_total   ?? 0),
            logrado_total: Number(logrado_total ?? 0),
            unidad:        String(unidad),
            semanas:       Array.isArray(semanas) ? semanas : [
                { name: 'Week 1', logrado: 0, meta: Number(meta_total ?? 0) },
                { name: 'Week 2', logrado: 0, meta: Number(meta_total ?? 0) },
                { name: 'Week 3', logrado: 0, meta: Number(meta_total ?? 0) },
                { name: 'Week 4', logrado: 0, meta: Number(meta_total ?? 0) },
                { name: 'Week 5', logrado: 0, meta: Number(meta_total ?? 0) },
            ],
        };

        const defs = readDefs();
        defs.push(newDef);
        writeDefs(defs);

        res.status(201).json({ success: true, message: 'KPI creado correctamente.', data: newDef });
    } catch (error) {
        console.error('POST kpi-definitions:', error);
        res.status(500).json({ success: false, message: 'Error al crear el KPI.' });
    }
});

// ── PUT /api/kpi-definitions/:id ──────────────────────────────────────────────
router.put('/:id', requireAdmin, (req, res) => {
    try {
        const defs  = readDefs();
        const index = defs.findIndex(d => d.id === req.params.id);
        if (index === -1) return res.status(404).json({ success: false, message: 'KPI no encontrado.' });

        const { empresa, area, titulo, meta_total, logrado_total, unidad, semanas } = req.body;

        // Merge — sólo actualiza los campos enviados
        defs[index] = {
            ...defs[index],
            ...(empresa       !== undefined && { empresa:       String(empresa) }),
            ...(area          !== undefined && { area:          String(area) }),
            ...(titulo        !== undefined && { titulo:        String(titulo) }),
            ...(meta_total    !== undefined && { meta_total:    Number(meta_total) }),
            ...(logrado_total !== undefined && { logrado_total: Number(logrado_total) }),
            ...(unidad        !== undefined && { unidad:        String(unidad) }),
            ...(Array.isArray(semanas)       && { semanas }),
        };

        writeDefs(defs);
        res.json({ success: true, message: 'KPI actualizado correctamente.', data: defs[index] });
    } catch (error) {
        console.error('PUT kpi-definitions:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el KPI.' });
    }
});

// ── DELETE /api/kpi-definitions/:id ──────────────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
    try {
        const defs    = readDefs();
        const index   = defs.findIndex(d => d.id === req.params.id);
        if (index === -1) return res.status(404).json({ success: false, message: 'KPI no encontrado.' });

        const [removed] = defs.splice(index, 1);
        writeDefs(defs);

        res.json({ success: true, message: 'KPI eliminado correctamente.', data: removed });
    } catch (error) {
        console.error('DELETE kpi-definitions:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el KPI.' });
    }
});

module.exports = router;
