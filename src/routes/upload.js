const express = require('express');
const router = express.Router();
const multer = require('multer');
const Papa = require('papaparse');
const jwt = require('jsonwebtoken');
const prisma = require('../database/prismaClient');

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
        const validationErrors = [];
        const now = new Date();

        /**
         * Validation helpers
         */
        const validatePeriod = (period) => {
            if (!period || typeof period !== 'string') return false;
            // Accept formats: 2025-01, 2025-Q1, 2025-W01
            return /^\d{4}-(0[1-9]|1[0-2]|Q[1-4]|W\d{2})$/.test(period);
        };

        const validateNumber = (value, min = 0, max = Infinity) => {
            const num = Number(value);
            return !isNaN(num) && num >= min && num <= max;
        };

        const validatePercentage = (value) => validateNumber(value, 0, 100);

        // Map CSV rows to the correct KPI model with validation
        if (type === 'commercial') {
            const records = [];
            data.forEach((row, index) => {
                const period = String(row.period || row.periodo || '').trim();
                
                // Validate period
                if (!validatePeriod(period)) {
                    validationErrors.push(`Fila ${index + 1}: Período inválido "${period}". Use formato YYYY-MM o YYYY-Q#.`);
                    return;
                }

                // Validate numeric fields
                const potenciales = Number(row.potenciales || 0);
                const presupuestos = Number(row.presupuestos || 0);
                const monto = Number(row.monto || 0);
                const cumplimiento = Number(row.cumplimiento || 0);

                if (!validateNumber(potenciales, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Potenciales debe ser un número positivo.`);
                    return;
                }
                if (!validateNumber(presupuestos, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Presupuestos debe ser un número positivo.`);
                    return;
                }
                if (!validateNumber(monto, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Monto debe ser un número positivo.`);
                    return;
                }
                if (!validatePercentage(cumplimiento)) {
                    validationErrors.push(`Fila ${index + 1}: Cumplimiento debe ser un porcentaje entre 0 y 100.`);
                    return;
                }

                records.push({
                    companyId: company.id,
                    period,
                    potenciales,
                    presupuestos,
                    monto,
                    cumplimiento,
                    uploadedAt: now
                });
            });

            if (validationErrors.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Errores de validación en el archivo CSV.',
                    errors: validationErrors.slice(0, 10) // Show first 10 errors
                });
            }

            if (records.length === 0) {
                return res.status(400).json({ success: false, message: 'No se encontraron registros válidos en el archivo.' });
            }

            await prisma.commercialKPI.createMany({ data: records, skipDuplicates: true });
            insertedCount = records.length;

        } else if (type === 'operation') {
            const records = [];
            data.forEach((row, index) => {
                const period = String(row.period || row.periodo || '').trim();
                
                if (!validatePeriod(period)) {
                    validationErrors.push(`Fila ${index + 1}: Período inválido "${period}".`);
                    return;
                }

                const tiempoEfectivo = Number(row.tiempoEfectivo || row.tiempo_efectivo || 0);
                const ordenesProgramadas = Number(row.ordenesProgramadas || row.ordenes_programadas || 0);
                const ordenesEjecutadas = Number(row.ordenesEjecutadas || row.ordenes_ejecutadas || 0);
                const cancelaciones = Number(row.cancelaciones || 0);

                if (!validatePercentage(tiempoEfectivo)) {
                    validationErrors.push(`Fila ${index + 1}: Tiempo efectivo debe estar entre 0 y 100.`);
                    return;
                }
                if (!validateNumber(ordenesProgramadas, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Órdenes programadas debe ser un número positivo.`);
                    return;
                }
                if (!validateNumber(ordenesEjecutadas, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Órdenes ejecutadas debe ser un número positivo.`);
                    return;
                }
                if (!validateNumber(cancelaciones, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Cancelaciones debe ser un número positivo.`);
                    return;
                }

                records.push({
                    companyId: company.id,
                    period,
                    tiempoEfectivo,
                    ordenesProgramadas,
                    ordenesEjecutadas,
                    cancelaciones,
                    uploadedAt: now
                });
            });

            if (validationErrors.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Errores de validación en el archivo CSV.',
                    errors: validationErrors.slice(0, 10)
                });
            }

            if (records.length === 0) {
                return res.status(400).json({ success: false, message: 'No se encontraron registros válidos en el archivo.' });
            }

            await prisma.operationKPI.createMany({ data: records, skipDuplicates: true });
            insertedCount = records.length;

        } else if (type === 'quality') {
            const records = [];
            data.forEach((row, index) => {
                const period = String(row.period || row.periodo || '').trim();
                
                if (!validatePeriod(period)) {
                    validationErrors.push(`Fila ${index + 1}: Período inválido "${period}".`);
                    return;
                }

                const nps = Number(row.nps || 0);
                const cancelacionesTecnicas = Number(row.cancelacionesTecnicas || row.cancelaciones_tecnicas || 0);
                const deficiencias = Number(row.deficiencias || 0);
                const satisfaccion = Number(row.satisfaccion || 0);

                if (!validateNumber(nps, -100, 100)) {
                    validationErrors.push(`Fila ${index + 1}: NPS debe estar entre -100 y 100.`);
                    return;
                }
                if (!validateNumber(cancelacionesTecnicas, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Cancelaciones técnicas debe ser un número positivo.`);
                    return;
                }
                if (!validateNumber(deficiencias, 0)) {
                    validationErrors.push(`Fila ${index + 1}: Deficiencias debe ser un número positivo.`);
                    return;
                }
                if (!validatePercentage(satisfaccion)) {
                    validationErrors.push(`Fila ${index + 1}: Satisfacción debe estar entre 0 y 100.`);
                    return;
                }

                records.push({
                    companyId: company.id,
                    period,
                    nps,
                    cancelacionesTecnicas,
                    deficiencias,
                    satisfaccion,
                    uploadedAt: now
                });
            });

            if (validationErrors.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Errores de validación en el archivo CSV.',
                    errors: validationErrors.slice(0, 10)
                });
            }

            if (records.length === 0) {
                return res.status(400).json({ success: false, message: 'No se encontraron registros válidos en el archivo.' });
            }

            await prisma.qualityKPI.createMany({ data: records, skipDuplicates: true });
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
