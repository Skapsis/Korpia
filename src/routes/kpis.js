const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'solvex-secret-dev-key';

// Middleware to verify JWT
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

// GET /api/kpis/:companyId
router.get('/:companyId', authMiddleware, async (req, res) => {
    const { companyId } = req.params;
    const { period } = req.query;

    try {
        const company = await prisma.company.findUnique({ where: { slug: companyId } });

        if (!company) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada.' });
        }

        const periodFilter = period ? { period } : {};

        const [commercial, operations, quality] = await Promise.all([
            prisma.commercialKPI.findMany({
                where: { companyId: company.id, ...periodFilter },
                orderBy: { period: 'desc' },
                take: 12
            }),
            prisma.operationKPI.findMany({
                where: { companyId: company.id, ...periodFilter },
                orderBy: { period: 'desc' },
                take: 12
            }),
            prisma.qualityKPI.findMany({
                where: { companyId: company.id, ...periodFilter },
                orderBy: { period: 'desc' },
                take: 12
            })
        ]);

        // Calculate summary stats from latest period
        const latestCommercial = commercial[0] || {};
        const latestOperation = operations[0] || {};
        const latestQuality = quality[0] || {};

        res.json({
            success: true,
            company: { id: company.id, name: company.name, slug: company.slug },
            summary: {
                potenciales: latestCommercial.potenciales || 0,
                presupuestos: latestCommercial.presupuestos || 0,
                monto: latestCommercial.monto || 0,
                cumplimiento: latestCommercial.cumplimiento || 0,
                tiempoEfectivo: latestOperation.tiempoEfectivo || 0,
                ordenesProgramadas: latestOperation.ordenesProgramadas || 0,
                cancelaciones: latestOperation.cancelaciones || 0,
                nps: latestQuality.nps || 0,
                satisfaccion: latestQuality.satisfaccion || 0,
            },
            series: { commercial, operations, quality }
        });
    } catch (error) {
        console.error('KPI fetch error:', error);
        res.status(500).json({ success: false, message: 'Error al traer KPIs.' });
    }
});

// GET /api/kpis/companies/list
router.get('/companies/list', authMiddleware, async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            select: { id: true, name: true, slug: true }
        });
        res.json({ success: true, companies });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al traer empresas.' });
    }
});

module.exports = router;
