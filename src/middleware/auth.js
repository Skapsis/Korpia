const jwt = require('jsonwebtoken');
const db = require('../database/sqliteClient');

const JWT_SECRET = process.env.JWT_SECRET || 'solvex-secret-dev-key';

/**
 * Middleware para autenticar token JWT
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de autenticación requerido.' 
        });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, JWT_SECRET);
        
        // Verificar que el usuario existe
        const user = db.prepare(
            'SELECT id, email, name, role, companyId, areas FROM User WHERE id = ?'
        ).get(payload.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }

        // Adjuntar información del usuario a la request
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
            areas: parseJSON(user.areas, [])
        };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Token inválido o expirado.' 
        });
    }
}

/**
 * Middleware para requerir roles específicos
 * @param {string[]} allowedRoles - Array de roles permitidos
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado.' 
            });
        }

        const userRole = req.user.role;
        
        // SuperAdmin siempre tiene acceso
        if (userRole === 'superadmin') {
            return next();
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
}

/**
 * Middleware para verificar acceso a un área específica
 * @param {string} area - Área requerida (comercial, operaciones, calidad)
 */
function requireArea(area) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado.' 
            });
        }

        // SuperAdmin siempre tiene acceso
        if (req.user.role === 'superadmin') {
            return next();
        }

        const userAreas = req.user.areas || [];
        
        if (!userAreas.includes(area)) {
            return res.status(403).json({ 
                success: false, 
                message: `No tienes acceso al área de ${area}.` 
            });
        }

        next();
    };
}

/**
 * Middleware para verificar que el usuario solo accede a datos de su empresa
 */
function requireSameCompany(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Usuario no autenticado.' 
        });
    }

    // SuperAdmin puede acceder a todas las empresas
    if (req.user.role === 'superadmin') {
        return next();
    }

    const requestedCompanyId = req.params.companyId || req.query.companyId || req.body.companyId;
    
    if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
        return res.status(403).json({ 
            success: false, 
            message: 'No tienes acceso a los datos de esta empresa.' 
        });
    }

    next();
}

/**
 * Helper para obtener nivel de rol
 */
function getRoleLevel(role) {
    const levels = {
        'viewer': 0,
        'gerente': 1,
        'superadmin': 2,
        'admin': 2
    };
    return levels[role] || 0;
}

/**
 * Helper para parsear JSON de forma segura
 */
function parseJSON(str, defaultValue = null) {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
}

module.exports = {
    authenticateToken,
    requireRole,
    requireArea,
    requireSameCompany,
    getRoleLevel
};
