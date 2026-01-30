const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'coderun.db');

let db = null;

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create data directory if it doesn't exist
        const fs = require('fs');
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
            createTables()
                .then(resolve)
                .catch(reject);
        });
    });
}

async function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Problems table
            db.run(`CREATE TABLE IF NOT EXISTS problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
                category TEXT NOT NULL,
                function_signature_python TEXT,
                function_signature_javascript TEXT,
                test_cases TEXT NOT NULL,
                solution_python TEXT,
                solution_javascript TEXT,
                time_complexity TEXT,
                space_complexity TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Submissions table
            db.run(`CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                problem_id INTEGER NOT NULL,
                language TEXT CHECK(language IN ('python', 'javascript')) NOT NULL,
                code TEXT NOT NULL,
                status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'timeout')) NOT NULL,
                result TEXT,
                runtime_ms INTEGER,
                memory_kb INTEGER,
                test_results TEXT,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (problem_id) REFERENCES problems (id)
            )`);

            // User statistics table (simplified)
            db.run(`CREATE TABLE IF NOT EXISTS user_stats (
                user_id TEXT PRIMARY KEY,
                problems_solved INTEGER DEFAULT 0,
                total_submissions INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 0.0,
                average_runtime REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Test cases table for better organization
            db.run(`CREATE TABLE IF NOT EXISTS test_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_id INTEGER NOT NULL,
                input TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                is_sample BOOLEAN DEFAULT FALSE,
                is_hidden BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (problem_id) REFERENCES problems (id)
            )`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database tables created successfully');
                    resolve();
                }
            });
        });
    });
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    initializeDatabase,
    getDatabase,
    runQuery,
    getQuery,
    allQuery
};