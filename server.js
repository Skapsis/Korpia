const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

// Middleware
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (legacy HTML views)
app.use(express.static(path.join(__dirname, 'public')));

// === API Routes ===
const authRoutes           = require('./src/routes/auth');
const kpisRoutes           = require('./src/routes/kpis');
const kpiDefinitionsRoutes = require('./src/routes/kpiDefinitions');
const uploadRoutes         = require('./src/routes/upload');
const dashboardRoutes      = require('./src/routes/dashboard');
const configurationRoutes  = require('./src/routes/configuration');

app.use('/api/auth',            authRoutes);
app.use('/api/kpis',            kpisRoutes);
app.use('/api/kpi-definitions', kpiDefinitionsRoutes);
app.use('/api/upload-csv',      uploadRoutes);
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/configuration',   configurationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Legacy SQL query route (kept for backward compatibility)
try {
    const queryRoutes = require('./src/routes/query');
    app.use('/api/query', queryRoutes);
} catch (e) {
    console.warn('Legacy query route not loaded:', e.message);
}

// Fallback SPA middleware
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📋 Frontend expected at http://localhost:3001`);
});

// Keep-alive
setInterval(() => { }, 1000 * 60 * 60);
