/**
 * ============================================
 * ENCRYPTION UTILITIES
 * ============================================
 * AES-256-GCM encryption for stored passwords
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from master password
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {string} masterPassword - User's master password (or server secret)
 * @returns {string} - Encrypted string (salt:iv:authTag:ciphertext in hex)
 */
function encrypt(plaintext, masterPassword) {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from password
    const key = deriveKey(masterPassword, salt);
    
    // Create cipher and encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Return combined string
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedData - Encrypted string from encrypt()
 * @param {string} masterPassword - User's master password (or server secret)
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedData, masterPassword) {
    try {
        // Split the encrypted data
        const [saltHex, ivHex, authTagHex, ciphertext] = encryptedData.split(':');
        
        const salt = Buffer.from(saltHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        // Derive key from password
        const key = deriveKey(masterPassword, salt);
        
        // Create decipher and decrypt
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        throw new Error('Decryption failed - invalid password or corrupted data');
    }
}

/**
 * Generate a secure random password
 * @param {number} length - Password length (default 16)
 * @returns {string} - Random password
 */
function generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
}

module.exports = {
    encrypt,
    decrypt,
    generateSecurePassword
};
