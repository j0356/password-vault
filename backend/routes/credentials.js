/**
 * ============================================
 * CREDENTIALS ROUTES
 * ============================================
 * /api/credentials/*
 * All routes require authentication
 */

const express = require('express');
const { query } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Encryption key - in production, use a more secure approach
// like deriving from user's master password or using a KMS
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'vault-server-encryption-key-change-me';

/**
 * GET /api/credentials
 * Get all credentials for authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;

        const credentials = await query(
            `SELECT id, site_name, site_url, username, password, notes, category, created_at, updated_at 
             FROM credentials 
             WHERE user_id = ? 
             ORDER BY site_name ASC`,
            [userId]
        );

        // Decrypt passwords before sending
        const decryptedCredentials = credentials.map(cred => ({
            ...cred,
            password: decrypt(cred.password, ENCRYPTION_KEY)
        }));

        res.json({ credentials: decryptedCredentials });

    } catch (error) {
        console.error('Get credentials error:', error);
        res.status(500).json({ message: 'Failed to retrieve credentials' });
    }
});

/**
 * GET /api/credentials/:id
 * Get single credential by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const credentialId = parseInt(req.params.id);

        const credentials = await query(
            `SELECT id, site_name, site_url, username, password, notes, category, created_at, updated_at 
             FROM credentials 
             WHERE id = ? AND user_id = ?`,
            [credentialId, userId]
        );

        if (credentials.length === 0) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        const credential = credentials[0];
        credential.password = decrypt(credential.password, ENCRYPTION_KEY);

        res.json({ credential });

    } catch (error) {
        console.error('Get credential error:', error);
        res.status(500).json({ message: 'Failed to retrieve credential' });
    }
});

/**
 * POST /api/credentials
 * Create new credential
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { site_name, site_url, username, password, notes, category } = req.body;

        // Validation
        if (!site_name || !username || !password) {
            return res.status(400).json({ message: 'Site name, username, and password are required' });
        }

        // Encrypt password before storing
        const encryptedPassword = encrypt(password, ENCRYPTION_KEY);

        const result = await query(
            `INSERT INTO credentials (user_id, site_name, site_url, username, password, notes, category) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, site_name, site_url || null, username, encryptedPassword, notes || null, category || null]
        );

        const credential = {
            id: result.insertId,
            site_name,
            site_url: site_url || null,
            username,
            password, // Return unencrypted for immediate UI use
            notes: notes || null,
            category: category || null,
            created_at: new Date().toISOString()
        };

        res.status(201).json({
            message: 'Credential created',
            credential
        });

    } catch (error) {
        console.error('Create credential error:', error);
        res.status(500).json({ message: 'Failed to create credential' });
    }
});

/**
 * PUT /api/credentials/:id
 * Update existing credential
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const credentialId = parseInt(req.params.id);
        const { site_name, site_url, username, password, notes, category } = req.body;

        // Check if credential exists and belongs to user
        const existing = await query(
            'SELECT id FROM credentials WHERE id = ? AND user_id = ?',
            [credentialId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (site_name !== undefined) {
            updates.push('site_name = ?');
            values.push(site_name);
        }
        if (site_url !== undefined) {
            updates.push('site_url = ?');
            values.push(site_url);
        }
        if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
        }
        if (password !== undefined) {
            updates.push('password = ?');
            values.push(encrypt(password, ENCRYPTION_KEY));
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(credentialId, userId);

        await query(
            `UPDATE credentials SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );

        // Fetch updated credential
        const updated = await query(
            `SELECT id, site_name, site_url, username, password, notes, category, created_at, updated_at 
             FROM credentials WHERE id = ?`,
            [credentialId]
        );

        const credential = updated[0];
        credential.password = decrypt(credential.password, ENCRYPTION_KEY);

        res.json({
            message: 'Credential updated',
            credential
        });

    } catch (error) {
        console.error('Update credential error:', error);
        res.status(500).json({ message: 'Failed to update credential' });
    }
});

/**
 * DELETE /api/credentials/:id
 * Delete credential
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const credentialId = parseInt(req.params.id);

        // Check if credential exists and belongs to user
        const existing = await query(
            'SELECT id FROM credentials WHERE id = ? AND user_id = ?',
            [credentialId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        await query(
            'DELETE FROM credentials WHERE id = ? AND user_id = ?',
            [credentialId, userId]
        );

        res.json({ message: 'Credential deleted' });

    } catch (error) {
        console.error('Delete credential error:', error);
        res.status(500).json({ message: 'Failed to delete credential' });
    }
});

/**
 * GET /api/credentials/search/:term
 * Search credentials by site name or username
 */
router.get('/search/:term', async (req, res) => {
    try {
        const userId = req.user.userId;
        const searchTerm = `%${req.params.term}%`;

        const credentials = await query(
            `SELECT id, site_name, site_url, username, password, notes, category, created_at, updated_at 
             FROM credentials 
             WHERE user_id = ? AND (site_name LIKE ? OR username LIKE ?)
             ORDER BY site_name ASC`,
            [userId, searchTerm, searchTerm]
        );

        const decryptedCredentials = credentials.map(cred => ({
            ...cred,
            password: decrypt(cred.password, ENCRYPTION_KEY)
        }));

        res.json({ credentials: decryptedCredentials });

    } catch (error) {
        console.error('Search credentials error:', error);
        res.status(500).json({ message: 'Failed to search credentials' });
    }
});

module.exports = router;
