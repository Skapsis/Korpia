const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/sqliteClient');

const JWT_SECRET = process.env.JWT_SECRET || 'solvex-secret-dev-key';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
    }

    try {
        const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const company = db.prepare('SELECT * FROM Company WHERE id = ?').get(user.companyId);

        // Parse areas from JSON string
        let areas = [];
        try {
            areas = JSON.parse(user.areas || '[]');
        } catch (e) {
            console.error('Error parsing user areas:', e);
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role, 
                companyId: user.companyId,
                areas 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                areas 
            },
            company: company ? { id: company.id, name: company.name, slug: company.slug } : null,
            permissions: {
                canAccessAdmin: user.role === 'superadmin',
                canManageKPIs: user.role === 'superadmin' || user.role === 'gerente',
                areas
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token requerido.' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, email, name, role, companyId, areas FROM User WHERE id = ?').get(payload.userId);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        const company = db.prepare('SELECT id, name, slug FROM Company WHERE id = ?').get(user.companyId);
        
        // Parse areas
        let areas = [];
        try {
            areas = JSON.parse(user.areas || '[]');
        } catch (e) {
            console.error('Error parsing user areas:', e);
        }

        res.json({ 
            success: true, 
            user: { ...user, areas },
            company,
            permissions: {
                canAccessAdmin: user.role === 'superadmin',
                canManageKPIs: user.role === 'superadmin' || user.role === 'gerente',
                areas
            }
        });
    } catch {
        res.status(401).json({ success: false, message: 'Token inválido.' });
    }
});

module.exports = router;
