const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Basic Login Endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    db.get("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (row) {
            // Update last login
            db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [row.id]);

            // In a real app we'd return a JWT token here.
            res.json({
                success: true,
                user: {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    role: row.role
                },
                token: 'mock-jwt-token-val-' + row.id
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

module.exports = router;
