const express = require('express');
const router = express.Router();
const multer = require('multer');
const Papa = require('papaparse');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'solvex-secret-dev-key';

// Multer: store file in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
            return cb(new Error('Solo se aceptan archivos CSV o Excel.'));
        }
        cb(null, true);
    }
});

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

/**
 * POST /api/upload-csv
 * Body (FormData): 
 *   - file: CSV file
 *   - companySlug: string (e.g. "solvex")
 *   - type: "commercial" | "operation" | "quality"
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se recibió ningún archivo.' });
    }

    const { companySlug, type } = req.body;

    if (!companySlug || !type) {
        return res.status(400).json({ success: false, message: 'Se requieren companySlug y type.' });
    }

    if (!['commercial', 'operation', 'quality'].includes(type)) {
        return res.status(400).json({ success: false, message: 'El type debe ser: commercial, operation, o quality.' });
    }

    try {
        // Find company
        const company = await prisma.company.findUnique({ where: { slug: companySlug } });
        if (!company) {
            return res.status(404).json({ success: false, message: `Empresa '${companySlug}' no encontrada.` });
        }

        // Parse CSV content from buffer
        const csvText = req.file.buffer.toString('utf-8');
        const { data, errors } = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        if (errors.length > 0) {
            console.warn('CSV parse warnings:', errors);
        }

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'El archivo CSV está vacío o no pudo ser leído.' });
        }

        let insertedCount = 0;
        const now = new Date();

        // Map CSV rows to the correct KPI model
        if (type === 'commercial') {
            const records = data.map(row => ({
                companyId: company.id,
                period: String(row.period || row.periodo || ''),
                potenciales: Number(row.potenciales || 0),
                presupuestos: Number(row.presupuestos || 0),
                monto: Number(row.monto || 0),
                cumplimiento: Number(row.cumplimiento || 0),
                uploadedAt: now
            })).filter(r => r.period);

            await prisma.commercialKPI.createMany({ data: records, skipDuplicates: false });
            insertedCount = records.length;

        } else if (type === 'operation') {
            const records = data.map(row => ({
                companyId: company.id,
                period: String(row.period || row.periodo || ''),
                tiempoEfectivo: Number(row.tiempoEfectivo || row.tiempo_efectivo || 0),
                ordenesProgramadas: Number(row.ordenesProgramadas || row.ordenes_programadas || 0),
                ordenesEjecutadas: Number(row.ordenesEjecutadas || row.ordenes_ejecutadas || 0),
                cancelaciones: Number(row.cancelaciones || 0),
                uploadedAt: now
            })).filter(r => r.period);

            await prisma.operationKPI.createMany({ data: records, skipDuplicates: false });
            insertedCount = records.length;

        } else if (type === 'quality') {
            const records = data.map(row => ({
                companyId: company.id,
                period: String(row.period || row.periodo || ''),
                nps: Number(row.nps || 0),
                cancelacionesTecnicas: Number(row.cancelacionesTecnicas || row.cancelaciones_tecnicas || 0),
                deficiencias: Number(row.deficiencias || 0),
                satisfaccion: Number(row.satisfaccion || 0),
                uploadedAt: now
            })).filter(r => r.period);

            await prisma.qualityKPI.createMany({ data: records, skipDuplicates: false });
            insertedCount = records.length;
        }

        res.json({
            success: true,
            message: `Datos de ${company.name} actualizados correctamente. ${insertedCount} registros importados.`,
            company: company.name,
            type,
            insertedCount
        });

    } catch (error) {
        console.error('CSV upload error:', error);
        res.status(500).json({ success: false, message: 'Error al procesar el archivo: ' + error.message });
    }
});

// GET /api/upload-csv/template/:type - download a CSV template
router.get('/template/:type', authMiddleware, (req, res) => {
    const { type } = req.params;
    const templates = {
        commercial: 'period,potenciales,presupuestos,monto,cumplimiento\n2025-01,85,72,450000,84.7\n2025-02,90,80,520000,88.9',
        operation: 'period,tiempoEfectivo,ordenesProgramadas,ordenesEjecutadas,cancelaciones\n2025-01,92.5,120,115,5\n2025-02,88.3,130,118,12',
        quality: 'period,nps,cancelacionesTecnicas,deficiencias,satisfaccion\n2025-01,72,8,3,91.2\n2025-02,68,10,5,87.5'
    };

    if (!templates[type]) {
        return res.status(400).json({ success: false, message: 'Tipo inválido.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${type}_template.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(templates[type]);
});

module.exports = router;
