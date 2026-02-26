/**
 * GET /api/dashboard/:empresa
 *
 * Fuente única de verdad: src/data/kpi_definitions.json
 * (el mismo archivo que escribe /api/kpi-definitions).
 * Los cambios del Admin Panel se reflejan instantáneamente aquí.
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const DATA_FILE = path.join(__dirname, '../data/kpi_definitions.json');

function readDefs() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return [];
    }
}

/**
 * Transforma un array plano de KPIDefinition en Record<string, KPIItem>
 * que el frontend espera: { titulo, meta_total, logrado_total, unidad, semanas }
 */
function toKPIRecord(defs, area) {
    const filtered = defs.filter((d) => d.area === area);
    const record   = {};

    filtered.forEach((d) => {
        // Derivar key a partir del id (quitar prefijo empresa-)
        const parts = d.id.split('-');
        const key   = parts.length > 1 ? parts.slice(1).join('_') : d.id;

        record[key] = {
            titulo:        d.titulo,
            meta_total:    Number(d.meta_total    ?? 0),
            logrado_total: Number(d.logrado_total ?? 0),
            unidad:        d.unidad,
            semanas:       Array.isArray(d.semanas) ? d.semanas : [],
        };
    });

    return record;
}

// ── GET /api/dashboard/:empresa ───────────────────────────────────────────────
router.get('/:empresa', (req, res) => {
    try {
        const empresaRaw = decodeURIComponent(req.params.empresa).trim();
        const empresaKey = empresaRaw.toUpperCase();

        const allDefs = readDefs();

        // Filtrar por empresa (case-insensitive)
        let defs = allDefs.filter(
            (d) => d.empresa && d.empresa.trim().toUpperCase() === empresaKey
        );

        // Fallback a SOLVEX si no hay definiciones para la empresa solicitada
        const usedEmpresa = defs.length > 0 ? empresaRaw : 'SOLVEX';
        if (defs.length === 0) {
            defs = allDefs.filter(
                (d) => d.empresa && d.empresa.trim().toUpperCase() === 'SOLVEX'
            );
        }

        const data = {
            comercial:   toKPIRecord(defs, 'comercial'),
            operaciones: toKPIRecord(defs, 'operaciones'),
            calidad:     toKPIRecord(defs, 'calidad'),
        };

        res.json({
            success:  true,
            empresa:  usedEmpresa,
            fallback: usedEmpresa !== empresaRaw,
            data,
        });
    } catch (error) {
        console.error('GET /api/dashboard/:empresa error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el dashboard.' });
    }
});

module.exports = router;
