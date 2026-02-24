const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Execute SQL Query Endpoint (Metabase style)
// WARNING: This is for MVP/Internal local use only. Direct SQL execution is vulnerable to SQL injection.
router.post('/', (req, res) => {
    const { query, params = [] } = req.body;

    if (!query) {
        return res.status(400).json({ success: false, message: 'No query provided' });
    }

    // Basic logic to determine if it expects rows (SELECT) or not (INSERT, UPDATE)
    const isSelect = query.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error("Query Error:", err.message);
                return res.status(400).json({ success: false, message: err.message, query });
            }
            res.json({ success: true, data: rows });
        });
    } else {
        db.run(query, params, function (err) {
            if (err) {
                console.error("Execution Error:", err.message);
                return res.status(400).json({ success: false, message: err.message, query });
            }
            res.json({
                success: true,
                message: 'Operation successful',
                lastID: this.lastID,
                changes: this.changes
            });
        });
    }
});

// Helper endpoint to get schema/tables (useful for a dynamic dashboard)
router.get('/schema', (req, res) => {
    const query = "SELECT name FROM sqlite_master WHERE type='table'";
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, tables: rows.map(r => r.name) });
    });
});

module.exports = router;
