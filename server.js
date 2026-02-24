const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/database/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./src/routes/auth');
const queryRoutes = require('./src/routes/query');

app.use('/api/auth', authRoutes);
app.use('/api/query', queryRoutes);

// Fallback middleware for SPA behavior
app.use((req, res) => {
    // If request route starts with /api it shouldn't fall here if it's not handled
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Keep-alive for environment issues
setInterval(() => { }, 1000 * 60 * 60);
