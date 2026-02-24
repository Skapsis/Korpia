const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Initialize tables if they don't exist
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'viewer',
            last_login DATETIME
        )`);

        // Insert default admin user if not exists
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                // In a real app, passwords should be hashed (e.g. bcrypt). Storing plaintext here for MVP presentation.
                db.run("INSERT INTO users (name, email, password, role) VALUES ('Admin User', 'admin@solvex.com', 'admin123', 'admin')");
            }
        });

        // Sample Commercial Data Table
        db.run(`CREATE TABLE IF NOT EXISTS commercial_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            revenue REAL NOT NULL,
            region TEXT NOT NULL,
            product_category TEXT NOT NULL
        )`);

        db.get("SELECT count(*) as count FROM commercial_sales", (err, row) => {
            if (row && row.count === 0) {
                seedCommercialData();
            }
        });

        // Operations Data Table
        db.run(`CREATE TABLE IF NOT EXISTS operations_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            efficiency_score REAL NOT NULL,
            department TEXT NOT NULL,
            downtime_minutes INTEGER NOT NULL
        )`);

        db.get("SELECT count(*) as count FROM operations_metrics", (err, row) => {
            if (row && row.count === 0) {
                seedOperationsData();
            }
        });
    });
}

function seedCommercialData() {
    console.log("Seeding commercial data...");
    const stmt = db.prepare("INSERT INTO commercial_sales (date, revenue, region, product_category) VALUES (?, ?, ?, ?)");

    // Generate dates for the last 6 months
    const today = new Date();
    const regions = ['North America', 'Europe', 'LATAM', 'APAC'];
    const categories = ['Software', 'Hardware', 'Services'];

    for (let i = 0; i < 100; i++) {
        const randomDate = new Date(today.getTime() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
        const dateStr = randomDate.toISOString().split('T')[0];
        const revenue = (Math.random() * 50000) + 5000;
        const region = regions[Math.floor(Math.random() * regions.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];

        stmt.run(dateStr, revenue.toFixed(2), region, category);
    }
    stmt.finalize();
}

function seedOperationsData() {
    console.log("Seeding operations data...");
    const stmt = db.prepare("INSERT INTO operations_metrics (date, efficiency_score, department, downtime_minutes) VALUES (?, ?, ?, ?)");

    const today = new Date();
    const departments = ['Manufacturing', 'Logistics', 'Customer Support', 'IT Infrastructure'];

    for (let i = 0; i < 60; i++) {
        const randomDate = new Date(today.getTime() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000);
        const dateStr = randomDate.toISOString().split('T')[0];
        const score = (Math.random() * 30) + 70; // 70 to 100
        const dept = departments[Math.floor(Math.random() * departments.length)];
        const downtime = Math.floor(Math.random() * 120);

        stmt.run(dateStr, score.toFixed(1), dept, downtime);
    }
    stmt.finalize();
}

module.exports = db;
