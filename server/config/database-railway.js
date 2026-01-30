const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

let db;
let isPostgres = false;

const initializeDatabase = async () => {
    try {
        // Check if DATABASE_URL (PostgreSQL) is available (Railway)
        if (process.env.DATABASE_URL) {
            console.log('Connecting to PostgreSQL database...');
            isPostgres = true;
            
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            
            db = pool;
            await createPostgresqlTables();
            console.log('Connected to PostgreSQL database');
            
        } else {
            // Fallback to SQLite for local development
            console.log('Connecting to SQLite database...');
            const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'coderun.db');
            const dbDir = path.dirname(dbPath);
            
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            
            db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('SQLite connection error:', err);
                    throw err;
                }
            });
            
            await createSqliteTables();
            console.log('Connected to SQLite database');
        }
        
        return db;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
};

const createPostgresqlTables = async () => {
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS problems (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
            category VARCHAR(100) NOT NULL,
            function_signature_python TEXT,
            function_signature_javascript TEXT,
            test_cases TEXT NOT NULL,
            solution_python TEXT,
            solution_javascript TEXT,
            constraints TEXT,
            examples TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            problem_id INTEGER REFERENCES problems(id),
            code TEXT NOT NULL,
            language VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            test_results TEXT,
            execution_time INTEGER,
            memory_used INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
        CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
    `;
    
    await db.query(createTablesSQL);
};

const createSqliteTables = () => {
    return new Promise((resolve, reject) => {
        const createTablesSQL = `
            CREATE TABLE IF NOT EXISTS problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
                category TEXT NOT NULL,
                function_signature_python TEXT,
                function_signature_javascript TEXT,
                test_cases TEXT NOT NULL,
                solution_python TEXT,
                solution_javascript TEXT,
                constraints TEXT,
                examples TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_id INTEGER,
                code TEXT NOT NULL,
                language TEXT NOT NULL,
                status TEXT NOT NULL,
                test_results TEXT,
                execution_time INTEGER,
                memory_used INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (problem_id) REFERENCES problems (id)
            );

            CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
            CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
            CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
        `;
        
        db.exec(createTablesSQL, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Database tables created successfully');
                resolve();
            }
        });
    });
};

const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
};

const query = async (sql, params = []) => {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return result.rows;
    } else {
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
};

const run = async (sql, params = []) => {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return { 
            lastID: result.rows[0]?.id,
            changes: result.rowCount 
        };
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        lastID: this.lastID, 
                        changes: this.changes 
                    });
                }
            });
        });
    }
};

const get = async (sql, params = []) => {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return result.rows[0];
    } else {
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
};

module.exports = {
    initializeDatabase,
    getDatabase,
    query,
    run,
    get,
    isPostgres: () => isPostgres
};