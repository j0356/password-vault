/**
 * ============================================
 * DATABASE CONFIGURATION
 * ============================================
 * Supports MySQL, PostgreSQL, and SQLite
 */

const mysql = require('mysql2/promise');
// const { Pool } = require('pg'); // Uncomment for PostgreSQL
// const sqlite3 = require('sqlite3'); // Uncomment for SQLite

// ============================================
// MYSQL CONFIGURATION (Default)
// ============================================

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'password_vault',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();

// ============================================
// QUERY HELPER
// ============================================

async function query(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results;
}

// ============================================
// POSTGRESQL CONFIGURATION (Alternative)
// ============================================
/*
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'password_vault',
    max: 10
});

async function query(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
}
*/

// ============================================
// SQLITE CONFIGURATION (Alternative)
// ============================================
/*
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const db = new sqlite3.Database(process.env.DB_PATH || './password_vault.db');

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        } else {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ insertId: this.lastID, affectedRows: this.changes });
            });
        }
    });
}
*/

module.exports = { pool, query };
