-- ============================================
-- PASSWORD VAULT DATABASE SCHEMA
-- ============================================
-- Location: backend/database/schema.sql
-- ============================================
-- Database: password_vault
-- Run this SQL to create your database tables
-- ============================================

-- Create the database (if using MySQL/PostgreSQL)
-- CREATE DATABASE password_vault;
-- USE password_vault;

-- ============================================
-- TABLE 1: users
-- Stores user account information
-- ============================================
CREATE TABLE users (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,          -- Store bcrypt/argon2 hash, NEVER plain text
    email           VARCHAR(100) UNIQUE,            -- Optional email for recovery
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login      TIMESTAMP NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- ============================================
-- TABLE 2: credentials
-- Stores encrypted passwords for each user
-- ============================================
CREATE TABLE credentials (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    site_name       VARCHAR(100) NOT NULL,          -- Website/service name (e.g., "Google", "Netflix")
    site_url        VARCHAR(255),                   -- Optional URL
    username        VARCHAR(255) NOT NULL,          -- Username/email for the site
    password        VARCHAR(500) NOT NULL,          -- Encrypted password (use AES-256 encryption)
    notes           TEXT,                           -- Optional notes
    category        VARCHAR(50),                    -- Optional category (e.g., "Social", "Finance")
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_site_name (site_name)
);

-- ============================================
-- TABLE 3: sessions (for JWT token management)
-- Optional: Track active sessions
-- ============================================
CREATE TABLE sessions (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    token           VARCHAR(500) NOT NULL UNIQUE,   -- JWT token or session token
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address      VARCHAR(45),                    -- IPv4/IPv6 address
    user_agent      VARCHAR(255),                   -- Browser/device info
    is_valid        BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- ============================================
-- TABLE 4: audit_log (Optional but recommended)
-- Track security-sensitive actions
-- ============================================
CREATE TABLE audit_log (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT,
    action          VARCHAR(50) NOT NULL,           -- 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
    resource_type   VARCHAR(50),                    -- 'credential', 'user', 'session'
    resource_id     INT,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(255),
    details         JSON,                           -- Additional details as JSON
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);


-- ============================================
-- POSTGRESQL VERSION (if using PostgreSQL)
-- ============================================
/*
-- Uncomment this section for PostgreSQL

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE credentials (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_name       VARCHAR(100) NOT NULL,
    site_url        VARCHAR(255),
    username        VARCHAR(255) NOT NULL,
    password        VARCHAR(500) NOT NULL,
    notes           TEXT,
    category        VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(500) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(255),
    is_valid        BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
*/


-- ============================================
-- SQLITE VERSION (if using SQLite)
-- ============================================
/*
-- Uncomment this section for SQLite

CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    email           TEXT UNIQUE,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login      TEXT,
    is_active       INTEGER DEFAULT 1
);

CREATE TABLE credentials (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    site_name       TEXT NOT NULL,
    site_url        TEXT,
    username        TEXT NOT NULL,
    password        TEXT NOT NULL,
    notes           TEXT,
    category        TEXT,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    token           TEXT NOT NULL UNIQUE,
    expires_at      TEXT NOT NULL,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    ip_address      TEXT,
    user_agent      TEXT,
    is_valid        INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
*/
