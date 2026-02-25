const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/sqliteClient');

const JWT_SECRET = process.env.JWT_SECRET || 'solvex-secret-dev-key';

// JWT middleware
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token requerido.' });
    }
    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Token inválido.' });
    }
}

// GET /api/kpis/companies/list — must come before :companyId
router.get('/companies/list', authMiddleware, (req, res) => {
    try {
        const companies = db.prepare('SELECT id, name, slug FROM Company').all();
        res.json({ success: true, companies });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al traer empresas.' });
    }
});

// POST /api/kpis/:companySlug/commercial — Create a single CommercialKPI entry
router.post('/:companySlug/commercial', authMiddleware, (req, res) => {
    const { companySlug } = req.params;
    const { period, potenciales, presupuestos, monto, cumplimiento } = req.body;

    if (!period) {
        return res.status(400).json({ success: false, message: 'El campo "period" es requerido.' });
    }

    try {
        const company = db.prepare('SELECT * FROM Company WHERE slug = ?').get(companySlug);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada.' });
        }

        const id = require('crypto').randomUUID();
        db.prepare(`
            INSERT INTO CommercialKPI (id, companyId, period, potenciales, presupuestos, monto, cumplimiento)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            company.id,
            String(period),
            Number(potenciales || 0),
            Number(presupuestos || 0),
            Number(monto || 0),
            Number(cumplimiento || 0),
        );

        const created = db.prepare('SELECT * FROM CommercialKPI WHERE id = ?').get(id);
        res.status(201).json({ success: true, message: 'Presupuesto creado correctamente.', data: created });
    } catch (error) {
        console.error('Create KPI error:', error);
        res.status(500).json({ success: false, message: 'Error al crear el presupuesto.' });
    }
});

// GET /api/kpis/:companyId
router.get('/:companyId', authMiddleware, (req, res) => {
    const { companyId } = req.params;
    const { period, limit, offset, startDate, endDate } = req.query;

    // Parse pagination params
    const pageLimit = Math.min(parseInt(limit) || 12, 100); // Max 100 records
    const pageOffset = parseInt(offset) || 0;

    try {
        const company = db.prepare('SELECT * FROM Company WHERE slug = ?').get(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada.' });
        }

        // Build WHERE clause with date range support
        let whereConditions = ['companyId = ?'];
        let queryArgs = [company.id];

        if (period) {
            whereConditions.push('period = ?');
            queryArgs.push(period);
        }

        if (startDate) {
            whereConditions.push('period >= ?');
            queryArgs.push(startDate);
        }

        if (endDate) {
            whereConditions.push('period <= ?');
            queryArgs.push(endDate);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        // Queries with pagination
        const commercial = db.prepare(`
            SELECT * FROM CommercialKPI 
            ${whereClause}
            ORDER BY period DESC 
            LIMIT ? OFFSET ?
        `).all(...queryArgs, pageLimit, pageOffset);

        const operations = db.prepare(`
            SELECT * FROM OperationKPI 
            ${whereClause}
            ORDER BY period DESC 
            LIMIT ? OFFSET ?
        `).all(...queryArgs, pageLimit, pageOffset);

        const quality = db.prepare(`
            SELECT * FROM QualityKPI 
            ${whereClause}
            ORDER BY period DESC 
            LIMIT ? OFFSET ?
        `).all(...queryArgs, pageLimit, pageOffset);

        // Get counts for pagination metadata
        const commCount = db.prepare(`SELECT COUNT(*) as count FROM CommercialKPI ${whereClause}`).get(...queryArgs).count;
        const opCount = db.prepare(`SELECT COUNT(*) as count FROM OperationKPI ${whereClause}`).get(...queryArgs).count;
        const qualCount = db.prepare(`SELECT COUNT(*) as count FROM QualityKPI ${whereClause}`).get(...queryArgs).count;

        const latestComm = commercial[0] || {};
        const latestOp = operations[0] || {};
        const latestQual = quality[0] || {};

        res.json({
            success: true,
            company: { id: company.id, name: company.name, slug: company.slug },
            summary: {
                potenciales: latestComm.potenciales || 0,
                presupuestos: latestComm.presupuestos || 0,
                monto: latestComm.monto || 0,
                cumplimiento: latestComm.cumplimiento || 0,
                tiempoEfectivo: latestOp.tiempoEfectivo || 0,
                ordenesProgramadas: latestOp.ordenesProgramadas || 0,
                cancelaciones: latestOp.cancelaciones || 0,
                nps: latestQual.nps || 0,
                satisfaccion: latestQual.satisfaccion || 0,
            },
            series: { commercial, operations, quality },
            pagination: {
                limit: pageLimit,
                offset: pageOffset,
                total: {
                    commercial: commCount,
                    operations: opCount,
                    quality: qualCount
                },
                hasMore: {
                    commercial: commCount > pageOffset + pageLimit,
                    operations: opCount > pageOffset + pageLimit,
                    quality: qualCount > pageOffset + pageLimit
                }
            }
        });
    } catch (error) {
        console.error('KPI fetch error:', error);
        res.status(500).json({ success: false, message: 'Error al traer KPIs.' });
    }
});

module.exports = router;
